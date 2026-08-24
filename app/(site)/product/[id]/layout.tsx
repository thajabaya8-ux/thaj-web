import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getPiece } from '@/lib/api';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const piece = await getPiece(id);
  if (!piece) return { title: 'Piece' };
  return {
    title: piece.n,
    description: piece.d || `${piece.n} — THAJ, an abaya fashion house in Riyadh.`
  };
}

export default function ProductLayout({ children }: { children: ReactNode }) {
  return children;
}
