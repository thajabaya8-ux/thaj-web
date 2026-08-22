/* ==========================================================
   THAJ — server-side data fetching
   Used from Server Components (layout.js, page.js files). Data
   lives in this same app now (Neon via lib/db.ts), so these read
   straight from the DB instead of making an HTTP round-trip to
   a separate backend.
   ========================================================== */
import { sql } from '@/lib/db';
import { collectionOut, journalOut, orderPublicOut, pieceOut } from '@/lib/serverMappers';
import { IMAGE_SETTINGS_KEYS } from '@/lib/img';
import type { Collection, JournalArticle, Order, Piece, Settings } from '@/lib/types';

export async function getPieces(): Promise<Piece[]> {
  const rows = await sql`SELECT * FROM pieces ORDER BY created_at`;
  return rows.map(pieceOut);
}

export async function getPiece(id: string): Promise<Piece | null> {
  const rows = await sql`SELECT * FROM pieces WHERE id = ${id}`;
  return rows.length ? pieceOut(rows[0]) : null;
}

export async function getCollections(): Promise<Collection[]> {
  const rows = await sql`SELECT * FROM collections ORDER BY sort`;
  return rows.map(collectionOut);
}

export async function getCollection(key: string): Promise<Collection | null> {
  const rows = await sql`SELECT * FROM collections WHERE key = ${key}`;
  return rows.length ? collectionOut(rows[0]) : null;
}

export async function getJournal(): Promise<JournalArticle[]> {
  const rows = await sql`SELECT * FROM journal ORDER BY sort`;
  return rows.map(journalOut);
}

export async function getArticle(id: string): Promise<JournalArticle | null> {
  const rows = await sql`SELECT * FROM journal WHERE id = ${id}`;
  return rows.length ? journalOut(rows[0]) : null;
}

export async function getOrders(): Promise<Order[]> {
  const rows = await sql`SELECT * FROM orders ORDER BY id DESC LIMIT 100`;
  return rows.map(orderPublicOut);
}

const PUBLIC_SETTINGS_ALLOWLIST = [
  'hero_eyebrow_en', 'hero_eyebrow_ar', 'hero_title_en', 'hero_title_ar',
  'contact_email', 'contact_location_en', 'contact_location_ar', 'egp_per_sar',
  ...IMAGE_SETTINGS_KEYS
];

export async function getSettings(): Promise<Settings> {
  const rows = await sql`SELECT key, value FROM settings WHERE key = ANY(${PUBLIC_SETTINGS_ALLOWLIST})`;
  const out: Settings = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export async function getSiteData() {
  const [pieces, collections, journal, orders, settings] = await Promise.all([
    getPieces(), getCollections(), getJournal(), getOrders(), getSettings()
  ]);
  return { pieces, collections, journal, orders, settings };
}
