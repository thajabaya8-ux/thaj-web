'use client';
import Link from 'next/link';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin, SAR, abs } from '@/lib/adminContext';
import type { Collection, Piece } from '@/lib/types';

export default function PiecesPage() {
  const { data: pieces, loading, error, reload } = useAdminFetch<Piece[]>('/pieces');
  const { data: collections } = useAdminFetch<Collection[]>('/collections');
  const { call, toast } = useAdmin();

  const collName = (k: string) => (collections?.find((c) => c.key === k) || {}).name || '—';

  const onDelete = async (id: string) => {
    if (!confirm('Delete this piece? This cannot be undone.')) return;
    try { await call(`/pieces/${id}`, { method: 'DELETE' }); toast('Deleted'); reload(); }
    catch (e) { toast(e instanceof Error ? e.message : String(e)); }
  };

  if (loading) return null;
  if (error) return <p className="body" style={{ padding: '40px 0', color: '#B75B5B' }}>{error}</p>;
  if (!pieces) return null;

  return (
    <>
      <div className="adm-head"><h1>Pieces</h1><Link className="btn fill" href="/admin/pieces/new">New piece</Link></div>
      <div className="adm-row adm-row-head" style={{ gridTemplateColumns: '50px 2fr 1fr 1fr 1fr auto' }}>
        <span></span><span>Piece</span><span>Collection</span><span>Price</span><span>Availability</span><span></span>
      </div>
      {pieces.length ? pieces.map((p) => (
        <div className="adm-row" style={{ gridTemplateColumns: '50px 2fr 1fr 1fr 1fr auto' }} key={p.id}>
          {p.img ? <img className="thumb" src={abs(p.img)} alt="" /> : <span className="thumb" style={{ display: 'block', background: 'var(--sand)' }} />}
          <div><div className="h-s" style={{ fontSize: 15 }}>{p.n}</div><div className="lbl" style={{ color: 'var(--ink-faint)' }}>{p.ed} · {p.ar}</div></div>
          <span>{collName(p.coll)}</span>
          <span>{SAR(p.price)}</span>
          <span className={`pill ${p.av === 'Available' ? '' : 'g'}`}>{p.av}</span>
          <div className="actions"><Link href={`/admin/pieces/${p.id}/edit`}>Edit</Link><span onClick={() => onDelete(p.id)}>Delete</span></div>
        </div>
      )) : <p className="body" style={{ padding: '26px 0' }}>No pieces yet.</p>}
    </>
  );
}
