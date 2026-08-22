import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { orderOut } from '@/lib/serverMappers';

// 'In atelier' is legacy (pre-dates the deposit checkout flow) — kept
// valid so old seeded orders still display, but new orders never use it.
const ORDER_STATUSES = ['In atelier', 'Under Review', 'Confirmed', 'Preparing', 'Shipped', 'Delivered', 'Cancelled'];

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const rows = await sql`SELECT * FROM orders WHERE id = ${id}`;
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(orderOut(rows[0]));
}

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
