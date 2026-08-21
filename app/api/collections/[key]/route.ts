import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { collectionOut } from '@/lib/serverMappers';

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const rows = await sql`SELECT * FROM collections WHERE key = ${key}`;
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(collectionOut(rows[0]));
}
