'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin } from '@/lib/adminContext';
import JournalForm from '@/components/admin/JournalForm';
import type { JournalArticle } from '@/lib/types';

export default function EditJournalPage() {
  const { id } = useParams<{ id: string }>();
  const { data: posts, loading } = useAdminFetch<JournalArticle[]>('/journal');
  const article = posts?.find((j) => j.id === id);
  const { L } = useAdmin();

  return (
    <>
      <div className="adm-head"><h1>{L('Edit article', 'تعديل المقال')}</h1><Link className="link" href="/admin/journal">{L('Back to journal', 'العودة للمجلة')}</Link></div>
      {!loading && article && <JournalForm article={article} />}
      {!loading && !article && <p className="body" style={{ padding: '26px 0' }}>{L('Article not found.', 'المقال مش موجود.')}</p>}
    </>
  );
}
