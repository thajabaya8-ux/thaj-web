/* Scoped to the signed-in customer's own orders — see the note on the
   removed getOrders() in lib/api.ts for why this exists at all. Matches
   by user_id (set on every order placed while signed in, from now on)
   OR by email (case-insensitive), so an order placed before this existed
   — user_id is NULL on all of those — still shows up for whoever's
   account email matches it. */
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';
import { orderPublicOut } from '@/lib/serverMappers';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const rows = await sql`
    SELECT * FROM orders
    WHERE user_id = ${session.userId} OR LOWER(email) = LOWER(${session.email})
    ORDER BY id DESC LIMIT 100`;
  return NextResponse.json(rows.map(orderPublicOut));
}
