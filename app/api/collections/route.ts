import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { collectionOut } from '@/lib/serverMappers';

export async function GET() {
  const rows = await sql`SELECT * FROM collections ORDER BY sort`;
  return NextResponse.json(rows.map(collectionOut));
}
