import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { pieceOut } from '@/lib/serverMappers';

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const rows = await sql`
    SELECT p.* FROM marquee_pieces m JOIN pieces p ON p.id = m.piece_id ORDER BY m.sort
  `;
  return NextResponse.json(rows.map(pieceOut));
}

// Replaces the whole picked list, in the given order — simplest possible
// mutation for what's meant to be a short, hand-curated list.
export async function PUT(req: Request) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const b = await req.json().catch(() => ({}));
  const ids = Array.isArray(b.pieceIds) ? b.pieceIds.filter((id: unknown) => typeof id === 'string').slice(0, 50) : [];

  await sql`DELETE FROM marquee_pieces`;
  for (const [i, id] of ids.entries()) {
    await sql`INSERT INTO marquee_pieces (piece_id, sort) VALUES (${id}, ${i}) ON CONFLICT (piece_id) DO NOTHING`;
  }

  const rows = await sql`
    SELECT p.* FROM marquee_pieces m JOIN pieces p ON p.id = m.piece_id ORDER BY m.sort
  `;
  return NextResponse.json(rows.map(pieceOut));
}
