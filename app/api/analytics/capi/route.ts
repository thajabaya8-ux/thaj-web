/* Public, unauthenticated on purpose — same posture as
   app/api/analytics/track/route.ts. Server-side mirror of a standard
   Meta Pixel event (see lib/pixel.ts's trackPixel()), sent straight to
   Meta's Conversions API so the event still reaches Meta even when the
   browser's own Pixel call gets dropped by an ad blocker or a browser
   privacy feature — the exact failure confirmed on this site for
   AddToCart (silently stripped client-side, no console warning, no
   network trace, while plain PageView pings went through untouched).
   Purchase already has its own, more authoritative server-side mirror
   in app/api/orders/route.ts (real order data, not client-supplied) —
   this route is deliberately never used for it, see lib/pixel.ts.
   `event` is restricted to a known set and `customData` is capped and
   must be a plain object, same rules as the first-party analytics
   endpoint next to this one, since this is just as public and just as
   exposed to arbitrary input. */
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { str } from '@/lib/serverValidators';
import { sendEventToCapi, capiSignalsFromRequest } from '@/lib/metaCapi';
import { clientIp, isRateLimited } from '@/lib/rateLimit';
import type { Settings } from '@/lib/types';

const KNOWN_EVENTS = new Set(['ViewContent', 'AddToCart', 'InitiateCheckout', 'Lead', 'CompleteRegistration', 'Contact']);
const MAX_CUSTOM_DATA_JSON_LENGTH = 2000;

function cleanCustomData(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  try {
    return JSON.stringify(v).length <= MAX_CUSTOM_DATA_JSON_LENGTH ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const event = str(body?.event, 40);
  const eventId = str(body?.eventId, 100);
  const eventSourceUrl = str(body?.eventSourceUrl, 300);
  const customData = cleanCustomData(body?.customData);

  if (!KNOWN_EVENTS.has(event) || !eventId) return NextResponse.json({ ok: true });
  // Generous — this only exists to stop a runaway script from burning
  // through the Conversions API token's quota. Silently drops rather
  // than 429s, matching app/api/analytics/track/route.ts: the client
  // never awaits or inspects this response (see trackPixel in lib/pixel.ts).
  if (await isRateLimited(`analytics-capi:${clientIp(req)}`, 150, 300)) return NextResponse.json({ ok: true });

  try {
    const settingsRows = await sql`SELECT key, value FROM settings`;
    const settings: Settings = {};
    for (const row of settingsRows) (settings as Record<string, string>)[row.key] = row.value;

    await sendEventToCapi({
      pixelId: settings.meta_pixel_id || '',
      accessToken: settings.meta_capi_token || '',
      eventName: event,
      eventId,
      customData,
      eventSourceUrl: eventSourceUrl || req.headers.get('referer') || 'https://thajabaya.com/',
      ...capiSignalsFromRequest(req)
    });
  } catch {
    // Best-effort — a dropped CAPI mirror should never surface as an
    // error to whatever interaction triggered it.
  }
  return NextResponse.json({ ok: true });
}
