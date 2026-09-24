import type { Settings } from '@/lib/types';

// Public — the shopper needs these to see prices and transfer instructions
// at checkout. admin_whatsapp_number is deliberately NOT here: it's only
// used server/admin-side to build the wa.me link on the order detail page.
// Shipping is per-governorate (see the governorates table / /admin/shipping),
// not a flat setting.
export const PAYMENT_SETTINGS_KEYS = [
  'deposit_percent',
  'vodafone_cash_number', 'vodafone_cash_name',
  'instapay_handle', 'instapay_name',
  'free_shipping', 'cash_on_delivery_enabled'
];

export const ADMIN_ONLY_SETTINGS_KEYS = ['admin_whatsapp_number'];

export function depositPercent(settings: Settings): number {
  const n = parseFloat(settings.deposit_percent || '');
  return Number.isFinite(n) && n > 0 && n <= 100 ? n : 50;
}

// One global switch (set at /admin/shipping), not a per-governorate thing —
// when it's on, every governorate's own price is ignored everywhere a fee
// would otherwise show, both in computeOrderTotals below (the single place
// both the checkout preview and the real order write go through) and in
// every page that displays a governorate's price on its own.
export function isFreeShipping(settings: Settings): boolean {
  return settings.free_shipping === 'true';
}

// On by default — the setting only exists to let the admin switch it off
// (e.g. during a period they don't want to chase WhatsApp deposits), so an
// unset/missing value must read as enabled, not disabled.
export function isCodEnabled(settings: Settings): boolean {
  return settings.cash_on_delivery_enabled !== 'false';
}

// Every amount here is EGP — Vodafone Cash / InstaPay are Egyptian payment
// rails, so the deposit is always computed in EGP regardless of which
// currency each piece is individually priced in. `subtotalEgp` is already
// converted piece-by-piece before this is called (SAR-priced pieces via
// the admin-editable egp_per_sar rate, EGP-priced pieces as-is — see
// itemPriceEgp/cartTotalEgp in lib/siteContext.tsx and the matching
// per-item loop in app/api/orders/route.ts). `shippingFeeEgp` comes from
// the chosen governorate's price (looked up server-side at order time —
// never trusted from the client).
export function computeOrderTotals(subtotalEgp: number, shippingFeeEgp: number, settings: Settings) {
  const subtotal = Math.round(subtotalEgp);
  const shippingFee = isFreeShipping(settings) ? 0 : Math.max(0, Math.round(shippingFeeEgp || 0));
  const total = subtotal + shippingFee;
  const deposit = Math.round(total * (depositPercent(settings) / 100));
  const remaining = total - deposit;
  return { subtotal, shippingFee, total, deposit, remaining };
}
