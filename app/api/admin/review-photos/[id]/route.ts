import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { reviewPhotoOut } from '@/lib/serverMappers';
import { str, nonNegativeInt } from '@/lib/serverValidators';

// Also how the admin list's "move up/down" reorders — each click PUTs
// just the two swapped rows' own `sort` values, no separate bulk-reorder
// endpoint needed.
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const existingRows = await sql`SELECT * FROM review_photos WHERE id = ${id}`;
  if (!existingRows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const existing = existingRows[0];

  const b = await req.json().catch(() => ({}));
  const next = {
    image: b.img !== undefined ? (str(b.img, 300) || existing.image) : existing.image,
    caption_en: b.caption !== undefined ? str(b.caption, 300) : existing.caption_en,
    caption_ar: b.captionAr !== undefined ? str(b.captionAr, 300) : existing.caption_ar,
    sort: b.sort !== undefined ? nonNegativeInt(b.sort, existing.sort) : existing.sort
  };

  const rows = await sql`UPDATE review_photos SET image=${next.image}, caption_en=${next.caption_en},
    caption_ar=${next.caption_ar}, sort=${next.sort} WHERE id=${id} RETURNING *`;
  return NextResponse.json(reviewPhotoOut(rows[0]));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const rows = await sql`DELETE FROM review_photos WHERE id = ${id} RETURNING id`;
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
