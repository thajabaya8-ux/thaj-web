'use client';
import { useState } from 'react';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin, abs } from '@/lib/adminContext';
import ImageUpload from '@/components/admin/ImageUpload';
import type { ReviewPhoto } from '@/lib/types';

export default function ReviewPhotosPage() {
  const { data: photos, loading, error, reload } = useAdminFetch<ReviewPhoto[]>('/review-photos');
  const { call, toast, L, AR } = useAdmin();
  const [img, setImg] = useState('');
  const [caption, setCaption] = useState('');
  const [captionAr, setCaptionAr] = useState('');
  const [saving, setSaving] = useState(false);

  const onAdd = async () => {
    if (!img) { toast(L('Add a photo first', 'ضيفي صورة الأول')); return; }
    setSaving(true);
    try {
      await call('/review-photos', { method: 'POST', body: JSON.stringify({ img, caption, captionAr }) });
      setImg(''); setCaption(''); setCaptionAr('');
      toast(L('Added', 'اتضافت'));
      reload();
    } catch (e) { toast(e instanceof Error ? e.message : String(e)); }
    finally { setSaving(false); }
  };

  const onDelete = async (id: number) => {
    if (!confirm(L('Delete this photo?', 'تحذفي الصورة دي؟'))) return;
    try { await call(`/review-photos/${id}`, { method: 'DELETE' }); toast(L('Deleted', 'اتمسحت')); reload(); }
    catch (e) { toast(e instanceof Error ? e.message : String(e)); }
  };

  // Swaps just the two affected rows' own `sort` values — no separate
  // bulk-reorder endpoint, same one-PUT-per-row shape every other admin
  // edit here already uses.
  const move = async (list: ReviewPhoto[], i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const a = list[i], b = list[j];
    try {
      await Promise.all([
        call(`/review-photos/${a.id}`, { method: 'PUT', body: JSON.stringify({ sort: b.sort }) }),
        call(`/review-photos/${b.id}`, { method: 'PUT', body: JSON.stringify({ sort: a.sort }) })
      ]);
      reload();
    } catch (e) { toast(e instanceof Error ? e.message : String(e)); }
  };

  if (loading) return null;
  if (error) return <p className="body" style={{ padding: '40px 0', color: '#B75B5B' }}>{error}</p>;
  if (!photos) return null;

  return (
    <>
      <div className="adm-head">
        <h1>{L('Customer reviews', 'آراء العميلات')}</h1>
        <span className="lbl" style={{ color: 'var(--ink-faint)', maxWidth: 420, textAlign: 'end' }}>
          {L('Photos customers send you — add one with a caption and it shows near the bottom of the homepage.', 'صور بتوصلك من العميلات — ضيفي صورة مع كابشن وتظهر في آخر الصفحة الرئيسية.')}
        </span>
      </div>

      <div className="form" style={{ maxWidth: 420, marginBottom: 32 }}>
        <ImageUpload value={img} onChange={setImg} aspectRatio="3/4" />
        <div className="field"><label>{L('Caption (EN)', 'الكابشن (إنجليزي)')}</label><input value={caption} onChange={(e) => setCaption(e.target.value)} /></div>
        <div className="field"><label>{L('Caption (AR)', 'الكابشن (عربي)')}</label><input value={captionAr} onChange={(e) => setCaptionAr(e.target.value)} /></div>
        <button className="btn fill" style={{ width: 'max-content' }} type="button" disabled={saving} onClick={onAdd}>
          {saving ? L('Adding…', 'بتتضاف…') : L('Add photo', 'إضافة الصورة')}
        </button>
      </div>

      {photos.length ? photos.map((p, i) => (
        <div className="adm-row" style={{ gridTemplateColumns: '50px 2fr auto' }} key={p.id}>
          <img className="thumb" src={abs(p.img)} alt="" />
          <div className="body" style={{ fontSize: 13 }}>{(AR() ? p.captionAr : p.caption) || p.caption || p.captionAr}</div>
          <div className="actions" style={{ gap: 10 }}>
            <span onClick={() => move(photos, i, -1)} style={{ opacity: i === 0 ? .3 : 1, cursor: i === 0 ? 'default' : 'pointer' }}>‹</span>
            <span onClick={() => move(photos, i, 1)} style={{ opacity: i === photos.length - 1 ? .3 : 1, cursor: i === photos.length - 1 ? 'default' : 'pointer' }}>›</span>
            <span onClick={() => onDelete(p.id)}>{L('Delete', 'حذف')}</span>
          </div>
        </div>
      )) : <p className="body" style={{ padding: '26px 0' }}>{L('No photos yet — add the first one above.', 'مافيش صور لسه — ضيفي أول واحدة فوق.')}</p>}
    </>
  );
}
