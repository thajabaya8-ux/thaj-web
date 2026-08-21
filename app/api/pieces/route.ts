import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { pieceOut } from '@/lib/serverMappers';

export async function GET() {
  const rows = await sql`SELECT * FROM pieces ORDER BY created_at`;
  return NextResponse.json(rows.map(pieceOut));
}
