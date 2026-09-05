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
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[][] };
  }
}

// MetaPixel.tsx fetches the Pixel ID from /api/settings before it can call
// fbq('init', ...), so window.fbq may not exist yet on a very first
// interaction (e.g. an ad click landing straight on a product page,
// followed immediately by "Add to selection"). PageView never shows this
// gap because bootPixel() fires it itself once the ID arrives; any event
// that's fired *by the user* (AddToCart chief among them) can race that
// fetch and lose the call for good if it isn't queued here. Calls queue in
// order and get replayed once markPixelReady() runs — which MetaPixel.tsx
// calls right after fbq('init', ...), so init always precedes every
// queued track call, matching what Meta's pixel requires.
let pixelReady = false;
const queuedCalls: (() => void)[] = [];

export function markPixelReady() {
  pixelReady = true;
  while (queuedCalls.length) queuedCalls.shift()!();
}

// Fires a standard Meta Pixel event from the browser. `eventId`, when
// given, is echoed to the Conversions API for the same real-world action
// (see lib/metaCapi.ts) so Meta can deduplicate the browser call against
// the matching server-side call instead of double-counting it.
export function trackPixel(event: PixelEventName, params?: PixelParams, eventId?: string) {
  if (typeof window === 'undefined') return;
  // Logged regardless of whether a Meta Pixel ID is even configured —
  // /admin/analytics has to work on its own, not only once Marketing
  // settings are filled in. params doubles as the first-party event's
  // own metadata, so a product view/add-to-cart already carries its
  // product id, price, etc. into the activity log for free.
  logAnalyticsEvent(event, window.location.pathname, params);
  const fire = () => {
    if (typeof window.fbq !== 'function') return;
    if (eventId) window.fbq('track', event, params || {}, { eventID: eventId });
    else window.fbq('track', event, params || {});
  };
  if (pixelReady) fire();
  else queuedCalls.push(fire);
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
