import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { orderOut } from '@/lib/serverMappers';
import { releaseColorReserved, restoreColorStock } from '@/lib/colorStock';
import type { OrderLineItem } from '@/lib/types';

// 'In atelier' is legacy (pre-dates the deposit checkout flow) — kept
// valid so old seeded orders still display, but new orders never use it.
const ORDER_STATUSES = ['In atelier', 'Under Review', 'Confirmed', 'Preparing', 'Shipped', 'Delivered', 'Cancelled'];

function parseItems(v: unknown): OrderLineItem[] {
  if (typeof v !== 'string') return [];
  try { return JSON.parse(v || '[]'); } catch { return []; }
}

// Shared by Cancelling an order and deleting one outright — either way,
// whatever this order was holding (an active reservation, or a real
// deduction once approved) has to be given back to stock first, or it
// leaks forever with nothing left pointing at it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function releaseOrRestoreStock(existing: Record<string, any>) {
  if (existing.reservation_active) {
    for (const it of parseItems(existing.items)) {
      const qty = Math.min(20, Math.max(1, it.qty || 1));
      if (it.color) await releaseColorReserved(it.id, it.color, qty);
      else await sql`UPDATE pieces SET reserved = GREATEST(0, reserved - ${qty}) WHERE id = ${it.id}`;
    }
  } else if (existing.stock_deducted) {
    for (const it of parseItems(existing.items)) {
      const qty = Math.min(20, Math.max(1, it.qty || 1));
      if (it.color) await restoreColorStock(it.id, it.color, qty);
      else await sql`UPDATE pieces SET stock = stock + ${qty} WHERE id = ${it.id}`;
    }
  }
  // Neither flag set: already resolved before (rejected, or already
  // cancelled/deleted) — nothing left to release or restore.
}

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
  const existingRows = await sql`SELECT * FROM orders WHERE id = ${id}`;
  if (!existingRows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const existing = existingRows[0];

  const body = await req.json().catch(() => ({}));
  const status = body?.status;
  if (!ORDER_STATUSES.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  if (status === 'Cancelled') {
    await releaseOrRestoreStock(existing);
    // Both flags flip off here (whichever applied) so a repeat Cancel, or
    // deleting the order afterwards, never releases/restores twice.
    await sql`UPDATE orders SET reservation_active = false, stock_deducted = false WHERE id = ${id}`;
  }

  await sql`UPDATE orders SET status = ${status} WHERE id = ${id}`;
  const rows = await sql`SELECT * FROM orders WHERE id = ${id}`;
  return NextResponse.json(orderOut(rows[0]));
}

// Removes the order entirely, not just marking it Cancelled/Rejected —
// same stock reconciliation as Cancelling (a reservation is released, a
// real deduction is given back), run first so deleting an order can
// never leak inventory, then the row itself is gone for good.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const existingRows = await sql`SELECT * FROM orders WHERE id = ${id}`;
  if (!existingRows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await releaseOrRestoreStock(existingRows[0]);
  await sql`DELETE FROM orders WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
