import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { pieceOut } from '@/lib/serverMappers';

export async function GET() {
  const rows = await sql`
    SELECT p.* FROM marquee_pieces m JOIN pieces p ON p.id = m.piece_id WHERE p.visible ORDER BY m.sort
  `;
  return NextResponse.json(rows.map(pieceOut));
}
