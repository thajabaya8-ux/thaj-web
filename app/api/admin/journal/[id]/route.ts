import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { journalOut } from '@/lib/serverMappers';
import { str, strArray } from '@/lib/serverValidators';

function parseArr(v: unknown): string[] {
  if (typeof v !== 'string') return [];
  try { return JSON.parse(v || '[]'); } catch { return []; }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const existingRows = await sql`SELECT * FROM journal WHERE id = ${id}`;
  if (!existingRows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const existing = existingRows[0];

  const b = await req.json().catch(() => ({}));
  const next = {
    cat_en: b.cat !== undefined ? str(b.cat, 80) : existing.cat_en,
    cat_ar: b.catAr !== undefined ? str(b.catAr, 80) : existing.cat_ar,
    title_en: b.t !== undefined ? (str(b.t, 200) || existing.title_en) : existing.title_en,
    title_ar: b.tAr !== undefined ? (str(b.tAr, 200) || existing.title_ar) : existing.title_ar,
    body_en: JSON.stringify(b.x !== undefined ? strArray(b.x) : parseArr(existing.body_en)),
    body_ar: JSON.stringify(b.xAr !== undefined ? strArray(b.xAr) : parseArr(existing.body_ar)),
    image: b.img !== undefined ? str(b.img, 300) : existing.image
  };

  await sql`UPDATE journal SET cat_en=${next.cat_en}, cat_ar=${next.cat_ar}, title_en=${next.title_en}, title_ar=${next.title_ar},
    body_en=${next.body_en}, body_ar=${next.body_ar}, image=${next.image} WHERE id=${id}`;

  const rows = await sql`SELECT * FROM journal WHERE id = ${id}`;
  return NextResponse.json(journalOut(rows[0]));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const rows = await sql`DELETE FROM journal WHERE id = ${id} RETURNING id`;
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
