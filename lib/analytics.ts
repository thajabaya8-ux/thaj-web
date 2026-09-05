'use client';
/* ==========================================================
   THAJ — first-party analytics
   Fire-and-forget POST to /api/analytics/track, same best-effort
   pattern as trackPixel() — never awaited, never throws into the
   caller, and silently no-ops if the request fails. This is the ONE
   place that calls the endpoint; both the page-view tracker
   (components/Analytics.tsx) and trackPixel() (lib/pixel.ts) go
   through it, and so does trackEvent() below for everything that
   isn't also a Meta Pixel event.

   visitorId is a random id generated once per browser and kept in
   localStorage — not a login, just enough for the admin activity log
   to group events by "the same visitor", and for the funnel to count
   distinct visitors per step rather than raw event counts.
   ========================================================== */
const VISITOR_ID_KEY = 'thaj_visitor_id';

function getVisitorId(): string | undefined {
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    return undefined; // private browsing / storage disabled — event still sends, just ungrouped
  }
}

export function logAnalyticsEvent(type: string, path: string, metadata?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, path, visitorId: getVisitorId(), metadata }),
    keepalive: true
  }).catch(() => {});
}

// For every tracked interaction that has no matching Meta Pixel standard
// event (trackPixel() in lib/pixel.ts already logs its own) — cart
// changes, variant selection, checkout steps, admin actions on an order,
// and so on. Always uses the current path, since that's genuinely where
// the interaction happened.
export function trackEvent(type: string, metadata?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  logAnalyticsEvent(type, window.location.pathname, metadata);
}
