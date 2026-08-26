'use client';
/* ==========================================================
   THAJ — first-party analytics
   Fire-and-forget POST to /api/analytics/track, same best-effort
   pattern as trackPixel() — never awaited, never throws into the
   caller, and silently no-ops if the request fails. This is the ONE
   place that calls the endpoint; both the page-view tracker
   (components/Analytics.tsx) and trackPixel() (lib/pixel.ts) go
   through it.
   ========================================================== */
export function logAnalyticsEvent(type: string, path: string) {
  if (typeof window === 'undefined') return;
  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, path }),
    keepalive: true
  }).catch(() => {});
}
