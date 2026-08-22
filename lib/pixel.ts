'use client';
/* ==========================================================
   THAJ — Meta Pixel
   Thin fbq() wrapper any client component/context can import to
   fire a standard event. The base script load + automatic
   PageView-per-route wiring live in components/MetaPixel.tsx —
   this file only owns the Pixel ID and the trackPixel() call.
   ========================================================== */

// Set in Vercel + .env.local as NEXT_PUBLIC_META_PIXEL_ID — never
// hardcoded here. Must be NEXT_PUBLIC_-prefixed since it's read in the
// browser. The same numeric ID is also used server-side by
// lib/metaCapi.ts for the Conversions API, so the two always agree.
export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

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
}

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[][] };
  }
}

// Fires a standard Meta Pixel event from the browser. `eventId`, when
// given, is echoed to the Conversions API for the same real-world action
// (see lib/metaCapi.ts) so Meta can deduplicate the browser call against
// the matching server-side call instead of double-counting it.
export function trackPixel(event: PixelEventName, params?: PixelParams, eventId?: string) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  if (eventId) window.fbq('track', event, params || {}, { eventID: eventId });
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
