import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { orderOut } from '@/lib/serverMappers';

const ORDER_STATUSES = ['In atelier', 'Delivered', 'Cancelled'];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const existing = await sql`SELECT 1 FROM orders WHERE id = ${id}`;
  if (!existing.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const status = body?.status;
  if (!ORDER_STATUSES.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  await sql`UPDATE orders SET status = ${status} WHERE id = ${id}`;
  const rows = await sql`SELECT * FROM orders WHERE id = ${id}`;
  return NextResponse.json(orderOut(rows[0]));
}
