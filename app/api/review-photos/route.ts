import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { reviewPhotoOut } from '@/lib/serverMappers';

export async function GET() {
  const rows = await sql`SELECT * FROM review_photos ORDER BY sort`;
  return NextResponse.json(rows.map(reviewPhotoOut));
}
