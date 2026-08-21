'use client';
import Link from 'next/link';
import { useAdminFetch } from '@/lib/useAdminFetch';
import PieceForm from '@/components/admin/PieceForm';
import type { Collection } from '@/lib/types';

export default function NewPiecePage() {
  const { data: collections, loading } = useAdminFetch<Collection[]>('/collections');
  return (
    <>
      <div className="adm-head"><h1>New piece</h1><Link className="link" href="/admin/pieces">Back to pieces</Link></div>
      {!loading && <PieceForm collections={collections || []} />}
    </>
  );
}
