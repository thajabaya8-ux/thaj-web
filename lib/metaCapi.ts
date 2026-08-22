/* ==========================================================
   THAJ — Meta Conversions API
   Server-side mirror of the browser Purchase event, for resilience
   against ad blockers / browser privacy settings that drop the
   client-side Pixel call. Deliberately sends NO personal data — no
   name, email, phone, or address — only the same eventId the
   browser Pixel used for this order (Meta's documented dedup key)
   plus non-identifying connection signals (ip/user-agent/fbp/fbc)
   that improve match quality without identifying the customer.
   Both the Pixel ID and the access token are admin-editable settings
   (Settings → Marketing), not env vars — the caller (app/api/orders/route.ts)
   already has the settings row loaded for other purposes, so it's passed
   straight in here rather than this file querying the DB itself.
   No-ops entirely until both are set — the browser Pixel call in
   lib/pixel.ts already covers the event on its own.
   ========================================================== */
interface CapiPurchaseInput {
  pixelId: string;
  accessToken: string;
  eventId: string;
  value: number;
  currency: string;
  contentIds: string[];
  numItems: number;
  eventSourceUrl: string;
  clientIp?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
}

export async function sendPurchaseToCapi(input: CapiPurchaseInput): Promise<void> {
  if (!input.pixelId || !input.accessToken) return;

  const userData: Record<string, string> = {};
  if (input.clientIp) userData.client_ip_address = input.clientIp;
  if (input.userAgent) userData.client_user_agent = input.userAgent;
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) userData.fbc = input.fbc;

  const payload = {
    data: [{
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      event_id: input.eventId,
      event_source_url: input.eventSourceUrl,
      action_source: 'website',
      user_data: userData,
      custom_data: {
        value: input.value,
        currency: input.currency,
        content_ids: input.contentIds,
        content_type: 'product',
        num_items: input.numItems
      }
    }]
  };

  try {
    await fetch(`https://graph.facebook.com/v21.0/${input.pixelId}/events?access_token=${input.accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    // Best-effort — never block or fail order creation on Meta's API.
  }
}

function parseCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function capiSignalsFromRequest(req: Request) {
  const cookieHeader = req.headers.get('cookie');
  return {
    clientIp: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
    userAgent: req.headers.get('user-agent') || undefined,
    fbp: parseCookie(cookieHeader, '_fbp'),
    fbc: parseCookie(cookieHeader, '_fbc')
  };
}
