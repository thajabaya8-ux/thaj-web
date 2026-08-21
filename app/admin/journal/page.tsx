'use client';
import Link from 'next/link';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin, abs } from '@/lib/adminContext';
import type { JournalArticle } from '@/lib/types';

export default function JournalPage() {
  const { data: posts, loading, error, reload } = useAdminFetch<JournalArticle[]>('/journal');
  const { call, toast } = useAdmin();

  const onDelete = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    try { await call(`/journal/${id}`, { method: 'DELETE' }); toast('Deleted'); reload(); }
    catch (e) { toast(e instanceof Error ? e.message : String(e)); }
  };

  if (loading) return null;
  if (error) return <p className="body" style={{ padding: '40px 0', color: '#B75B5B' }}>{error}</p>;
  if (!posts) return null;

  return (
    <>
      <div className="adm-head"><h1>Journal</h1><Link className="btn fill" href="/admin/journal/new">New article</Link></div>
      <div className="adm-row adm-row-head" style={{ gridTemplateColumns: '50px 2fr 1fr auto' }}>
        <span></span><span>Article</span><span>Category</span><span></span>
      </div>
      {posts.length ? posts.map((j) => (
        <div className="adm-row" style={{ gridTemplateColumns: '50px 2fr 1fr auto' }} key={j.id}>
          {j.img ? <img className="thumb" src={abs(j.img)} alt="" /> : <span className="thumb" style={{ display: 'block', background: 'var(--sand)' }} />}
          <div><div className="h-s" style={{ fontSize: 15 }}>{j.t}</div><div className="lbl" style={{ color: 'var(--ink-faint)' }}>{j.tAr}</div></div>
          <span className="body" style={{ fontSize: 12 }}>{j.cat}</span>
          <div className="actions"><Link href={`/admin/journal/${j.id}/edit`}>Edit</Link><span onClick={() => onDelete(j.id)}>Delete</span></div>
        </div>
      )) : <p className="body" style={{ padding: '26px 0' }}>No articles yet.</p>}
    </>
  );
}
