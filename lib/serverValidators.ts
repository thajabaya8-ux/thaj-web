/* ==========================================================
   THAJ — validators
   Small, pure server-side validation helpers. The admin forms
   validate client-side too, but that's a UX convenience, not a
   security boundary — every one of these is re-checked here
   before it touches the DB.
   ========================================================== */
const SLUG = /^[a-z0-9-]{1,60}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isSlug = (v: unknown): v is string => typeof v === 'string' && SLUG.test(v);
export const isEmail = (v: unknown): v is string => typeof v === 'string' && v.length <= 254 && EMAIL.test(v);

// .trim() first — a stray leading/trailing space (a common copy-paste
// artifact, e.g. pasting a Meta Pixel ID from its dashboard) is never
// something any caller actually wants preserved, and left untrimmed it
// can silently break exact-match consumers like fbq('init', pixelId).
export const str = (v: unknown, max = 500): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export const strArray = (v: unknown, maxItems = 40, maxLen = 2000): string[] =>
  Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, maxItems).map((x) => x.slice(0, maxLen)) : [];

export const nonNegativeInt = (v: unknown, fallback = 0): number => {
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) && n >= 0 && n <= 100000000 ? n : fallback;
};

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

// A piece's colour variants — each needs a stable id (cart/order line
// items reference it, not the display name, so renaming a colour later
// never orphans anything already in a cart or order), a real hex value
// (falls back to a neutral grey rather than rejecting the whole piece
// over one bad swatch), and its own photo set, same size cap as the
// piece-level gallery.
export function sanitizePieceColors(v: unknown): { id: string; nameEn: string; nameAr: string; hex: string; images: string[] }[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  return v.slice(0, 8).map((c, i) => {
    const o = (c && typeof c === 'object' ? c : {}) as Record<string, unknown>;
    const nameEn = str(o.nameEn, 40);
    let id = isSlug(o.id) ? (o.id as string) : slugify(nameEn) || `color-${i + 1}`;
    while (seen.has(id)) id = `${id}-${i + 1}`;
    seen.add(id);
    return {
      id, nameEn, nameAr: str(o.nameAr, 40),
      hex: typeof o.hex === 'string' && HEX_COLOR.test(o.hex) ? o.hex : '#CCCCCC',
      images: strArray(o.images, 10, 300)
    };
  }).filter((c) => c.nameEn || c.images.length);
}

export const sanitizeSizes = (v: unknown): string[] => strArray(v, 10, 20);
