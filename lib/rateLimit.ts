/* ==========================================================
   THAJ — rate limiting
   One small Postgres table (rate_limits, scripts/schema.sql) backs
   every limit in the app — no Redis/Upstash to add for a site this
   size, and it fits the existing "everything lives in the one
   Postgres DB" convention (see lib/db.ts). A single atomic upsert both
   resets an expired window and increments the counter in one
   round-trip, so concurrent requests for the same key can't race each
   other into undercounting.

   Fails OPEN, not closed: if the DB call itself errors — OR just hangs,
   see the timeout below — the request is allowed through. A rate
   limiter that takes checkout or login down over an unrelated DB
   hiccup is a worse outage than the abuse it's meant to prevent.
   ========================================================== */
import { sql } from './db';

// A network hang (not an error — Neon's HTTP driver never times out on
// its own) would otherwise make every protected route wait forever
// instead of failing open like an actual error does. 1.5s is generous
// for a query this small; if the DB hasn't answered by then, something
// is already badly wrong with it and blocking checkout/login on top of
// that would only make things worse.
const TIMEOUT_MS = 1500;

// Cheap, no-new-infrastructure bound on the table's size: every unique
// (endpoint, IP) pair gets a row that nothing else ever removes, so
// without this it grows forever. A low-probability opportunistic sweep
// on a fraction of calls keeps it bounded without a dedicated cron job
// (none exists in this project) or adding load to every single request.
const CLEANUP_PROBABILITY = 0.01;
const STALE_AFTER = '1 day';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('rate limit check timed out')), ms);
    promise.then((v) => { clearTimeout(timer); resolve(v); }, (e) => { clearTimeout(timer); reject(e); });
  });
}

export async function isRateLimited(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  try {
    const rows = await withTimeout(sql`
      INSERT INTO rate_limits (key, count, window_start)
      VALUES (${key}, 1, now())
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) THEN 1 ELSE rate_limits.count + 1 END,
        window_start = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) THEN now() ELSE rate_limits.window_start END
      RETURNING count
    `, TIMEOUT_MS);
    if (Math.random() < CLEANUP_PROBABILITY) {
      sql`DELETE FROM rate_limits WHERE window_start < now() - ${STALE_AFTER}::interval`.catch(() => {});
    }
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
