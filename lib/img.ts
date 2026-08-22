import type { Settings } from '@/lib/types';

// Decorative stock photos used outside of any single piece/collection
// (hero backdrops, atelier steps) — these are the fallback defaults;
// an admin can replace any of them from /admin/media, which stores the
// override under the matching img_stock_NN settings key.
export const IMG: string[] = [
  'assets/pieces/01.jpg', 'assets/pieces/02.jpg', 'assets/pieces/03.jpg',
  'assets/pieces/04.jpg', 'assets/pieces/05.jpg', 'assets/pieces/06.jpg',
  'assets/pieces/07.jpg', 'assets/pieces/08.jpg', 'assets/pieces/09.jpg',
  'assets/pieces/10.jpg', 'assets/pieces/11.jpg'
];

export function stockImg(settings: Settings, i: number): string {
  return settings[stockImgKey(i)] || IMG[i];
}

export function stockImgKey(i: number): string {
  return `img_stock_${String(i + 1).padStart(2, '0')}`;
}

// Every settings key that holds a site image path — admin-editable from
// /admin/media, and readable by any visitor, so this list is shared by
// both the public and admin settings allowlists.
export const IMAGE_SETTINGS_KEYS = [
  'img_logo_mark', 'img_wordmark_light', 'img_wordmark_dark',
  ...IMG.map((_, i) => stockImgKey(i))
];
