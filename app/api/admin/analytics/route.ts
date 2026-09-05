/* Page-traffic side of /admin/analytics — pageviews, Meta Pixel events
   (see lib/analytics.ts), and the funnel below, grouped by page. The
   sales/orders side of the dashboard is app/api/admin/orders/analytics/route.ts.

   The funnel counts DISTINCT visitor_id per step, not raw event counts —
   otherwise someone who views the same product 5 times would inflate
   "Product View" relative to "Visit" instead of the step genuinely
   representing how many separate people got that far. Orders created/
   completed are counted from the orders table directly (not a Purchase
   event) since that's the authoritative record and isn't tied to a
   visitor_id at all for admin-side status changes. */
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';

const DAYS = 30;

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const since = `${DAYS} days`;
  const [pageviews, events, totalRow, funnelRows, ordersCreatedRow, ordersCompletedRow] = await Promise.all([
    sql`SELECT path, COUNT(*)::int AS views FROM analytics_events
        WHERE type = 'pageview' AND created_at > now() - ${since}::interval
        GROUP BY path ORDER BY views DESC LIMIT 50`,
    sql`SELECT path, type, COUNT(*)::int AS count FROM analytics_events
        WHERE type != 'pageview' AND created_at > now() - ${since}::interval
        GROUP BY path, type ORDER BY path, count DESC`,
    sql`SELECT COUNT(*)::int AS n FROM analytics_events WHERE type = 'pageview' AND created_at > now() - ${since}::interval`,
    sql`SELECT type, COUNT(DISTINCT visitor_id)::int AS n FROM analytics_events
        WHERE type IN ('pageview','ViewContent','AddToCart','InitiateCheckout')
          AND visitor_id IS NOT NULL AND created_at > now() - ${since}::interval
        GROUP BY type`,
    sql`SELECT COUNT(*)::int AS n FROM orders WHERE created_at > now() - ${since}::interval`,
    sql`SELECT COUNT(*)::int AS n FROM orders WHERE created_at > now() - ${since}::interval AND payment_status = 'approved'`
  ]);

  const eventsByPath: Record<string, { type: string; count: number }[]> = {};
  for (const e of events) {
    (eventsByPath[e.path] ||= []).push({ type: e.type, count: e.count });
  }

  const pages = pageviews.map((p) => ({ path: p.path, views: p.views, events: eventsByPath[p.path] || [] }));

  const funnelByType: Record<string, number> = {};
  for (const r of funnelRows) funnelByType[r.type] = r.n;
  const funnel = [
    { step: 'Visit', count: funnelByType['pageview'] || 0 },
    { step: 'Product View', count: funnelByType['ViewContent'] || 0 },
    { step: 'Add to Cart', count: funnelByType['AddToCart'] || 0 },
    { step: 'Checkout Started', count: funnelByType['InitiateCheckout'] || 0 },
    { step: 'Order Created', count: ordersCreatedRow[0]?.n || 0 },
    { step: 'Order Completed', count: ordersCompletedRow[0]?.n || 0 }
  ];

  return NextResponse.json({ days: DAYS, totalViews: totalRow[0]?.n || 0, pages, funnel });
}
