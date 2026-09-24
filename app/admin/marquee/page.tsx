'use client';
import { useEffect, useState } from 'react';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin, abs } from '@/lib/adminContext';
import ImageUpload from '@/components/admin/ImageUpload';
import { marqueeItemImg } from '@/lib/marqueeItem';
import type { MarqueeItem, Piece } from '@/lib/types';

export default function MarqueePage() {
  const { data: allPieces, loading: loadingAll } = useAdminFetch<Piece[]>('/pieces');
  const { data: current, loading: loadingCurrent } = useAdminFetch<MarqueeItem[]>('/marquee');
  const { call, toast, L, AR } = useAdmin();
  const [selected, setSelected] = useState<MarqueeItem[] | null>(null);
  const [addId, setAddId] = useState('');
  const [bannerImg, setBannerImg] = useState('');
  const [bannerCaption, setBannerCaption] = useState('');
  const [bannerCaptionAr, setBannerCaptionAr] = useState('');
  const [saving, setSaving] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (current && selected === null) setSelected(current); }, [current, selected]);

  const loading = loadingAll || loadingCurrent || selected === null;
  const available = (allPieces || []).filter((p) => !(selected || []).some((s) => s.kind === 'piece' && s.piece.id === p.id));

  const addPiece = () => {
    const p = (allPieces || []).find((x) => x.id === addId);
    if (!p) return;
    setSelected((cur) => [...(cur || []), { kind: 'piece', piece: p }]);
    setAddId('');
  };
  const addBanner = () => {
    if (!bannerImg) { toast(L('Add a photo first', 'ضيفي صورة الأول')); return; }
    setSelected((cur) => [...(cur || []), { kind: 'image', img: bannerImg, caption: bannerCaption, captionAr: bannerCaptionAr }]);
    setBannerImg(''); setBannerCaption(''); setBannerCaptionAr('');
  };
  const remove = (i: number) => setSelected((cur) => (cur || []).filter((_, j) => j !== i));
  const move = (i: number, d: -1 | 1) => setSelected((cur) => {
    if (!cur) return cur;
    const j = i + d;
    if (j < 0 || j >= cur.length) return cur;
    const next = [...cur];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  const save = async () => {
    setSaving(true);
    try {
      const items = (selected || []).map((it) => it.kind === 'piece'
        ? { kind: 'piece', pieceId: it.piece.id }
        : { kind: 'image', img: it.img, caption: it.caption, captionAr: it.captionAr });
      await call('/marquee', { method: 'PUT', body: JSON.stringify({ items }) });
      toast(L('Saved', 'اتحفظت'));
    } catch (e) { toast(e instanceof Error ? e.message : String(e)); }
    finally { setSaving(false); }
  };

  if (loading) return null;

  return (
    <>
      <div className="adm-head">
        <h1>{L('Homepage strip', 'الشريط المتحرك')}</h1>
        <span className="lbl" style={{ color: 'var(--ink-faint)', maxWidth: 420, textAlign: 'end' }}>
          {L('The scrolling strip on the homepage shows only what you pick here, in this order — a piece from the catalogue, or a plain banner photo of your own (a holiday image, for example). Empty by default.', 'الشريط المتحرك في الصفحة الرئيسية بيعرض بس اللي تختاريه هنا، بنفس الترتيب — قطعة من الكتالوج، أو صورة بانر عادية (زي صورة مناسبة معينة). فاضي افتراضيًا.')}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <select value={addId} onChange={(e) => setAddId(e.target.value)} style={{ background: 'none', border: '1px solid var(--line)', padding: '10px 14px', fontSize: 12.5, flex: 1 }}>
          <option value="">{L('Choose a piece to add…', 'اختاري قطعة تضيفيها…')}</option>
          {available.map((p) => <option key={p.id} value={p.id}>{p.n} / {p.ar}</option>)}
        </select>
        <button className="btn" type="button" disabled={!addId} onClick={addPiece}>{L('Add', 'إضافة')}</button>
      </div>

      <div className="form" style={{ maxWidth: 420, marginBottom: 32, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
        <div className="lbl" style={{ color: 'var(--ink-faint)', marginBottom: 4 }}>{L('…or add a plain banner photo (not a product)', '…أو ضيفي صورة بانر عادية (مش منتج)')}</div>
        <ImageUpload value={bannerImg} onChange={setBannerImg} aspectRatio="3/4" />
        <div className="field"><label>{L('Caption (EN) — optional', 'الكابشن (إنجليزي) — اختياري')}</label><input value={bannerCaption} onChange={(e) => setBannerCaption(e.target.value)} /></div>
        <div className="field"><label>{L('Caption (AR) — optional', 'الكابشن (عربي) — اختياري')}</label><input value={bannerCaptionAr} onChange={(e) => setBannerCaptionAr(e.target.value)} /></div>
        <button className="btn" style={{ width: 'max-content' }} type="button" disabled={!bannerImg} onClick={addBanner}>{L('Add banner photo', 'إضافة صورة البانر')}</button>
      </div>

      {selected && selected.length ? selected.map((it, i) => (
        <div className="adm-row" style={{ gridTemplateColumns: '50px 2fr auto' }} key={i}>
          {marqueeItemImg(it) ? <img className="thumb" src={abs(marqueeItemImg(it))} alt="" /> : <span className="thumb" style={{ display: 'block', background: 'var(--sand)' }} />}
          {it.kind === 'piece' ? (
            <div><div className="h-s" style={{ fontSize: 15 }}>{it.piece.n}</div><div className="lbl" style={{ color: 'var(--ink-faint)' }}>{AR() ? it.piece.ar : ''}</div></div>
          ) : (
            <div><div className="h-s" style={{ fontSize: 15 }}>{it.caption || it.captionAr || L('Banner photo', 'صورة بانر')}</div><div className="lbl" style={{ color: 'var(--ink-faint)' }}>{AR() ? it.captionAr : ''}</div></div>
          )}
          <div className="actions" style={{ gap: 10 }}>
            <span onClick={() => move(i, -1)} style={{ opacity: i === 0 ? .3 : 1, cursor: i === 0 ? 'default' : 'pointer' }}>‹</span>
            <span onClick={() => move(i, 1)} style={{ opacity: i === selected.length - 1 ? .3 : 1, cursor: i === selected.length - 1 ? 'default' : 'pointer' }}>›</span>
            <span onClick={() => remove(i)}>{L('Remove', 'إزالة')}</span>
          </div>
        </div>
      )) : <p className="body" style={{ padding: '26px 0' }}>{L('Nothing picked yet — the strip is hidden on the site until you add something.', 'مفيش حاجة متختارة لسه — الشريط مختفي في الموقع لحد ما تضيفي حاجة.')}</p>}

      <button className="btn fill" style={{ width: 'max-content', marginTop: 24 }} disabled={saving} onClick={save}>
        {saving ? L('Saving…', 'بيتحفظ…') : L('Save order', 'حفظ الترتيب')}
      </button>
    </>
  );
}
