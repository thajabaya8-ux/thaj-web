'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin } from '@/lib/adminContext';
import PieceForm from '@/components/admin/PieceForm';
import type { Collection } from '@/lib/types';

function NewPieceInner() {
  const coll = useSearchParams().get('coll') || undefined;
  const { data: collections, loading } = useAdminFetch<Collection[]>('/collections');
  const { L } = useAdmin();
  const backHref = coll ? `/admin/collections/${coll}` : '/admin/collections';
  return (
    <>
      <div className="adm-head"><h1>{L('New piece', 'قطعة جديدة')}</h1><Link className="link" href={backHref}>{L('Back', 'رجوع')}</Link></div>
      {!loading && <PieceForm collections={collections || []} defaultCollKey={coll} />}
    </>
  );
}

export default function NewPiecePage() {
  return (
    <Suspense fallback={null}>
      <NewPieceInner />
    </Suspense>
  );
}
