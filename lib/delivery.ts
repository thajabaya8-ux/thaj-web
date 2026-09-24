/* ==========================================================
   THAJ — delivery estimate
   Every abaya is made to order, so customers who expect a courier-app
   ETA can mistake the wait for a scam. Shown wherever the shipping fee
   itself is shown (product page, cart, checkout) so the timeline is set
   before they pay, not discovered afterwards.

   Editable at /admin/settings, but never blank on a fresh install — the
   defaults below are what actually ships until an admin overrides them.
   ========================================================== */
import { esc } from './siteContext';
import type { Settings } from './types';

export const DEFAULT_DELIVERY_ESTIMATE_EN = 'Delivered within 2 weeks';
export const DEFAULT_DELIVERY_ESTIMATE_AR = 'بيوصلك خلال أسبوعين';

export function deliveryEstimate(settings: Settings): { en: string; ar: string } {
  return {
    en: settings.delivery_estimate_en ? esc(settings.delivery_estimate_en) : DEFAULT_DELIVERY_ESTIMATE_EN,
    ar: settings.delivery_estimate_ar ? esc(settings.delivery_estimate_ar) : DEFAULT_DELIVERY_ESTIMATE_AR
  };
}
