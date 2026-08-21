import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { collectionOut } from '@/lib/serverMappers';
import { str } from '@/lib/serverValidators';

export async function PUT(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const { key } = await params;
  const existingRows = await sql`SELECT * FROM collections WHERE key = ${key}`;
  if (!existingRows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const existing = existingRows[0];

  const b = await req.json().catch(() => ({}));
  const next = {
    name_en: b.name !== undefined ? (str(b.name, 100) || existing.name_en) : existing.name_en,
    name_ar: b.nameAr !== undefined ? (str(b.nameAr, 100) || existing.name_ar) : existing.name_ar,
    ar: b.ar !== undefined ? str(b.ar, 100) : existing.ar,
    line_en: b.line !== undefined ? str(b.line, 150) : existing.line_en,
    line_ar: b.lineAr !== undefined ? str(b.lineAr, 150) : existing.line_ar,
    concept_en: b.concept !== undefined ? str(b.concept, 2000) : existing.concept_en,
    concept_ar: b.conceptAr !== undefined ? str(b.conceptAr, 2000) : existing.concept_ar,
    mood_en: b.mood !== undefined ? str(b.mood, 150) : existing.mood_en,
    mood_ar: b.moodAr !== undefined ? str(b.moodAr, 150) : existing.mood_ar,
    image: b.img !== undefined ? str(b.img, 300) : existing.image
  };

  await sql`UPDATE collections SET name_en=${next.name_en}, name_ar=${next.name_ar}, ar=${next.ar},
    line_en=${next.line_en}, line_ar=${next.line_ar}, concept_en=${next.concept_en}, concept_ar=${next.concept_ar},
    mood_en=${next.mood_en}, mood_ar=${next.mood_ar}, image=${next.image} WHERE key=${key}`;

  const rows = await sql`SELECT * FROM collections WHERE key = ${key}`;
  return NextResponse.json(collectionOut(rows[0]));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const { key } = await params;
  const [{ n: inUse }] = await sql`SELECT COUNT(*)::int AS n FROM pieces WHERE coll_key = ${key}`;
  if (inUse > 0) return NextResponse.json({ error: 'Collection still has pieces assigned to it' }, { status: 409 });

  const rows = await sql`DELETE FROM collections WHERE key = ${key} RETURNING key`;
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
