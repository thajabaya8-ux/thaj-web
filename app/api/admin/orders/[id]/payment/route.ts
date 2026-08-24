/* Approve/reject the uploaded receipt — the only place payment_status can
   change. Customers have no endpoint that touches it, by design (the spec
   requires payment is never considered confirmed until an admin says so). */
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { orderOut } from '@/lib/serverMappers';
import { str } from '@/lib/serverValidators';
import type { OrderLineItem } from '@/lib/types';

function parseItems(v: unknown): OrderLineItem[] {
  if (typeof v !== 'string') return [];
  try { return JSON.parse(v || '[]'); } catch { return []; }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const existingRows = await sql`SELECT * FROM orders WHERE id = ${id}`;
  if (!existingRows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const existing = existingRows[0];

  const body = await req.json().catch(() => ({}));
  const action = body?.action;
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 });
  }

  if (action === 'approve') {
    // reservation_active guards this — false means either this order was
    // already approved before (a retried/duplicate click) or it was
    // already rejected/cancelled, so the reserved units are already gone.
    // Either way, never deduct real stock a second time for the same order.
    if (existing.reservation_active) {
      for (const it of parseItems(existing.items)) {
        const qty = Math.min(20, Math.max(1, it.qty || 1));
        await sql`UPDATE pieces SET stock = stock - ${qty}, reserved = GREATEST(0, reserved - ${qty}) WHERE id = ${it.id}`;
      }
      await sql`UPDATE orders SET reservation_active = false, stock_deducted = true WHERE id = ${id}`;
    }
    await sql`UPDATE orders SET payment_status = 'approved', status = 'Confirmed',
      amount_paid = ${existing.deposit_amount || 0}, approved_at = now(), rejection_reason = NULL
      WHERE id = ${id}`;
  } else {
    const reason = str(body?.reason, 500);
    // Rejecting frees the reservation back up for other customers — the
    // real stock was never touched for this order in the first place.
    if (existing.reservation_active) {
      for (const it of parseItems(existing.items)) {
        const qty = Math.min(20, Math.max(1, it.qty || 1));
        await sql`UPDATE pieces SET reserved = GREATEST(0, reserved - ${qty}) WHERE id = ${it.id}`;
      }
      await sql`UPDATE orders SET reservation_active = false WHERE id = ${id}`;
    }
    await sql`UPDATE orders SET payment_status = 'rejected', rejection_reason = ${reason || null}
      WHERE id = ${id}`;
  }

  const rows = await sql`SELECT * FROM orders WHERE id = ${id}`;
  return NextResponse.json(orderOut(rows[0]));
}
