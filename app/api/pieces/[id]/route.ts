import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { pieceOut } from '@/lib/serverMappers';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await sql`SELECT * FROM pieces WHERE id = ${id}`;
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(pieceOut(rows[0]));
}
