// Meta Pixel / Conversions API settings keys — admin-editable from
// /admin/settings, stored in the generic settings table like every other
// site config value (see lib/payment.ts for the identical pattern).
// meta_pixel_id is public (any visitor's browser needs it to init the
// Pixel — Pixel IDs are never secret, every site using one exposes it in
// its page source). meta_capi_token is a real secret and stays
// admin-only: never included in the public settings allowlist.
export const META_SETTINGS_KEYS = ['meta_pixel_id'];
export const META_ADMIN_ONLY_SETTINGS_KEYS = ['meta_capi_token'];
