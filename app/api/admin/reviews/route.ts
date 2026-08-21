import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { reviewOut } from '@/lib/serverMappers';

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const rows = await sql`
    SELECT r.*, p.name_en, p.name_ar FROM reviews r
    JOIN pieces p ON p.id = r.piece_id
    ORDER BY r.id DESC
  `;
  return NextResponse.json(rows.map(reviewOut));
}
