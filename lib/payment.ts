import type { Settings } from '@/lib/types';

// Public — the shopper needs these to see prices and transfer instructions
// at checkout. admin_whatsapp_number is deliberately NOT here: it's only
// used server/admin-side to build the wa.me link on the order detail page.
// Shipping is per-governorate (see the governorates table / /admin/shipping),
// not a flat setting.
export const PAYMENT_SETTINGS_KEYS = [
  'deposit_percent',
  'vodafone_cash_number', 'vodafone_cash_name',
  'instapay_handle', 'instapay_name'
];

export const ADMIN_ONLY_SETTINGS_KEYS = ['admin_whatsapp_number'];

export function depositPercent(settings: Settings): number {
  const n = parseFloat(settings.deposit_percent || '');
  return Number.isFinite(n) && n > 0 && n <= 100 ? n : 50;
}

// Every amount here is EGP — Vodafone Cash / InstaPay are Egyptian payment
// rails, so the deposit is always computed in EGP regardless of whether
// the shopper was browsing in SAR or EGP. `subtotalSar` is the cart total
// already computed in the store's base currency (see itemPrice/cartTotal
// in lib/siteContext.tsx); egpPerSar is the same admin-editable rate used
// for the SAR/EGP display toggle. `shippingFeeEgp` comes from the chosen
// governorate's price (looked up server-side at order time — see
// app/api/orders/route.ts — never trusted from the client).
export function computeOrderTotals(subtotalSar: number, egpPerSar: number, shippingFeeEgp: number, settings: Settings) {
  const subtotal = Math.round(subtotalSar * egpPerSar);
  const shippingFee = Math.max(0, Math.round(shippingFeeEgp || 0));
  const total = subtotal + shippingFee;
  const deposit = Math.round(total * (depositPercent(settings) / 100));
  const remaining = total - deposit;
  return { subtotal, shippingFee, total, deposit, remaining };
}
