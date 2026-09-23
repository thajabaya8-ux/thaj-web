import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { reviewPhotoOut } from '@/lib/serverMappers';
import { str } from '@/lib/serverValidators';

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const rows = await sql`SELECT * FROM review_photos ORDER BY sort`;
  return NextResponse.json(rows.map(reviewPhotoOut));
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const b = await req.json().catch(() => ({}));
  const img = str(b.img, 300);
  if (!img) return NextResponse.json({ error: 'A photo is required' }, { status: 400 });

  const [{ m: maxSort }] = await sql`SELECT COALESCE(MAX(sort), -1) AS m FROM review_photos`;

  const rows = await sql`INSERT INTO review_photos (image, caption_en, caption_ar, sort)
    VALUES (${img}, ${str(b.caption, 300)}, ${str(b.captionAr, 300)}, ${maxSort + 1})
    RETURNING *`;
  return NextResponse.json(reviewPhotoOut(rows[0]), { status: 201 });
}
