'use client';
/* ==========================================================
   THAJ — Meta Pixel
   Thin fbq() wrapper any client component/context can import to
   fire a standard event. The base script load, the Pixel ID
   (admin-editable — see Settings → Marketing) and the automatic
   PageView-per-route wiring live in components/MetaPixel.tsx —
   this file only owns the trackPixel() call.
   ========================================================== */
import { logAnalyticsEvent } from './analytics';

export type PixelEventName =
  | 'ViewContent' | 'AddToCart' | 'InitiateCheckout'
  | 'Purchase' | 'Lead' | 'CompleteRegistration' | 'Contact';

export interface PixelParams {
  content_ids?: string[];
  content_name?: string;
  content_type?: 'product';
  contents?: { id: string; quantity: number }[];
  value?: number;
  currency?: string;
  num_items?: number;
  // Anything else a call site wants to carry — Meta ignores keys it
  // doesn't recognise, and it doubles as this event's first-party
  // analytics metadata (see logAnalyticsEvent below), so a call site
  // can attach whatever detail is actually useful there (size, color, ...)
  // without this interface needing a new field for every one.
  [key: string]: unknown;
}

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[][]; callMethod?: (...args: unknown[]) => void };
  }
}

// Purchase already reaches Meta server-side with authoritative, DB-verified
// order data (app/api/orders/route.ts) — mirroring it again from here would
// just be a redundant, less-trustworthy duplicate. Every other standard
// event only ever reached Meta through the one browser call below, which
// on this site was confirmed to be exactly what gets silently stripped by
// ad blockers / browser privacy features — no console warning, no network
// trace, while plain PageView pings went through untouched. Those get a
// server-side mirror (app/api/analytics/capi/route.ts) too now, deduped
// against the browser call by eventId, the same pattern Purchase uses.
const CAPI_MIRRORED_EVENTS = new Set<PixelEventName>(['ViewContent', 'AddToCart', 'InitiateCheckout', 'Lead', 'CompleteRegistration', 'Contact']);

function sendCapiMirror(event: PixelEventName, params: PixelParams, eventId: string) {
  fetch('/api/analytics/capi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, eventId, customData: params, eventSourceUrl: window.location.href }),
    keepalive: true
  }).catch(() => {});
}

// Fires a standard Meta Pixel event from the browser. `eventId`, when
// given, is echoed to the Conversions API for the same real-world action
// (see lib/metaCapi.ts) so Meta can deduplicate the browser call against
// the matching server-side call instead of double-counting it. When not
// given for an event that gets a CAPI mirror, one is generated here so
// the two calls can still be deduped against each other. Safe to call
// before the pixel has finished loading — window.fbq's own stub (see
// components/MetaPixel.tsx) queues calls internally until it has, the
// same as Meta's official base snippet does on any site.
export function trackPixel(event: PixelEventName, params?: PixelParams, eventId?: string) {
  if (typeof window === 'undefined') return;
  // Logged regardless of whether a Meta Pixel ID is even configured —
  // /admin/analytics has to work on its own, not only once Marketing
  // settings are filled in. params doubles as the first-party event's
  // own metadata, so a product view/add-to-cart already carries its
  // product id, price, etc. into the activity log for free.
  logAnalyticsEvent(event, window.location.pathname, params);
  const mirrored = CAPI_MIRRORED_EVENTS.has(event);
  const id = eventId || (mirrored ? crypto.randomUUID() : undefined);
  if (mirrored && id) sendCapiMirror(event, params || {}, id);
  if (typeof window.fbq !== 'function') return;
  if (id) window.fbq('track', event, params || {}, { eventID: id });
  else window.fbq('track', event, params || {});
}

const PURCHASE_DEDUPE_KEY = 'thaj_pixel_purchased_orders';

function alreadyTrackedPurchase(orderNumber: string): boolean {
  try {
    const raw = localStorage.getItem(PURCHASE_DEDUPE_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    return list.includes(orderNumber);
  } catch {
    return false;
  }
}

function markPurchaseTracked(orderNumber: string) {
  try {
    const raw = localStorage.getItem(PURCHASE_DEDUPE_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    list.push(orderNumber);
    localStorage.setItem(PURCHASE_DEDUPE_KEY, JSON.stringify(list.slice(-50)));
  } catch {
    // localStorage unavailable (private mode, etc) — Purchase still fires
    // once for this call, just without a cross-reload dedupe guard.
  }
}

// Purchase must never fire twice for the same order — guarded here by
// order number, on top of the fact that submitOrder() (lib/siteContext.tsx)
// only ever calls this once per successful order creation.
export function trackPurchase(order: { n: string; tot: number; items: { id: string; qty?: number }[] }) {
  if (alreadyTrackedPurchase(order.n)) return;
  markPurchaseTracked(order.n);
  trackPixel('Purchase', {
    content_ids: order.items.map((i) => i.id),
    content_type: 'product',
    contents: order.items.map((i) => ({ id: i.id, quantity: i.qty || 1 })),
    value: order.tot,
    currency: 'EGP',
    num_items: order.items.reduce((s, i) => s + (i.qty || 1), 0)
  }, order.n);
}
