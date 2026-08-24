import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { orderOut } from '@/lib/serverMappers';
import type { OrderLineItem } from '@/lib/types';

// 'In atelier' is legacy (pre-dates the deposit checkout flow) — kept
// valid so old seeded orders still display, but new orders never use it.
const ORDER_STATUSES = ['In atelier', 'Under Review', 'Confirmed', 'Preparing', 'Shipped', 'Delivered', 'Cancelled'];

function parseItems(v: unknown): OrderLineItem[] {
  if (typeof v !== 'string') return [];
  try { return JSON.parse(v || '[]'); } catch { return []; }
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
    if (existing.reservation_active) {
      // Never got past "Under Review" — release the reservation, real
      // stock was never touched for this order.
      for (const it of parseItems(existing.items)) {
        const qty = Math.min(20, Math.max(1, it.qty || 1));
        await sql`UPDATE pieces SET reserved = GREATEST(0, reserved - ${qty}) WHERE id = ${it.id}`;
      }
      await sql`UPDATE orders SET reservation_active = false WHERE id = ${id}`;
    } else if (existing.stock_deducted) {
      // Was already approved — the deduction was real, so give it back.
      // stock_deducted flips off here, so a second Cancel (or any other
      // repeat call) is a no-op instead of restocking twice.
      for (const it of parseItems(existing.items)) {
        const qty = Math.min(20, Math.max(1, it.qty || 1));
        await sql`UPDATE pieces SET stock = stock + ${qty} WHERE id = ${it.id}`;
      }
      await sql`UPDATE orders SET stock_deducted = false WHERE id = ${id}`;
    }
    // Neither flag set: already resolved before (rejected, or already
    // cancelled) — nothing left to release or restore.
  }

  await sql`UPDATE orders SET status = ${status} WHERE id = ${id}`;
  const rows = await sql`SELECT * FROM orders WHERE id = ${id}`;
  return NextResponse.json(orderOut(rows[0]));
}
