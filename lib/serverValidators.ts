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
