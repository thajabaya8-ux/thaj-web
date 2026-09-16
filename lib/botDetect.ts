/* ==========================================================
   THAJ — bot detection
   A crawler sweeping through every product page in seconds fires the
   exact same analytics calls a real visitor would (pageview,
   ViewContent, ...) — each one a database write. That's harmless in
   small numbers, but a sustained crawl keeps the Neon compute endpoint
   awake around the clock (it only suspends after 5 minutes with no
   activity at all), burning through the monthly compute-hour
   allowance for traffic nobody actually wants tracked in the first
   place. This is a plain substring check against known crawler user
   agents — not meant to catch every bot (a determined scraper can fake
   its UA), just the overwhelming majority that don't bother to.
   ========================================================== */
const BOT_UA_PATTERNS = [
  'bot', 'spider', 'crawl', 'slurp', 'headless',
  'facebookexternalhit', 'whatsapp', 'telegrambot', 'discordbot',
  'gptbot', 'claudebot', 'ccbot', 'bytespider', 'petalbot',
  'ahrefsbot', 'semrushbot', 'mj12bot', 'dotbot', 'yandexbot',
  'lighthouse', 'pagespeed', 'pingdom', 'uptimerobot'
];

export function isBotRequest(req: Request): boolean {
  const ua = req.headers.get('user-agent')?.toLowerCase() || '';
  if (!ua) return true; // no user agent at all — no real browser ever omits this
  return BOT_UA_PATTERNS.some((p) => ua.includes(p));
}
