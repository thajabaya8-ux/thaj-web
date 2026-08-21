/* Public: any visitor can leave a comment/request on a specific piece —
   it goes straight to the admin (app/admin/reviews), it is never shown
   back to other visitors. */
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { str } from '@/lib/serverValidators';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const pieceId = String(body?.pieceId || '');
  const name = str(body?.name, 200);
  const email = str(body?.email, 254);
  const message = str(body?.message, 2000);

  if (!pieceId) return NextResponse.json({ error: 'pieceId is required' }, { status: 400 });
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

  const piece = await sql`SELECT 1 FROM pieces WHERE id = ${pieceId}`;
  if (!piece.length) return NextResponse.json({ error: 'Unknown piece' }, { status: 400 });

  await sql`INSERT INTO reviews (piece_id, name, email, message) VALUES (${pieceId}, ${name}, ${email || null}, ${message})`;
  return NextResponse.json({ ok: true }, { status: 201 });
}
