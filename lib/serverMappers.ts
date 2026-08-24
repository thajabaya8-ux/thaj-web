/* ==========================================================
   THAJ — mappers
   DB row (snake_case Postgres columns) <-> the exact JSON shape
   the front-end expects (lib/types.ts) — ported from
   thaj-site/server/mappers.js unchanged.
   ========================================================== */
import type { Appointment, Collection, Customer, Governorate, Order, OrderLineItem, Piece, Review, ShippingInfo, SocialLink } from '@/lib/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

function parseArr<T = string>(v: unknown): T[] {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') { try { return JSON.parse(v || '[]'); } catch { return []; } }
  return [];
}

// created_at columns are TIMESTAMPTZ — the Neon driver hands them back as
// Date objects, not the "YYYY-MM-DD HH:MM:SS" strings SQLite used to
// return. The front-end just needs something `new Date()` can parse.
function toIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  return typeof v === 'string' ? v : '';
}

export function pieceOut(r: any): Piece {
  // Older rows (seeded before the gallery feature) only ever had a single
  // `image` column and no `images` array — fall back to a one-photo
  // gallery so the product page's gallery UI still has something to show.
  const gallery = parseArr<string>(r.images);
  const images = gallery.length ? gallery : (r.image ? [r.image] : []);
  return {
    id: r.id, ed: r.ed, n: r.name_en, ar: r.name_ar, price: r.price, currency: r.currency === 'EGP' ? 'EGP' : 'SAR', coll: r.coll_key,
    fabric: r.fabric, sil: r.sil, colour: r.colour, occ: r.occ,
    mat: r.mat_en, matAr: r.mat_ar, silf: r.silf_en, silfAr: r.silf_ar,
    pal: r.pal_en, palAr: r.pal_ar, av: r.availability,
    d: r.desc_en, dAr: r.desc_ar,
    story: parseArr(r.story_en), storyAr: parseArr(r.story_ar),
    img: images[0] || r.image || '',
    images,
    pantsImg: r.pants_image ?? null,
    pantsPrice: r.pants_price ?? null,
    salePrice: (r.sale_price != null && r.sale_price < r.price) ? r.sale_price : null,
    visible: r.visible !== false,
    stock: r.stock ?? 0,
    reserved: r.reserved ?? 0
  };
}

export function collectionOut(r: any): Collection {
  return {
    key: r.key, name: r.name_en, nameAr: r.name_ar, ar: r.ar,
    line: r.line_en, lineAr: r.line_ar,
    concept: r.concept_en, conceptAr: r.concept_ar,
    mood: r.mood_en, moodAr: r.mood_ar,
    img: r.image
  };
}


function parseShipping(v: unknown): ShippingInfo | undefined {
  if (typeof v !== 'string' || !v) return undefined;
  try { return JSON.parse(v); } catch { return undefined; }
}

// Full record — admin only. Includes customer PII (name/email/phone/shipping).
export function orderOut(r: any): Order {
  return {
    n: r.order_number, id: r.id, name: r.customer_name, email: r.email, phone: r.phone,
    items: parseArr<OrderLineItem>(r.items), tot: r.total, st: r.status, d: toIso(r.created_at),
    subtotal: r.subtotal ?? undefined, shippingFee: r.shipping_fee ?? undefined,
    depositAmount: r.deposit_amount ?? undefined, amountPaid: r.amount_paid ?? undefined,
    paymentMethod: r.payment_method ?? undefined, paymentStatus: r.payment_status ?? undefined,
    rejectionReason: r.rejection_reason ?? null, approvedAt: r.approved_at ? toIso(r.approved_at) : null,
    shipping: parseShipping(r.shipping_json), hasReceipt: !!r.receipt_key
  };
}

// Public record — no customer PII (name/email/phone/shipping are stripped).
// Used both for the shared "My THAJ" demo list and for the one-order
// tracking lookup by order number — payment/fulfilment state is not
// sensitive on its own, so it's included in both.
export function orderPublicOut(r: any): Order {
  return {
    n: r.order_number, id: r.id,
    items: parseArr<OrderLineItem>(r.items), tot: r.total, st: r.status, d: toIso(r.created_at),
    subtotal: r.subtotal ?? undefined, shippingFee: r.shipping_fee ?? undefined,
    depositAmount: r.deposit_amount ?? undefined, amountPaid: r.amount_paid ?? undefined,
    paymentMethod: r.payment_method ?? undefined, paymentStatus: r.payment_status ?? undefined,
    rejectionReason: r.rejection_reason ?? null, approvedAt: r.approved_at ? toIso(r.approved_at) : null,
    hasReceipt: !!r.receipt_key
  };
}

export function appointmentOut(r: any): Appointment {
  return {
    id: r.id, name: r.name, email: r.email, date: r.date, time: r.time,
    type: r.type, mode: r.mode, notes: r.notes, status: r.status, d: toIso(r.created_at)
  } as Appointment;
}

export function governorateOut(r: any): Governorate {
  return { key: r.key, name: r.name_en, nameAr: r.name_ar, price: r.price, active: !!r.active };
}

export function socialLinkOut(r: any): SocialLink {
  return { platform: r.platform, url: r.url || '', active: !!r.active };
}

// Deliberately excludes password_hash and role — this is only ever used to
// list/show customers to the admin.
export function customerOut(r: any): Customer {
  return {
    id: r.id, name: r.name, email: r.email, status: r.status === 'suspended' ? 'suspended' : 'active',
    createdAt: toIso(r.created_at), lastLogin: r.last_login ? toIso(r.last_login) : null
  };
}

export function reviewOut(r: any): Review {
  return {
    id: r.id, pieceId: r.piece_id,
    pieceName: r.name_en, pieceNameAr: r.name_ar,
    name: r.name, email: r.email, message: r.message, d: toIso(r.created_at)
  };
}
