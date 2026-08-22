'use client';
import Link from 'next/link';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin, abs } from '@/lib/adminContext';
import type { Collection, Piece } from '@/lib/types';

export default function CollectionsPage() {
  const { data: collections, loading, error } = useAdminFetch<Collection[]>('/collections');
  const { data: pieces } = useAdminFetch<Piece[]>('/pieces');
  const { L, AR } = useAdmin();

  const countIn = (key: string) => (pieces || []).filter((p) => p.coll === key).length;

  if (loading) return null;
  if (error) return <p className="body" style={{ padding: '40px 0', color: '#B75B5B' }}>{error}</p>;
  if (!collections) return null;

  return (
    <>
      <div className="adm-head">
        <h1>{L('Categories', 'الفئات')}</h1>
        <Link className="btn fill" href="/admin/collections/new">{L('New category', 'فئة جديدة')}</Link>
      </div>
      <div className="adm-row adm-row-head" style={{ gridTemplateColumns: '50px 2fr 1fr auto' }}>
        <span></span><span>{L('Category', 'الفئة')}</span><span>{L('Pieces', 'القطع')}</span><span></span>
      </div>
      {collections.length ? collections.map((c) => (
        <Link className="adm-row" style={{ gridTemplateColumns: '50px 2fr 1fr auto', color: 'inherit', textDecoration: 'none' }} href={`/admin/collections/${c.key}`} key={c.key}>
          {c.img ? <img className="thumb" src={abs(c.img)} alt="" /> : <span className="thumb" style={{ display: 'block', background: 'var(--sand)' }} />}
          <div><div className="h-s" style={{ fontSize: 15 }}>{AR() ? c.nameAr : c.name}</div><div className="lbl" style={{ color: 'var(--ink-faint)' }}>{c.ar}</div></div>
          <span className="body" style={{ fontSize: 12 }}>{countIn(c.key)}</span>
          <span className="lbl" style={{ color: 'var(--ink-faint)' }}>{L('Manage →', 'إدارة ←')}</span>
        </Link>
      )) : <p className="body" style={{ padding: '26px 0' }}>{L('No categories yet.', 'مافيش فئات لسه.')}</p>}
    </>
  );
}
