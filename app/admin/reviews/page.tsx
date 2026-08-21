'use client';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin } from '@/lib/adminContext';
import type { Review } from '@/lib/types';

export default function ReviewsPage() {
  const { data: reviews, loading, error, reload } = useAdminFetch<Review[]>('/reviews');
  const { call, toast, L, AR } = useAdmin();

  const onDelete = async (id: number) => {
    try { await call(`/reviews/${id}`, { method: 'DELETE' }); reload(); toast(L('Deleted', 'اتمسحت')); }
    catch (e) { toast(e instanceof Error ? e.message : String(e)); }
  };

  if (loading) return null;
  if (error) return <p className="body" style={{ padding: '40px 0', color: '#B75B5B' }}>{error}</p>;
  if (!reviews) return null;

  return (
    <>
      <div className="adm-head"><h1>{L('Reviews & requests', 'الرسائل والطلبات')}</h1></div>
      <div className="adm-row adm-row-head" style={{ gridTemplateColumns: '1fr 1.2fr 2fr 120px 90px' }}>
        <span>{L('Piece', 'القطعة')}</span><span>{L('From', 'من')}</span><span>{L('Message', 'الرسالة')}</span><span>{L('Date', 'التاريخ')}</span><span></span>
      </div>
      {reviews.length ? reviews.map((r) => (
        <div className="adm-row" style={{ gridTemplateColumns: '1fr 1.2fr 2fr 120px 90px', alignItems: 'start' }} key={r.id}>
          <span>{(AR() ? r.pieceNameAr : r.pieceName) || r.pieceId}</span>
          <div><span>{r.name}</span>{r.email ? <div className="lbl" style={{ color: 'var(--ink-faint)' }}>{r.email}</div> : null}</div>
          <span className="body" style={{ fontSize: 12.5, lineHeight: 1.6 }}>{r.message}</span>
          <span className="body" style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{new Date(r.d).toLocaleDateString(AR() ? 'ar-SA' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          <button className="link" onClick={() => onDelete(r.id)}>{L('Delete', 'حذف')}</button>
        </div>
      )) : <p className="body" style={{ padding: '26px 0' }}>{L('No reviews yet.', 'مافيش رسايل لسه.')}</p>}
    </>
  );
}
