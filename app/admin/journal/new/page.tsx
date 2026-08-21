'use client';
import Link from 'next/link';
import { useAdmin } from '@/lib/adminContext';
import JournalForm from '@/components/admin/JournalForm';

export default function NewJournalPage() {
  const { L } = useAdmin();
  return (
    <>
      <div className="adm-head"><h1>{L('New article', 'مقال جديد')}</h1><Link className="link" href="/admin/journal">{L('Back to journal', 'العودة للمجلة')}</Link></div>
      <JournalForm />
    </>
  );
}
