/* ==========================================================
   THAJ — rate limiting
   One small Postgres table (rate_limits, scripts/schema.sql) backs
   every limit in the app — no Redis/Upstash to add for a site this
   size, and it fits the existing "everything lives in the one
   Postgres DB" convention (see lib/db.ts). A single atomic upsert both
   resets an expired window and increments the counter in one
   round-trip, so concurrent requests for the same key can't race each
   other into undercounting.

   Fails OPEN, not closed: if the DB call itself errors, the request is
   allowed through. A rate limiter that takes checkout or login down
   over an unrelated DB hiccup is a worse outage than the abuse it's
   meant to prevent.
   ========================================================== */
import { sql } from './db';

export async function isRateLimited(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  try {
    const rows = await sql`
      INSERT INTO rate_limits (key, count, window_start)
      VALUES (${key}, 1, now())
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) THEN 1 ELSE rate_limits.count + 1 END,
        window_start = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) THEN now() ELSE rate_limits.window_start END
      RETURNING count
    `;
    return (rows[0]?.count ?? 0) > limit;
  } catch {
    return false;
  }
}

// The client IP behind Vercel's edge network — same header every other
// per-request signal in this app already reads (see capiSignalsFromRequest
// in lib/metaCapi.ts).
export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}
