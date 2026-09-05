/* Public, unauthenticated on purpose — every visitor's browser calls
   this, logged out or not. `type` is restricted to a known set so
   this can't be used to write arbitrary strings into the table; `path`
   and `visitorId` are just length-capped, since they're never rendered
   anywhere as markup. `metadata` is a free-form JSON object (whatever
   detail that event type carries) — capped in size, dropped entirely
   rather than truncated if it's too big, since a half-cut JSON blob is
   worse than none. user_id is filled in server-side from the session
   cookie when there is one (customer or admin) — never trusted from
   the request body, same rule as everywhere else a caller's identity
   matters. */
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { str } from '@/lib/serverValidators';
import { getSession } from '@/lib/session';

const KNOWN_TYPES = new Set([
  // Meta Pixel standard events — trackPixel() (lib/pixel.ts) already
  // fires these, this is just where they land for the first-party log too.
  'pageview', 'ViewContent', 'AddToCart', 'InitiateCheckout',
  'Purchase', 'Lead', 'CompleteRegistration', 'Contact',
  // Everything else with no Meta equivalent — the customer's own path
  // through the site, and the admin's actions on an order.
  'RemoveFromCart', 'UpdateQuantity', 'SelectColor', 'SelectSize',
  'AddToWishlist', 'RemoveFromWishlist', 'CheckoutStep',
  'SelectGovernorate', 'SelectPaymentMethod', 'ConfirmOrderClick', 'OrderFailed',
  'AdminOrderStatusChanged', 'AdminPaymentApproved', 'AdminPaymentRejected', 'AdminOrderDeleted'
]);

const MAX_METADATA_JSON_LENGTH = 4000;

function cleanMetadata(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  try {
    const json = JSON.stringify(v);
    return json.length <= MAX_METADATA_JSON_LENGTH ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const type = str(body?.type, 40);
  const path = str(body?.path, 300);
  const visitorId = str(body?.visitorId, 100) || null;
  const metadata = cleanMetadata(body?.metadata);

  if (!KNOWN_TYPES.has(type) || !path) return NextResponse.json({ error: 'Invalid event' }, { status: 400 });

  try {
    const session = await getSession();
    await sql`INSERT INTO analytics_events (type, path, visitor_id, user_id, metadata)
      VALUES (${type}, ${path}, ${visitorId}, ${session?.userId ?? null}, ${metadata ? JSON.stringify(metadata) : null})`;
  } catch {
    // Best-effort — a dropped analytics event should never surface as an
    // error to whatever page or add-to-cart action triggered it.
  }
  return NextResponse.json({ ok: true });
}
