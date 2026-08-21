'use client';
import Link from 'next/link';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin, abs } from '@/lib/adminContext';
import type { Collection } from '@/lib/types';

export default function CollectionsPage() {
  const { data: collections, loading, error, reload } = useAdminFetch<Collection[]>('/collections');
  const { call, toast } = useAdmin();

  const onDelete = async (key: string) => {
    if (!confirm('Delete this collection? It must have no pieces assigned.')) return;
    try { await call(`/collections/${key}`, { method: 'DELETE' }); toast('Deleted'); reload(); }
    catch (e) { toast(e instanceof Error ? e.message : String(e)); }
  };

  if (loading) return null;
  if (error) return <p className="body" style={{ padding: '40px 0', color: '#B75B5B' }}>{error}</p>;
  if (!collections) return null;

  return (
    <>
      <div className="adm-head"><h1>Collections</h1><Link className="btn fill" href="/admin/collections/new">New collection</Link></div>
      <div className="adm-row adm-row-head" style={{ gridTemplateColumns: '50px 2fr 2fr auto' }}>
        <span></span><span>Collection</span><span>Line</span><span></span>
      </div>
      {collections.length ? collections.map((c) => (
        <div className="adm-row" style={{ gridTemplateColumns: '50px 2fr 2fr auto' }} key={c.key}>
          {c.img ? <img className="thumb" src={abs(c.img)} alt="" /> : <span className="thumb" style={{ display: 'block', background: 'var(--sand)' }} />}
          <div><div className="h-s" style={{ fontSize: 15 }}>{c.name}</div><div className="lbl" style={{ color: 'var(--ink-faint)' }}>{c.ar}</div></div>
          <span className="body" style={{ fontSize: 12 }}>{c.line}</span>
          <div className="actions"><Link href={`/admin/collections/${c.key}/edit`}>Edit</Link><span onClick={() => onDelete(c.key)}>Delete</span></div>
        </div>
      )) : <p className="body" style={{ padding: '26px 0' }}>No collections yet.</p>}
    </>
  );
}
