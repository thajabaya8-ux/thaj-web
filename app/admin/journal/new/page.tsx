'use client';
import Link from 'next/link';
import JournalForm from '@/components/admin/JournalForm';

export default function NewJournalPage() {
  return (
    <>
      <div className="adm-head"><h1>New article</h1><Link className="link" href="/admin/journal">Back to journal</Link></div>
      <JournalForm />
    </>
  );
}
