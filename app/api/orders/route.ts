/* The site has no customer login — "My THAJ" is a shared demo view.
   It must NOT leak other customers' name/email/phone; orderPublicOut
   strips them. */
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { orderPublicOut } from '@/lib/serverMappers';
import { isEmail, str } from '@/lib/serverValidators';

export async function GET() {
  const rows = await sql`SELECT * FROM orders ORDER BY id DESC LIMIT 100`;
  return NextResponse.json(rows.map(orderPublicOut));
}

async function nextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM orders WHERE order_number LIKE ${`THAJ-${year}-%`}`;
  return `THAJ-${year}-${String(n + 1).padStart(4, '0')}`;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { items, name, email, phone } = body || {};

  if (!Array.isArray(items) || !items.length || items.length > 30) {
    return NextResponse.json({ error: 'items is required (1-30 pieces)' }, { status: 400 });
  }
  if (email !== undefined && email !== '' && !isEmail(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  let total = 0;
  const cleanItems: { id: string; size: string; qty: number }[] = [];
  for (const it of items) {
    const pid = String((it && it.id) || '');
    const rows = await sql`SELECT id, price FROM pieces WHERE id = ${pid}`;
    if (!rows.length) return NextResponse.json({ error: `Unknown piece: ${pid}` }, { status: 400 });
    const p = rows[0];
    const qty = Math.min(20, Math.max(1, parseInt(it.qty, 10) || 1));
    total += p.price * qty;
    cleanItems.push({ id: p.id, size: str(it.size, 40), qty });
  }

  const orderNumber = await nextOrderNumber();
  const rows = await sql`INSERT INTO orders (order_number, customer_name, email, phone, items, total, status)
    VALUES (${orderNumber}, ${str(name, 200) || null}, ${str(email, 254) || null}, ${str(phone, 40) || null}, ${JSON.stringify(cleanItems)}, ${total}, 'In atelier')
    RETURNING *`;

  return NextResponse.json(orderPublicOut(rows[0]), { status: 201 });
}
