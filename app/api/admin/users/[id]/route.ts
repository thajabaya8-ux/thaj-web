import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { customerOut } from '@/lib/serverMappers';

const STATUSES = ['active', 'suspended'];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const existingRows = await sql`SELECT * FROM users WHERE id = ${id} AND role = 'customer'`;
  if (!existingRows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const b = await req.json().catch(() => ({}));
  if (!STATUSES.includes(b.status)) return NextResponse.json({ error: 'status must be active or suspended' }, { status: 400 });

  await sql`UPDATE users SET status = ${b.status} WHERE id = ${id}`;
  const rows = await sql`SELECT * FROM users WHERE id = ${id}`;
  return NextResponse.json(customerOut(rows[0]));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const rows = await sql`DELETE FROM users WHERE id = ${id} AND role = 'customer' RETURNING id`;
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
