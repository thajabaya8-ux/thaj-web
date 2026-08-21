'use client';
import Link from 'next/link';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin } from '@/lib/adminContext';
import PieceForm from '@/components/admin/PieceForm';
import type { Collection } from '@/lib/types';

export default function NewPiecePage() {
  const { data: collections, loading } = useAdminFetch<Collection[]>('/collections');
  const { L } = useAdmin();
  return (
    <>
      <div className="adm-head"><h1>{L('New piece', 'قطعة جديدة')}</h1><Link className="link" href="/admin/pieces">{L('Back to pieces', 'العودة للقطع')}</Link></div>
      {!loading && <PieceForm collections={collections || []} />}
    </>
  );
}
