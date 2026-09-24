import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { marqueeItemOut } from '@/lib/serverMappers';
import { str } from '@/lib/serverValidators';

async function readItems() {
  const rows = await sql`
    SELECT mi.kind AS kind, mi.image AS mi_image, mi.caption_en AS mi_caption_en, mi.caption_ar AS mi_caption_ar, p.*
    FROM marquee_items mi
    LEFT JOIN pieces p ON p.id = mi.piece_id
    ORDER BY mi.sort
  `;
  return rows.map(marqueeItemOut);
}

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;
  return NextResponse.json(await readItems());
}

// Replaces the whole picked list, in the given order — same
// simplest-possible-mutation shape the piece-only version always used,
// just now each slot is either a real piece ({ kind: 'piece', pieceId })
// or a plain banner image ({ kind: 'image', img, caption?, captionAr? }).
// A piece id that no longer exists, or an image slot with no image, is
// silently dropped rather than failing the whole save.
export async function PUT(req: Request) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const b = await req.json().catch(() => ({}));
  const rawItems = Array.isArray(b.items) ? b.items.slice(0, 50) : [];

  await sql`DELETE FROM marquee_items`;
  let sort = 0;
  for (const it of rawItems) {
    if (!it || typeof it !== 'object') continue;
    if (it.kind === 'image') {
      const img = str(it.img, 300);
      if (!img) continue;
      await sql`INSERT INTO marquee_items (kind, image, caption_en, caption_ar, sort)
        VALUES ('image', ${img}, ${str(it.caption, 200)}, ${str(it.captionAr, 200)}, ${sort})`;
      sort++;
    } else if (typeof it.pieceId === 'string' && it.pieceId) {
      const rows = await sql`INSERT INTO marquee_items (kind, piece_id, sort)
        SELECT 'piece', ${it.pieceId}, ${sort} WHERE EXISTS (SELECT 1 FROM pieces WHERE id = ${it.pieceId})
        RETURNING id`;
      if (rows.length) sort++;
    }
  }

  return NextResponse.json(await readItems());
}
