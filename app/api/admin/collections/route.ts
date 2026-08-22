import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { collectionOut } from '@/lib/serverMappers';
import { isSlug, str } from '@/lib/serverValidators';

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const rows = await sql`SELECT * FROM collections ORDER BY sort`;
  return NextResponse.json(rows.map(collectionOut));
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const b = await req.json().catch(() => ({}));
  if (!isSlug(b.key)) return NextResponse.json({ error: 'key must be lowercase letters, numbers and hyphens (1-60 chars)' }, { status: 400 });
  if (!str(b.name, 100) || !str(b.nameAr, 100)) return NextResponse.json({ error: 'name and nameAr are required' }, { status: 400 });

  const existing = await sql`SELECT 1 FROM collections WHERE key = ${b.key}`;
  if (existing.length) return NextResponse.json({ error: 'A collection with that key already exists' }, { status: 409 });

  const [{ m: maxSort }] = await sql`SELECT COALESCE(MAX(sort),-1) AS m FROM collections`;

  // The admin form only ever collects name + image now — line/mood default
  // to the name itself (they're just a stylistic subtitle/chapter label on
  // the public collection page) so a freshly created category never shows
  // blank text there; concept has no such stand-in, so it's fine empty.
  const name = str(b.name, 100);
  const nameAr = str(b.nameAr, 100);

  await sql`INSERT INTO collections (key,sort,name_en,name_ar,ar,line_en,line_ar,concept_en,concept_ar,mood_en,mood_ar,image)
    VALUES (${b.key}, ${maxSort + 1}, ${name}, ${nameAr}, ${str(b.ar, 100) || nameAr},
      ${str(b.line, 150) || name}, ${str(b.lineAr, 150) || nameAr}, ${str(b.concept, 2000)}, ${str(b.conceptAr, 2000)},
      ${str(b.mood, 150) || name}, ${str(b.moodAr, 150) || nameAr}, ${str(b.img, 300)})`;

  const rows = await sql`SELECT * FROM collections WHERE key = ${b.key}`;
  return NextResponse.json(collectionOut(rows[0]), { status: 201 });
}
