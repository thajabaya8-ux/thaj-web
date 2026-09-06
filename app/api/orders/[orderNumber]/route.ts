/* Public order tracking, looked up by the order number the shopper was
   given at checkout — not PII, but treated as a bearer token: whoever
   has it can see this one order's status. orderPublicOut still strips
   name/email/phone/shipping. */
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { orderPublicOut } from '@/lib/serverMappers';
import { clientIp, isRateLimited } from '@/lib/rateLimit';

export async function GET(req: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  // Order numbers are sequential (THAJ-<year>-0001, -0002, ...), not
  // random — without this, the bearer-token model above depends entirely
  // on nobody bothering to just count upward and read every order.
  if (await isRateLimited(`order-lookup:${clientIp(req)}`, 30, 300)) {
    return NextResponse.json({ error: 'Too many requests — please wait a moment and try again' }, { status: 429 });
  }

  const { orderNumber } = await params;
  const rows = await sql`SELECT * FROM orders WHERE order_number = ${orderNumber}`;
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(orderPublicOut(rows[0]));
}
