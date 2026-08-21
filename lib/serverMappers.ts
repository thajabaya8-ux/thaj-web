/* ==========================================================
   THAJ — mappers
   DB row (snake_case Postgres columns) <-> the exact JSON shape
   the front-end expects (lib/types.ts) — ported from
   thaj-site/server/mappers.js unchanged.
   ========================================================== */
import type { Appointment, Collection, JournalArticle, Order, OrderLineItem, Piece } from '@/lib/types';

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
  return {
    id: r.id, ed: r.ed, n: r.name_en, ar: r.name_ar, price: r.price, coll: r.coll_key,
    fabric: r.fabric, sil: r.sil, colour: r.colour, occ: r.occ,
    mat: r.mat_en, matAr: r.mat_ar, silf: r.silf_en, silfAr: r.silf_ar,
    pal: r.pal_en, palAr: r.pal_ar, av: r.availability,
    d: r.desc_en, dAr: r.desc_ar,
    story: parseArr(r.story_en), storyAr: parseArr(r.story_ar),
    img: r.image
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

export function journalOut(r: any): JournalArticle {
  return {
    id: r.id, cat: r.cat_en, catAr: r.cat_ar, t: r.title_en, tAr: r.title_ar,
    x: parseArr(r.body_en), xAr: parseArr(r.body_ar),
    img: r.image
  };
}

// Full record — admin only. Includes customer PII (name/email/phone).
export function orderOut(r: any): Order {
  return {
    n: r.order_number, id: r.id, name: r.customer_name, email: r.email, phone: r.phone,
    items: parseArr<OrderLineItem>(r.items), tot: r.total, st: r.status, d: toIso(r.created_at)
  };
}

// Public record — no customer PII. The site has no customer login, so
// "My THAJ" is a shared demo view; it must not leak other customers'
// name/email/phone to every visitor.
export function orderPublicOut(r: any): Order {
  return {
    n: r.order_number, id: r.id,
    items: parseArr<OrderLineItem>(r.items), tot: r.total, st: r.status, d: toIso(r.created_at)
  };
}

export function appointmentOut(r: any): Appointment {
  return {
    id: r.id, name: r.name, email: r.email, date: r.date, time: r.time,
    type: r.type, mode: r.mode, notes: r.notes, status: r.status, d: toIso(r.created_at)
  } as Appointment;
}
