import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { governorateOut } from '@/lib/serverMappers';

export async function GET() {
  const rows = await sql`SELECT * FROM governorates WHERE active = true ORDER BY sort`;
  return NextResponse.json(rows.map(governorateOut));
}
