import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { marqueeItemOut } from '@/lib/serverMappers';

// A slot is either a real (visible) piece or a plain banner image — see
// MarqueeItem in lib/types.ts and /admin/marquee, where both are curated
// together in one ordered list.
export async function GET() {
  const rows = await sql`
    SELECT mi.kind AS kind, mi.image AS mi_image, mi.caption_en AS mi_caption_en, mi.caption_ar AS mi_caption_ar, p.*
    FROM marquee_items mi
    LEFT JOIN pieces p ON p.id = mi.piece_id
    WHERE mi.kind = 'image' OR (p.id IS NOT NULL AND p.visible)
    ORDER BY mi.sort
  `;
  return NextResponse.json(rows.map(marqueeItemOut));
}
