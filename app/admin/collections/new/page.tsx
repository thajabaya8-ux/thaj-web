'use client';
import Link from 'next/link';
import CollectionForm from '@/components/admin/CollectionForm';

export default function NewCollectionPage() {
  return (
    <>
      <div className="adm-head"><h1>New collection</h1><Link className="link" href="/admin/collections">Back to collections</Link></div>
      <CollectionForm />
    </>
  );
}
