import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { journalOut } from '@/lib/serverMappers';
import { isSlug, str, strArray } from '@/lib/serverValidators';

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const rows = await sql`SELECT * FROM journal ORDER BY sort`;
  return NextResponse.json(rows.map(journalOut));
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const b = await req.json().catch(() => ({}));
  if (!isSlug(b.id)) return NextResponse.json({ error: 'id must be lowercase letters, numbers and hyphens (1-60 chars)' }, { status: 400 });
  if (!str(b.t, 200) || !str(b.tAr, 200)) return NextResponse.json({ error: 't and tAr (title) are required' }, { status: 400 });

  const existing = await sql`SELECT 1 FROM journal WHERE id = ${b.id}`;
  if (existing.length) return NextResponse.json({ error: 'An article with that id already exists' }, { status: 409 });

  const [{ m: maxSort }] = await sql`SELECT COALESCE(MAX(sort),-1) AS m FROM journal`;

  await sql`INSERT INTO journal (id,sort,cat_en,cat_ar,title_en,title_ar,body_en,body_ar,image)
    VALUES (${b.id}, ${maxSort + 1}, ${str(b.cat, 80)}, ${str(b.catAr, 80)}, ${str(b.t, 200)}, ${str(b.tAr, 200)},
      ${JSON.stringify(strArray(b.x))}, ${JSON.stringify(strArray(b.xAr))}, ${str(b.img, 300)})`;

  const rows = await sql`SELECT * FROM journal WHERE id = ${b.id}`;
  return NextResponse.json(journalOut(rows[0]), { status: 201 });
}
