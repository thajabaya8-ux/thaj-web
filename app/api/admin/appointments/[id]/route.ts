import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { appointmentOut } from '@/lib/serverMappers';

const APPOINTMENT_STATUSES = ['Requested', 'Confirmed', 'Declined'];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const existing = await sql`SELECT 1 FROM appointments WHERE id = ${id}`;
  if (!existing.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const status = body?.status;
  if (!APPOINTMENT_STATUSES.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  await sql`UPDATE appointments SET status = ${status} WHERE id = ${id}`;
  const rows = await sql`SELECT * FROM appointments WHERE id = ${id}`;
  return NextResponse.json(appointmentOut(rows[0]));
}
