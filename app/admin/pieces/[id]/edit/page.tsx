'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin } from '@/lib/adminContext';
import PieceForm from '@/components/admin/PieceForm';
import type { Collection, Piece } from '@/lib/types';

export default function EditPiecePage() {
  const { id } = useParams<{ id: string }>();
  const { data: pieces, loading: loadingPieces } = useAdminFetch<Piece[]>('/pieces');
  const { data: collections, loading: loadingColls } = useAdminFetch<Collection[]>('/collections');
  const piece = pieces?.find((p) => p.id === id);
  const { L } = useAdmin();

  const backHref = piece?.coll ? `/admin/collections/${piece.coll}` : '/admin/collections';

  return (
    <>
      <div className="adm-head"><h1>{L('Edit piece', 'تعديل القطعة')}</h1><Link className="link" href={backHref}>{L('Back', 'رجوع')}</Link></div>
      {!loadingPieces && !loadingColls && piece && <PieceForm piece={piece} collections={collections || []} />}
      {!loadingPieces && !piece && <p className="body" style={{ padding: '26px 0' }}>{L('Piece not found.', 'القطعة مش موجودة.')}</p>}
    </>
  );
}
