'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/lib/adminContext';
import { SIZES, sizeRangeLabel } from '@/lib/siteContext';
import ImageUpload from './ImageUpload';
import MultiImageUpload from './MultiImageUpload';
import type { Collection, Piece, PieceColor } from '@/lib/types';

let colorKeySeq = 0;
const newColor = (): PieceColor & { key: number } => ({
  key: colorKeySeq++, id: '', nameEn: '', nameAr: '', hex: '#1B271F', images: [], stock: 999, reserved: 0, soldOut: false
});

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
  const [featured, setFeatured] = useState(piece?.featured ?? false);
  const [colors, setColors] = useState<(PieceColor & { key: number })[]>(
    () => (piece?.colors || []).map((c) => ({ ...c, key: colorKeySeq++ }))
  );
  const [sizes, setSizes] = useState<string[]>(piece?.sizes || []);
  const [saving, setSaving] = useState(false);

  const updateColor = (i: number, patch: Partial<PieceColor>) =>
    setColors((cur) => cur.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const removeColor = (i: number) => setColors((cur) => cur.filter((_, idx) => idx !== i));
  const toggleSize = (s: string, on: boolean) =>
    setSizes((cur) => (on ? [...cur, s] : cur.filter((x) => x !== s)));

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;
    const val = (n: string) => (f.elements.namedItem(n) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;

    if (!images.length) { toast(L('At least one photo of the piece is required', 'لازم صورة واحدة على الأقل للقطعة')); return; }
    if (hasPants && !pantsImg) { toast(L('Add a trouser photo, or turn the trousers toggle off', 'ضيفي صورة البنطلون، أو ألغي خيار البنطلون')); return; }
    if (colors.some((c) => !c.nameEn.trim() || !c.nameAr.trim())) { toast(L('Every colour needs a name in both languages', 'كل لون محتاج اسم بالإنجليزي والعربي')); return; }
    if (colors.some((c) => !c.images.length)) { toast(L('Every colour needs at least one photo', 'كل لون محتاج صورة واحدة على الأقل')); return; }

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
      stock: parseInt(val('stock'), 10) || 0,
      featured,
      // reserved is never admin-set — it's dropped here too, on top of the
      // server ignoring it, so it's obvious from the payload alone that
      // this isn't a field the form controls.
      colors: colors.map(({ key: _key, reserved: _reserved, ...c }) => c),
      sizes
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
      <label className="adm-pants-toggle">
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
        <span>{L('Feature on the homepage', 'اعرضيها في الصفحة الرئيسية')}</span>
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

      <div className="field">
        <label>{L('Available heights (cm)', 'الأطوال المتاحة (سم)')}</label>
        <div className="adm-size-checks">
          {SIZES.map((s) => (
            <label key={s} className={`adm-size-check ${sizes.includes(s) ? 'on' : ''}`}>
              <input type="checkbox" checked={sizes.includes(s)} onChange={(e) => toggleSize(s, e.target.checked)} />
              <span>{s}</span>
            </label>
          ))}
        </div>
        <p className="body" style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 6 }}>
          {L('Leave all unchecked to offer every height.', 'سيبيهم كلهم من غير اختيار عشان كل الأطوال تتاح.')}
        </p>
        <p className="body" style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4, lineHeight: 1.9 }}>
          {SIZES.map((s) => {
            const r = sizeRangeLabel(s)!;
            return L(`${s}: ${r.en}. `, `${s}: ${r.ar}. `);
          })}
        </p>
      </div>

      <div className="adm-colors">
        <label>{L('Colour variants (optional)', 'الألوان (اختياري)')}</label>
        <p className="body" style={{ fontSize: 11, color: 'var(--ink-faint)', margin: '2px 0 14px' }}>
          {L('Each colour gets its own photos — once any colour is added, its photos replace the piece photos above on the product page. No colours means the piece just shows the photos above, like today.', 'كل لون بصوره بتاعته — أول ما تضيفي لون، صوره بتحل محل صور القطعة اللي فوق في صفحة المنتج. من غير ألوان، القطعة بتفضل تعرض الصور اللي فوق زي ما هي دلوقتي.')}
        </p>
        {colors.map((c, i) => (
          <div className="adm-color-card" key={c.key}>
            <div className="adm-color-head">
              <input type="color" value={c.hex} onChange={(e) => updateColor(i, { hex: e.target.value })} aria-label={L('Swatch colour', 'لون العينة')} />
              <input value={c.nameEn} onChange={(e) => updateColor(i, { nameEn: e.target.value })} placeholder={L('Name (EN)', 'الاسم (إنجليزي)')} />
              <input value={c.nameAr} onChange={(e) => updateColor(i, { nameAr: e.target.value })} placeholder={L('Name (AR)', 'الاسم (عربي)')} dir="rtl" />
              <button type="button" className="rm" onClick={() => removeColor(i)} aria-label={L('Remove colour', 'حذف اللون')}>×</button>
            </div>
            <div className="adm-color-stock">
              <div className="field">
                <label>{L('Stock (this colour)', 'المخزون (اللون ده)')}</label>
                <input
                  type="number" min="0" value={c.stock}
                  onChange={(e) => updateColor(i, { stock: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                />
              </div>
              <label className="adm-pants-toggle" style={{ marginTop: 0 }}>
                <input type="checkbox" checked={c.soldOut} onChange={(e) => updateColor(i, { soldOut: e.target.checked })} />
                <span>{L('Mark as Sold Out', 'حددها نفدت الكمية')}</span>
              </label>
            </div>
            {c.stock <= 0 && !c.soldOut && (
              <p className="body" style={{ fontSize: 10.5, color: 'var(--ink-faint)', margin: '2px 0 12px' }}>
                {L('Stock is 0 — this colour will show as Sold Out to customers automatically.', 'المخزون صفر — اللون ده هيظهر للعميل نفدت الكمية تلقائيًا.')}
              </p>
            )}
            <MultiImageUpload
              value={c.images} onChange={(imgs) => updateColor(i, { images: imgs })}
              label={L('Photos for this colour', 'صور اللون ده')}
            />
          </div>
        ))}
        <button type="button" className="btn" onClick={() => setColors((cur) => [...cur, newColor()])}>
          {L('+ Add colour', '+ إضافة لون')}
        </button>
      </div>

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
