import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { appointmentOut } from '@/lib/serverMappers';

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const rows = await sql`SELECT * FROM appointments ORDER BY id DESC`;
  return NextResponse.json(rows.map(appointmentOut));
}
