/* ==========================================================
   THAJ — marquee item helpers
   Shared between components/HeroFilm.tsx and app/(site)/page.tsx's own
   desktop strip — both render the same admin-curated list (a slot is
   either a real piece or a plain banner image, see MarqueeItem in
   lib/types.ts) and need the same three facts out of either shape.
   ========================================================== */
import type { MarqueeItem } from './types';

export function marqueeItemImg(item: MarqueeItem): string {
  return item.kind === 'piece' ? item.piece.img : item.img;
}

// A piece's own id is already unique and stable; a banner image has no
// id of its own, so its path stands in for one.
export function marqueeItemKey(item: MarqueeItem): string {
  return item.kind === 'piece' ? item.piece.id : `img:${item.img}`;
}

// A banner has no product behind it — /shop is the closest sensible
// destination for a tap/click rather than a dead link.
export function marqueeItemHref(item: MarqueeItem): string {
  return item.kind === 'piece' ? `/product/${item.piece.id}` : '/shop';
}
