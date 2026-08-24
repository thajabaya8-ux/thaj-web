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

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'piece';
}

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
  const [visible, setVisible] = useState(piece?.visible ?? true);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;
    const val = (n: string) => (f.elements.namedItem(n) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;

    if (!images.length) { toast(L('At least one photo of the piece is required', 'لازم صورة واحدة على الأقل للقطعة')); return; }
    if (hasPants && !pantsImg) { toast(L('Add a trouser photo, or turn the trousers toggle off', 'ضيفي صورة البنطلون، أو ألغي خيار البنطلون')); return; }

    const n = val('n');
    const body = {
      id: isNew ? slugify(n) : piece.id, n, ar: val('ar'),
      price: parseInt(val('price'), 10) || 0, currency, coll,
      fabric: val('fabric'), sil: val('sil'), colour: val('colour'), occ: val('occ'), av: val('av'),
      d: val('d'), dAr: val('dAr'),
      images,
      pantsImg: hasPants ? pantsImg : '',
      pantsPrice: hasPants ? (parseInt(val('pantsPrice'), 10) || 0) : null,
      salePrice: val('salePrice') ? parseInt(val('salePrice'), 10) : null,
      visible,
      stock: parseInt(val('stock'), 10) || 0
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

  const v = (k: keyof Piece, d: string | number = '') => (piece?.[k] as string | number | undefined) ?? d;

  return (
    <form className="form" style={{ maxWidth: 600 }} onSubmit={onSubmit}>
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
      <label className="adm-pants-toggle">
        <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
        <span>{L('Show this piece on the site', 'اعرضي القطعة دي في الموقع')}</span>
      </label>
      <div className="f2">
        <div className="field"><label>{L('Availability', 'التوفر')}</label>
          <select name="av" defaultValue={v('av', 'Available')}>{AVAIL_OPTS.map((o) => <option key={o} value={o}>{AR() ? AVAIL_AR[o] : o}</option>)}</select>
        </div>
        <div className="field"><label>{L('Stock (pieces available)', 'المخزون (عدد القطع المتاحة)')}</label>
          <input name="stock" type="number" min="0" defaultValue={v('stock', 999)} required />
        </div>
      </div>
      <div className="field"><label>{L(`Sale price (${currency}, optional)`, `سعر العرض (${currency === 'EGP' ? 'جنيه مصري' : 'ريال سعودي'}، اختياري)`)}</label>
        <input name="salePrice" type="number" min="0" defaultValue={piece?.salePrice ?? ''} placeholder={L('Leave empty for no discount', 'سيبيه فاضي لو مفيش خصم')} />
      </div>
      <div className="f2">
        <div className="field"><label>{L('Fabric (shop filter)', 'القماش (فلتر المتجر)')}</label><input name="fabric" defaultValue={v('fabric')} placeholder="Silk" /></div>
        <div className="field"><label>{L('Silhouette (shop filter)', 'السيلويت (فلتر المتجر)')}</label><input name="sil" defaultValue={v('sil')} placeholder="Column" /></div>
      </div>
      <div className="f2">
        <div className="field"><label>{L('Colour (shop filter)', 'اللون (فلتر المتجر)')}</label><input name="colour" defaultValue={v('colour')} placeholder="Black" /></div>
        <div className="field"><label>{L('Occasion (shop filter)', 'المناسبة (فلتر المتجر)')}</label><input name="occ" defaultValue={v('occ')} placeholder="Evening" /></div>
      </div>
      <div className="f2">
        <div className="field"><label>{L('Description (EN)', 'الوصف (إنجليزي)')}</label><textarea name="d" defaultValue={v('d')} /></div>
        <div className="field"><label>{L('Description (AR)', 'الوصف (عربي)')}</label><textarea name="dAr" defaultValue={v('dAr')} /></div>
      </div>
      <MultiImageUpload value={images} onChange={setImages} label={L('Piece photos (up to 10 — first is the cover)', 'صور القطعة (لغاية 10 — أول صورة هي الغلاف)')} />

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
