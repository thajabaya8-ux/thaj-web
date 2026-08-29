/* ==========================================================
   THAJ — per-colour stock
   pieces.stock/reserved are piece-level INTEGER columns with a simple
   atomic "UPDATE ... WHERE (stock-reserved) >= qty" reservation pattern
   (see app/api/orders/route.ts). A colour variant has no column of its
   own — its stock/reserved live inside the `colors` JSON array — so the
   same atomic guarantee here means mutating one element of that array in
   a single UPDATE statement instead of a column, via jsonb_agg/jsonb_set.
   WITH ORDINALITY + ORDER BY keeps the array in its original order;
   jsonb_agg over an unordered aggregate isn't guaranteed to preserve it.
   Every function is a no-op (touches 0 rows, or leaves the array as-is)
   if the piece or colour id no longer exists — same graceful behaviour
   as the piece-level release/restore calls when a piece was since deleted.
   ========================================================== */
import { sql } from '@/lib/db';

// Atomically reserves `qty` units from one colour's own stock pool —
// mirrors the piece-level reserve, just scoped to one array element so
// two colours of the same piece never contend over one counter. Returns
// whether it actually succeeded (false if that colour can't cover qty).
export async function reserveColorStock(pieceId: string, colorId: string, qty: number): Promise<boolean> {
  const rows = await sql`
    UPDATE pieces SET colors = (
      SELECT jsonb_agg(
        CASE WHEN elem->>'id' = ${colorId}
          THEN jsonb_set(elem, '{reserved}', to_jsonb(COALESCE((elem->>'reserved')::int, 0) + ${qty}))
          ELSE elem END
        ORDER BY ord
      )
      FROM jsonb_array_elements(colors::jsonb) WITH ORDINALITY AS t(elem, ord)
    )::text
    WHERE id = ${pieceId}
      AND EXISTS (
        SELECT 1 FROM jsonb_array_elements(colors::jsonb) elem
        WHERE elem->>'id' = ${colorId}
          AND COALESCE((elem->>'stock')::int, 999) - COALESCE((elem->>'reserved')::int, 0) >= ${qty}
      )
    RETURNING id`;
  return rows.length > 0;
}

// Reservation released without ever becoming a real sale (rejected order,
// cancelled before approval, or rolled back because a later item in the
// same checkout attempt couldn't be reserved).
export async function releaseColorReserved(pieceId: string, colorId: string, qty: number): Promise<void> {
  await sql`
    UPDATE pieces SET colors = (
      SELECT jsonb_agg(
        CASE WHEN elem->>'id' = ${colorId}
          THEN jsonb_set(elem, '{reserved}', to_jsonb(GREATEST(0, COALESCE((elem->>'reserved')::int, 0) - ${qty})))
          ELSE elem END
        ORDER BY ord
      )
      FROM jsonb_array_elements(colors::jsonb) WITH ORDINALITY AS t(elem, ord)
    )::text
    WHERE id = ${pieceId}`;
}

// Payment approved — the reservation becomes a permanent deduction.
export async function deductColorStock(pieceId: string, colorId: string, qty: number): Promise<void> {
  await sql`
    UPDATE pieces SET colors = (
      SELECT jsonb_agg(
        CASE WHEN elem->>'id' = ${colorId}
          THEN jsonb_set(
                 jsonb_set(elem, '{stock}', to_jsonb(GREATEST(0, COALESCE((elem->>'stock')::int, 999) - ${qty}))),
                 '{reserved}', to_jsonb(GREATEST(0, COALESCE((elem->>'reserved')::int, 0) - ${qty}))
               )
          ELSE elem END
        ORDER BY ord
      )
      FROM jsonb_array_elements(colors::jsonb) WITH ORDINALITY AS t(elem, ord)
    )::text
    WHERE id = ${pieceId}`;
}

// An approved order is later cancelled — the earlier permanent deduction
// is given back.
export async function restoreColorStock(pieceId: string, colorId: string, qty: number): Promise<void> {
  await sql`
    UPDATE pieces SET colors = (
      SELECT jsonb_agg(
        CASE WHEN elem->>'id' = ${colorId}
          THEN jsonb_set(elem, '{stock}', to_jsonb(COALESCE((elem->>'stock')::int, 999) + ${qty}))
          ELSE elem END
        ORDER BY ord
      )
      FROM jsonb_array_elements(colors::jsonb) WITH ORDINALITY AS t(elem, ord)
    )::text
    WHERE id = ${pieceId}`;
}
