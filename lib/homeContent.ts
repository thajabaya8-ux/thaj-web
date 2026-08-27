// Every piece of editorial copy on the homepage — admin-editable from
// /admin/homepage, stored in the generic settings table like every other
// site config value (see lib/payment.ts for the identical pattern). All
// public: the homepage itself needs every one of these to render for any
// visitor. hero_eyebrow_en/ar and hero_title_en/ar predate this file and
// already lived in the settings table — kept here rather than duplicated.
//
// Two fields (home_hero_desc, home_s1_link) contain a literal "{count}"
// token the homepage replaces with the live piece count at render time —
// see applyCount() below. home_s2_title is rendered as raw HTML (it's
// always carried a <br> between its two lines) rather than escaped text,
// same as before this became admin-editable.
export const HOME_CONTENT_KEYS = [
  'hero_eyebrow_en', 'hero_eyebrow_ar', 'hero_title_en', 'hero_title_ar',
  'home_hero_desc_en', 'home_hero_desc_ar',
  'home_hero_cta1_en', 'home_hero_cta1_ar', 'home_hero_cta2_en', 'home_hero_cta2_ar',
  'home_scroll_en', 'home_scroll_ar',
  'home_s1_title_en', 'home_s1_title_ar', 'home_s1_desc_en', 'home_s1_desc_ar',
  'home_s1_link_en', 'home_s1_link_ar',
  'home_s2_eyebrow_en', 'home_s2_eyebrow_ar', 'home_s2_title_en', 'home_s2_title_ar',
  'home_s2_desc_en', 'home_s2_desc_ar', 'home_s2_cta_en', 'home_s2_cta_ar',
  'home_s3_title_en', 'home_s3_title_ar', 'home_s3_desc_en', 'home_s3_desc_ar',
  'home_s4_eyebrow_en', 'home_s4_eyebrow_ar', 'home_s4_title_en', 'home_s4_title_ar',
  'home_s4_desc_en', 'home_s4_desc_ar', 'home_s4_cta_en', 'home_s4_cta_ar',
  'home_room_eyebrow_en', 'home_room_eyebrow_ar', 'home_room_title_en', 'home_room_title_ar',
  'home_room_desc_en', 'home_room_desc_ar', 'home_room_cta_en', 'home_room_cta_ar'
];

export const applyCount = (template: string, count: string) => (template || '').replace(/\{count\}/g, count);
