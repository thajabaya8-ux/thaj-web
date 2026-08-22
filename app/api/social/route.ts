import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { socialLinkOut } from '@/lib/serverMappers';

export async function GET() {
  const rows = await sql`SELECT * FROM social_links WHERE active = true AND url != '' ORDER BY sort`;
  return NextResponse.json(rows.map(socialLinkOut));
}
