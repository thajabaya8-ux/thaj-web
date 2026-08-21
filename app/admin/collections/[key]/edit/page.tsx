'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin } from '@/lib/adminContext';
import CollectionForm from '@/components/admin/CollectionForm';
import type { Collection } from '@/lib/types';

export default function EditCollectionPage() {
  const { key } = useParams<{ key: string }>();
  const { data: collections, loading } = useAdminFetch<Collection[]>('/collections');
  const collection = collections?.find((c) => c.key === key);
  const { L } = useAdmin();

  return (
    <>
      <div className="adm-head"><h1>{L('Edit collection', 'تعديل المجموعة')}</h1><Link className="link" href="/admin/collections">{L('Back to collections', 'العودة للمجموعات')}</Link></div>
      {!loading && collection && <CollectionForm collection={collection} />}
      {!loading && !collection && <p className="body" style={{ padding: '26px 0' }}>{L('Collection not found.', 'المجموعة مش موجودة.')}</p>}
    </>
  );
}
