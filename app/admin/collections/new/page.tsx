'use client';
import Link from 'next/link';
import { useAdmin } from '@/lib/adminContext';
import CollectionForm from '@/components/admin/CollectionForm';

export default function NewCollectionPage() {
  const { L } = useAdmin();
  return (
    <>
      <div className="adm-head"><h1>{L('New collection', 'مجموعة جديدة')}</h1><Link className="link" href="/admin/collections">{L('Back to collections', 'العودة للمجموعات')}</Link></div>
      <CollectionForm />
    </>
  );
}
