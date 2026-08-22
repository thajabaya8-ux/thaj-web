import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { governorateOut } from '@/lib/serverMappers';
import { nonNegativeInt } from '@/lib/serverValidators';

export async function PATCH(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const { key } = await params;
  const existingRows = await sql`SELECT * FROM governorates WHERE key = ${key}`;
  if (!existingRows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const existing = existingRows[0];

  const b = await req.json().catch(() => ({}));
  const price = b.price !== undefined ? nonNegativeInt(b.price, existing.price) : existing.price;
  const active = b.active !== undefined ? !!b.active : existing.active;

  await sql`UPDATE governorates SET price = ${price}, active = ${active} WHERE key = ${key}`;
  const rows = await sql`SELECT * FROM governorates WHERE key = ${key}`;
  return NextResponse.json(governorateOut(rows[0]));
}
