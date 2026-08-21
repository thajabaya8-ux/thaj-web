'use client';
import Link from 'next/link';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin, SAR, abs } from '@/lib/adminContext';
import type { Collection, Piece } from '@/lib/types';

export default function PiecesPage() {
  const { data: pieces, loading, error, reload } = useAdminFetch<Piece[]>('/pieces');
  const { data: collections } = useAdminFetch<Collection[]>('/collections');
  const { call, toast, L, AR } = useAdmin();

  const collName = (k: string) => {
    const c = collections?.find((c) => c.key === k);
    if (!c) return '—';
    return AR() ? c.nameAr : c.name;
  };

  const onDelete = async (id: string) => {
    if (!confirm(L('Delete this piece? This cannot be undone.', 'تحذفي القطعة دي؟ الخطوة دي ما بترجعش.'))) return;
    try { await call(`/pieces/${id}`, { method: 'DELETE' }); toast(L('Deleted', 'اتمسحت')); reload(); }
    catch (e) { toast(e instanceof Error ? e.message : String(e)); }
  };

  if (loading) return null;
  if (error) return <p className="body" style={{ padding: '40px 0', color: '#B75B5B' }}>{error}</p>;
  if (!pieces) return null;

  return (
    <>
      <div className="adm-head"><h1>{L('Pieces', 'القطع')}</h1><Link className="btn fill" href="/admin/pieces/new">{L('New piece', 'قطعة جديدة')}</Link></div>
      <div className="adm-row adm-row-head" style={{ gridTemplateColumns: '50px 2fr 1fr 1fr 1fr auto' }}>
        <span></span><span>{L('Piece', 'القطعة')}</span><span>{L('Collection', 'المجموعة')}</span><span>{L('Price', 'السعر')}</span><span>{L('Availability', 'التوفر')}</span><span></span>
      </div>
      {pieces.length ? pieces.map((p) => (
        <div className="adm-row" style={{ gridTemplateColumns: '50px 2fr 1fr 1fr 1fr auto' }} key={p.id}>
          {p.img ? <img className="thumb" src={abs(p.img)} alt="" /> : <span className="thumb" style={{ display: 'block', background: 'var(--sand)' }} />}
          <div><div className="h-s" style={{ fontSize: 15 }}>{p.n}</div><div className="lbl" style={{ color: 'var(--ink-faint)' }}>{p.ed} · {p.ar}{p.pantsImg ? ` · ${L('+ trousers', '+ بنطلون')}` : ''}</div></div>
          <span>{collName(p.coll)}</span>
          <span>{SAR(p.price)}</span>
          <span className={`pill ${p.av === 'Available' ? '' : 'g'}`}>{p.av}</span>
          <div className="actions"><Link href={`/admin/pieces/${p.id}/edit`}>{L('Edit', 'تعديل')}</Link><span onClick={() => onDelete(p.id)}>{L('Delete', 'حذف')}</span></div>
        </div>
      )) : <p className="body" style={{ padding: '26px 0' }}>{L('No pieces yet.', 'مافيش قطع لسه.')}</p>}
    </>
  );
}
