'use client';
import Link from 'next/link';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin, abs } from '@/lib/adminContext';
import type { Collection } from '@/lib/types';

export default function CollectionsPage() {
  const { data: collections, loading, error, reload } = useAdminFetch<Collection[]>('/collections');
  const { call, toast, L, AR } = useAdmin();

  const onDelete = async (key: string) => {
    if (!confirm(L('Delete this collection? It must have no pieces assigned.', 'تحذفي المجموعة دي؟ لازم متكونش فيها قطع.'))) return;
    try { await call(`/collections/${key}`, { method: 'DELETE' }); toast(L('Deleted', 'اتمسحت')); reload(); }
    catch (e) { toast(e instanceof Error ? e.message : String(e)); }
  };

  if (loading) return null;
  if (error) return <p className="body" style={{ padding: '40px 0', color: '#B75B5B' }}>{error}</p>;
  if (!collections) return null;

  return (
    <>
      <div className="adm-head"><h1>{L('Collections', 'المجموعات')}</h1><Link className="btn fill" href="/admin/collections/new">{L('New collection', 'مجموعة جديدة')}</Link></div>
      <div className="adm-row adm-row-head" style={{ gridTemplateColumns: '50px 2fr 2fr auto' }}>
        <span></span><span>{L('Collection', 'المجموعة')}</span><span>{L('Line', 'الخط')}</span><span></span>
      </div>
      {collections.length ? collections.map((c) => (
        <div className="adm-row" style={{ gridTemplateColumns: '50px 2fr 2fr auto' }} key={c.key}>
          {c.img ? <img className="thumb" src={abs(c.img)} alt="" /> : <span className="thumb" style={{ display: 'block', background: 'var(--sand)' }} />}
          <div><div className="h-s" style={{ fontSize: 15 }}>{AR() ? c.nameAr : c.name}</div><div className="lbl" style={{ color: 'var(--ink-faint)' }}>{c.ar}</div></div>
          <span className="body" style={{ fontSize: 12 }}>{AR() ? c.lineAr : c.line}</span>
          <div className="actions"><Link href={`/admin/collections/${c.key}/edit`}>{L('Edit', 'تعديل')}</Link><span onClick={() => onDelete(c.key)}>{L('Delete', 'حذف')}</span></div>
        </div>
      )) : <p className="body" style={{ padding: '26px 0' }}>{L('No collections yet.', 'مافيش مجموعات لسه.')}</p>}
    </>
  );
}
