/* Page-traffic side of /admin/analytics — pageviews and Meta Pixel
   events (see lib/analytics.ts), grouped by page. The sales/orders
   side of the dashboard is app/api/admin/orders/analytics/route.ts. */
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';

const DAYS = 30;

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const since = `${DAYS} days`;
  const [pageviews, events, totalRow] = await Promise.all([
    sql`SELECT path, COUNT(*)::int AS views FROM analytics_events
        WHERE type = 'pageview' AND created_at > now() - ${since}::interval
        GROUP BY path ORDER BY views DESC LIMIT 50`,
    sql`SELECT path, type, COUNT(*)::int AS count FROM analytics_events
        WHERE type != 'pageview' AND created_at > now() - ${since}::interval
        GROUP BY path, type ORDER BY path, count DESC`,
    sql`SELECT COUNT(*)::int AS n FROM analytics_events WHERE type = 'pageview' AND created_at > now() - ${since}::interval`
  ]);

  const eventsByPath: Record<string, { type: string; count: number }[]> = {};
  for (const e of events) {
    (eventsByPath[e.path] ||= []).push({ type: e.type, count: e.count });
  }

  const pages = pageviews.map((p) => ({ path: p.path, views: p.views, events: eventsByPath[p.path] || [] }));

  return NextResponse.json({ days: DAYS, totalViews: totalRow[0]?.n || 0, pages });
}
