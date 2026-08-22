/* Approve/reject the uploaded receipt — the only place payment_status can
   change. Customers have no endpoint that touches it, by design (the spec
   requires payment is never considered confirmed until an admin says so). */
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { orderOut } from '@/lib/serverMappers';
import { str } from '@/lib/serverValidators';

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
    await sql`UPDATE orders SET payment_status = 'approved', status = 'Confirmed',
      amount_paid = ${existing.deposit_amount || 0}, approved_at = now(), rejection_reason = NULL
      WHERE id = ${id}`;
  } else {
    const reason = str(body?.reason, 500);
    await sql`UPDATE orders SET payment_status = 'rejected', rejection_reason = ${reason || null}
      WHERE id = ${id}`;
  }

  const rows = await sql`SELECT * FROM orders WHERE id = ${id}`;
  return NextResponse.json(orderOut(rows[0]));
}
