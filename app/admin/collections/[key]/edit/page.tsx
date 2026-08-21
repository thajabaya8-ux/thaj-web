'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAdminFetch } from '@/lib/useAdminFetch';
import CollectionForm from '@/components/admin/CollectionForm';
import type { Collection } from '@/lib/types';

export default function EditCollectionPage() {
  const { key } = useParams<{ key: string }>();
  const { data: collections, loading } = useAdminFetch<Collection[]>('/collections');
  const collection = collections?.find((c) => c.key === key);

  return (
    <>
      <div className="adm-head"><h1>Edit collection</h1><Link className="link" href="/admin/collections">Back to collections</Link></div>
      {!loading && collection && <CollectionForm collection={collection} />}
      {!loading && !collection && <p className="body" style={{ padding: '26px 0' }}>Collection not found.</p>}
    </>
  );
}
