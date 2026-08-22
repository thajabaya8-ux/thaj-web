import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { socialLinkOut } from '@/lib/serverMappers';
import { str } from '@/lib/serverValidators';

export async function PATCH(req: Request, { params }: { params: Promise<{ platform: string }> }) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const { platform } = await params;
  const existingRows = await sql`SELECT * FROM social_links WHERE platform = ${platform}`;
  if (!existingRows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const existing = existingRows[0];

  const b = await req.json().catch(() => ({}));
  const url = b.url !== undefined ? str(b.url, 500) : existing.url;
  const active = b.active !== undefined ? !!b.active : existing.active;

  await sql`UPDATE social_links SET url = ${url}, active = ${active} WHERE platform = ${platform}`;
  const rows = await sql`SELECT * FROM social_links WHERE platform = ${platform}`;
  return NextResponse.json(socialLinkOut(rows[0]));
}
