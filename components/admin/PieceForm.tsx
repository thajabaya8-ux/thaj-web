'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/lib/adminContext';
import ImageUpload from './ImageUpload';
import MultiImageUpload from './MultiImageUpload';
import type { Collection, Piece } from '@/lib/types';

const AVAIL_OPTS = ['Available', 'Two remaining', 'By request', 'Pre-order', 'Archive only', 'Sold Out'];
const AVAIL_AR: Record<string, string> = {
  Available: 'متوفرة', 'Two remaining': 'باقي قطعتان', 'By request': 'حسب الطلب', 'Pre-order': 'حجز مسبق',
  'Archive only': 'أرشيف فقط', 'Sold Out': 'نفدت الكمية'
};

export default function PieceForm({ piece, collections, defaultCollKey, onSaved }: {
  piece?: Piece; collections: Collection[]; defaultCollKey?: string; onSaved?: () => void;
}) {
  const isNew = !piece;
  const { call, toast, L, AR } = useAdmin();
  const router = useRouter();
  const [images, setImages] = useState<string[]>(piece?.images || []);
  const [hasPants, setHasPants] = useState(!!piece?.pantsImg);
  const [pantsImg, setPantsImg] = useState(piece?.pantsImg || '');
  const [currency, setCurrency] = useState<'SAR' | 'EGP'>(piece?.currency || 'SAR');
  const [coll, setColl] = useState(piece?.coll || defaultCollKey || '');
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;
    const val = (n: string) => (f.elements.namedItem(n) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;

    if (!images.length) { toast(L('At least one photo of the piece is required', 'لازم صورة واحدة على الأقل للقطعة')); return; }
    if (hasPants && !pantsImg) { toast(L('Add a trouser photo, or turn the trousers toggle off', 'ضيفي صورة البنطلون، أو ألغي خيار البنطلون')); return; }

    const body = {
      id: val('id'), ed: val('ed'), n: val('n'), ar: val('ar'),
      price: parseInt(val('price'), 10) || 0, currency, coll,
      fabric: val('fabric'), sil: val('sil'), colour: val('colour'), occ: val('occ'), av: val('av'),
      mat: val('mat'), matAr: val('matAr'), silf: val('silf'), silfAr: val('silfAr'),
      pal: val('pal'), palAr: val('palAr'), d: val('d'), dAr: val('dAr'),
      story: val('story').split('\n').map((s) => s.trim()).filter(Boolean),
      storyAr: val('storyAr').split('\n').map((s) => s.trim()).filter(Boolean),
      images,
      pantsImg: hasPants ? pantsImg : '',
      pantsPrice: hasPants ? (parseInt(val('pantsPrice'), 10) || 0) : null,
      salePrice: val('salePrice') ? parseInt(val('salePrice'), 10) : null
    };
    setSaving(true);
    try {
      if (isNew) await call('/pieces', { method: 'POST', body: JSON.stringify(body) });
      else await call(`/pieces/${piece.id}`, { method: 'PUT', body: JSON.stringify(body) });
      toast(L('Saved', 'اتحفظت'));
      if (onSaved) onSaved(); else router.push(coll ? `/admin/collections/${coll}` : '/admin/collections');
    } catch (err) { toast(err instanceof Error ? err.message : String(err)); }
    finally { setSaving(false); }
  };

  const v = (k: keyof Piece, d: string | number = '') => piece?.[k] ?? d;

  return (
    <form className="form" style={{ maxWidth: 760 }} onSubmit={onSubmit}>
      <div className="f2">
        <div className="field"><label>{L('ID (slug)', 'المعرّف (slug)')}</label><input name="id" defaultValue={v('id')} readOnly={!isNew} required pattern="[a-z0-9]+(-[a-z0-9]+)*" title="lowercase letters, numbers, hyphens" placeholder="e.g. najma" /></div>
        <div className="field"><label>{L('Edition', 'الإصدار')}</label><input name="ed" defaultValue={v('ed')} placeholder="ED. 001" /></div>
      </div>
      <div className="f2">
        <div className="field"><label>{L('Name (EN)', 'الاسم (إنجليزي)')}</label><input name="n" defaultValue={v('n')} required /></div>
        <div className="field"><label>{L('Name (AR)', 'الاسم (عربي)')}</label><input name="ar" defaultValue={v('ar')} required /></div>
      </div>
      <div className="f2">
        <div className="field"><label>{L('Price', 'السعر')}</label><input name="price" type="number" min="0" defaultValue={v('price', 0)} required /></div>
        <div className="field"><label>{L('Currency', 'العملة')}</label>
          <select name="currency" value={currency} onChange={(e) => setCurrency(e.target.value as 'SAR' | 'EGP')}>
            <option value="SAR">{L('Saudi Riyal (SAR)', 'ريال سعودي (SAR)')}</option>
            <option value="EGP">{L('Egyptian Pound (EGP)', 'جنيه مصري (EGP)')}</option>
          </select>
        </div>
      </div>
      <div className="field"><label>{L('Category', 'الفئة')}</label>
        <select name="coll" value={coll} onChange={(e) => setColl(e.target.value)} required>
          <option value="" disabled>{L('Choose a category', 'اختاري فئة')}</option>
          {collections.map((c) => <option key={c.key} value={c.key}>{AR() ? c.nameAr : c.name}</option>)}
        </select>
      </div>
      <div className="f2">
        <div className="field"><label>{L('Fabric (facet)', 'القماش (فلتر)')}</label><input name="fabric" defaultValue={v('fabric')} /></div>
        <div className="field"><label>{L('Silhouette (facet)', 'السيلويت (فلتر)')}</label><input name="sil" defaultValue={v('sil')} /></div>
      </div>
      <div className="f2">
        <div className="field"><label>{L('Colour (facet)', 'اللون (فلتر)')}</label><input name="colour" defaultValue={v('colour')} /></div>
        <div className="field"><label>{L('Occasion (facet)', 'المناسبة (فلتر)')}</label><input name="occ" defaultValue={v('occ')} /></div>
      </div>
      <div className="f2">
        <div className="field"><label>{L('Availability', 'التوفر')}</label>
          <select name="av" defaultValue={v('av', 'Available')}>{AVAIL_OPTS.map((o) => <option key={o} value={o}>{AR() ? AVAIL_AR[o] : o}</option>)}</select>
        </div>
        <div className="field"><label>{L(`Sale price (${currency}, optional)`, `سعر العرض (${currency === 'EGP' ? 'جنيه مصري' : 'ريال سعودي'}، اختياري)`)}</label>
          <input name="salePrice" type="number" min="0" defaultValue={piece?.salePrice ?? ''} placeholder={L('Leave empty for no discount', 'سيبيه فاضي لو مفيش خصم')} />
        </div>
      </div>
      <div className="f2">
        <div className="field"><label>{L('Material (EN)', 'الخامة (إنجليزي)')}</label><input name="mat" defaultValue={v('mat')} /></div>
        <div className="field"><label>{L('Material (AR)', 'الخامة (عربي)')}</label><input name="matAr" defaultValue={v('matAr')} /></div>
      </div>
      <div className="f2">
        <div className="field"><label>{L('Silhouette detail (EN)', 'تفاصيل السيلويت (إنجليزي)')}</label><input name="silf" defaultValue={v('silf')} /></div>
        <div className="field"><label>{L('Silhouette detail (AR)', 'تفاصيل السيلويت (عربي)')}</label><input name="silfAr" defaultValue={v('silfAr')} /></div>
      </div>
      <div className="f2">
        <div className="field"><label>{L('Palette (EN)', 'الألوان (إنجليزي)')}</label><input name="pal" defaultValue={v('pal')} /></div>
        <div className="field"><label>{L('Palette (AR)', 'الألوان (عربي)')}</label><input name="palAr" defaultValue={v('palAr')} /></div>
      </div>
      <div className="f2">
        <div className="field"><label>{L('Description (EN)', 'الوصف (إنجليزي)')}</label><textarea name="d" defaultValue={v('d')} /></div>
        <div className="field"><label>{L('Description (AR)', 'الوصف (عربي)')}</label><textarea name="dAr" defaultValue={v('dAr')} /></div>
      </div>
      <div className="f2">
        <div className="field"><label>{L('Story paragraphs (EN, one per line)', 'فقرات القصة (إنجليزي، سطر لكل فقرة)')}</label><textarea name="story" style={{ minHeight: 110 }} defaultValue={(piece?.story || []).join('\n')} /></div>
        <div className="field"><label>{L('Story paragraphs (AR, one per line)', 'فقرات القصة (عربي، سطر لكل فقرة)')}</label><textarea name="storyAr" style={{ minHeight: 110 }} defaultValue={(piece?.storyAr || []).join('\n')} /></div>
      </div>
      <MultiImageUpload value={images} onChange={setImages} label={L('Piece photos (up to 5 — first is the cover)', 'صور القطعة (لغاية 5 — أول صورة هي الغلاف)')} />

      <div className="adm-pants">
        <label className="adm-pants-toggle">
          <input type="checkbox" checked={hasPants} onChange={(e) => setHasPants(e.target.checked)} />
          <span>{L('This piece includes matching trousers', 'القطعة دي بيها بنطلون مطابق')}</span>
        </label>
        {hasPants && (
          <div className="adm-pants-body">
            <ImageUpload value={pantsImg} onChange={setPantsImg} />
            <div className="field"><label>{L(`Trousers price (${currency})`, `سعر البنطلون (${currency === 'EGP' ? 'جنيه مصري' : 'ريال سعودي'})`)}</label><input name="pantsPrice" type="number" min="0" defaultValue={piece?.pantsPrice ?? 0} required /></div>
          </div>
        )}
      </div>

      <button className="btn fill" style={{ width: 'max-content' }} type="submit" disabled={saving}>
        {saving ? L('Saving…', 'بيتحفظ…') : isNew ? L('Create piece', 'إنشاء القطعة') : L('Save changes', 'حفظ التعديلات')}
      </button>
    </form>
  );
}
