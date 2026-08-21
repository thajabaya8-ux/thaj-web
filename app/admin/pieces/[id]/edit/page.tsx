'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAdminFetch } from '@/lib/useAdminFetch';
import PieceForm from '@/components/admin/PieceForm';
import type { Collection, Piece } from '@/lib/types';

export default function EditPiecePage() {
  const { id } = useParams<{ id: string }>();
  const { data: pieces, loading: loadingPieces } = useAdminFetch<Piece[]>('/pieces');
  const { data: collections, loading: loadingColls } = useAdminFetch<Collection[]>('/collections');
  const piece = pieces?.find((p) => p.id === id);

  return (
    <>
      <div className="adm-head"><h1>Edit piece</h1><Link className="link" href="/admin/pieces">Back to pieces</Link></div>
      {!loadingPieces && !loadingColls && piece && <PieceForm piece={piece} collections={collections || []} />}
      {!loadingPieces && !piece && <p className="body" style={{ padding: '26px 0' }}>Piece not found.</p>}
    </>
  );
}
