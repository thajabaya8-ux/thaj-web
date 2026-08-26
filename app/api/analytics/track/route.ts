/* Public, unauthenticated on purpose — every visitor's browser calls
   this, logged out or not. `type` is restricted to a known set so
   this can't be used to write arbitrary strings into the table; `path`
   is just length-capped, since it's a URL path, not markup rendered
   anywhere. */
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { str } from '@/lib/serverValidators';

const KNOWN_TYPES = new Set([
  'pageview', 'ViewContent', 'AddToCart', 'InitiateCheckout',
  'Purchase', 'Lead', 'CompleteRegistration', 'Contact'
]);

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const type = str(body?.type, 40);
  const path = str(body?.path, 300);

  if (!KNOWN_TYPES.has(type) || !path) return NextResponse.json({ error: 'Invalid event' }, { status: 400 });

  try {
    await sql`INSERT INTO analytics_events (type, path) VALUES (${type}, ${path})`;
  } catch {
    // Best-effort — a dropped analytics event should never surface as an
    // error to whatever page or add-to-cart action triggered it.
  }
  return NextResponse.json({ ok: true });
}
