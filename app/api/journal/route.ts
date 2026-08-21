import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { journalOut } from '@/lib/serverMappers';

export async function GET() {
  const rows = await sql`SELECT * FROM journal ORDER BY sort`;
  return NextResponse.json(rows.map(journalOut));
}
