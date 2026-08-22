/* Public order tracking, looked up by the order number the shopper was
   given at checkout — not PII, but treated as a bearer token: whoever
   has it can see this one order's status. orderPublicOut still strips
   name/email/phone/shipping. */
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { orderPublicOut } from '@/lib/serverMappers';

export async function GET(_req: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const rows = await sql`SELECT * FROM orders WHERE order_number = ${orderNumber}`;
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(orderPublicOut(rows[0]));
}
