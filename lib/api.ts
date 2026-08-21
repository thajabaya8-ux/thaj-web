/* ==========================================================
   THAJ — server-side data fetching
   Used from Server Components (layout.js, page.js files) to hit
   the Express API directly (no proxy hop needed server-side —
   the rewrite in next.config.mjs is only for the browser).
   ========================================================== */
import type { Collection, JournalArticle, Order, Piece, Settings } from '@/lib/types';

const API_ORIGIN = process.env.EXPRESS_API_URL || 'http://localhost:8000';

async function apiGet<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_ORIGIN}${path}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export const getPieces = () => apiGet<Piece[]>('/api/pieces').then((r) => r || []);
export const getPiece = (id: string) => apiGet<Piece>(`/api/pieces/${encodeURIComponent(id)}`);
export const getCollections = () => apiGet<Collection[]>('/api/collections').then((r) => r || []);
export const getCollection = (key: string) => apiGet<Collection>(`/api/collections/${encodeURIComponent(key)}`);
export const getJournal = () => apiGet<JournalArticle[]>('/api/journal').then((r) => r || []);
export const getArticle = (id: string) => apiGet<JournalArticle>(`/api/journal/${encodeURIComponent(id)}`);
export const getOrders = () => apiGet<Order[]>('/api/orders').then((r) => r || []);
export const getSettings = () => apiGet<Settings>('/api/settings').then((r) => r || {});

export async function getSiteData() {
  const [pieces, collections, journal, orders, settings] = await Promise.all([
    getPieces(), getCollections(), getJournal(), getOrders(), getSettings()
  ]);
  return { pieces, collections, journal, orders, settings };
}
