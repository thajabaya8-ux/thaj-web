/* Raw activity log — every row in analytics_events, most recent first,
   for the admin's Activity page. Offset pagination is plenty for this:
   nobody's paging deep into months-old events, and a cursor adds
   complexity for no real benefit at this scale. */
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { nonNegativeInt, str } from '@/lib/serverValidators';

const PAGE_SIZE = 50;

function parseMetadata(raw: unknown): Record<string, unknown> | null {
  if (typeof raw !== 'string' || !raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(req.url);
  const offset = nonNegativeInt(searchParams.get('offset'), 0);
  const type = str(searchParams.get('type') || '', 40);

  const rows = type
    ? await sql`SELECT e.id, e.type, e.path, e.visitor_id, e.user_id, e.metadata, e.created_at, u.name AS user_name
        FROM analytics_events e LEFT JOIN users u ON u.id = e.user_id
        WHERE e.type = ${type}
        ORDER BY e.created_at DESC LIMIT ${PAGE_SIZE + 1} OFFSET ${offset}`
    : await sql`SELECT e.id, e.type, e.path, e.visitor_id, e.user_id, e.metadata, e.created_at, u.name AS user_name
        FROM analytics_events e LEFT JOIN users u ON u.id = e.user_id
        ORDER BY e.created_at DESC LIMIT ${PAGE_SIZE + 1} OFFSET ${offset}`;

  const hasMore = rows.length > PAGE_SIZE;
  const events = rows.slice(0, PAGE_SIZE).map((r) => ({
    id: r.id, type: r.type, path: r.path, visitorId: r.visitor_id,
    userId: r.user_id, userName: r.user_name, metadata: parseMetadata(r.metadata), createdAt: r.created_at
  }));

  return NextResponse.json({ events, hasMore });
}
