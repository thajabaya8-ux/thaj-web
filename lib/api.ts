/* ==========================================================
   THAJ — server-side data fetching
   Used from Server Components (layout.js, page.js files). Data
   lives in this same app now (Neon via lib/db.ts), so these read
   straight from the DB instead of making an HTTP round-trip to
   a separate backend.
   ========================================================== */
import { sql } from '@/lib/db';
import { collectionOut, pieceOut } from '@/lib/serverMappers';
import { IMAGE_SETTINGS_KEYS } from '@/lib/img';
import { PAYMENT_SETTINGS_KEYS } from '@/lib/payment';
import { META_SETTINGS_KEYS } from '@/lib/marketing';
import { HOME_CONTENT_KEYS } from '@/lib/homeContent';
import type { Collection, Piece, Settings } from '@/lib/types';

export async function getPieces(): Promise<Piece[]> {
  const rows = await sql`SELECT * FROM pieces WHERE visible ORDER BY created_at`;
  return rows.map(pieceOut);
}

export async function getPiece(id: string): Promise<Piece | null> {
  const rows = await sql`SELECT * FROM pieces WHERE id = ${id} AND visible`;
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

const PUBLIC_SETTINGS_ALLOWLIST = [
  ...HOME_CONTENT_KEYS,
  'contact_email', 'contact_location_en', 'contact_location_ar', 'egp_per_sar',
  // One policy, shown in two places (the shipping page's own row, and a
  // short note on every product page) — a single admin field instead of
  // two copies that could say different things.
  'return_policy_en', 'return_policy_ar',
  ...IMAGE_SETTINGS_KEYS, ...PAYMENT_SETTINGS_KEYS, ...META_SETTINGS_KEYS
];

export async function getSettings(): Promise<Settings> {
  const rows = await sql`SELECT key, value FROM settings WHERE key = ANY(${PUBLIC_SETTINGS_ALLOWLIST})`;
  const out: Settings = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export async function getSiteData() {
  const [pieces, collections, settings] = await Promise.all([
    getPieces(), getCollections(), getSettings()
  ]);
  return { pieces, collections, settings };
}
