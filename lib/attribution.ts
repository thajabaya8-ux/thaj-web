'use client';
/* ==========================================================
   THAJ — order attribution
   Captures which ad/campaign/link a visitor arrived from (utm_*,
   fbclid, gclid) so it can ride along with the order itself instead
   of only ever being inferable from Meta's own Ads Manager after the
   fact. Last-touch: whichever of these params was present on the most
   recent page load before checkout overwrites the previous one, the
   same model Meta's own Pixel attribution uses by default.

   localStorage, not a cookie — this never needs to leave the browser
   except as part of the order the customer themselves places; no
   value in sending it to the server on every request.
   ========================================================== */
import type { Attribution } from './types';

const KEY = 'thaj_attribution';
const PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];

export function captureAttribution(search: string) {
  const params = new URLSearchParams(search);
  const found: Record<string, string> = {};
  for (const p of PARAMS) {
    const v = params.get(p);
    if (v) found[p] = v.slice(0, 200);
  }
  if (Object.keys(found).length === 0) return; // no ad/campaign params on this load — keep whatever was captured before
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...found, landing_path: window.location.pathname, captured_at: new Date().toISOString() }));
  } catch {
    // localStorage unavailable (private mode, etc) — order just won't carry attribution
  }
}

export function getAttribution(): Attribution | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
