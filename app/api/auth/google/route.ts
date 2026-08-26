/* Step 1 of the OAuth flow: send the browser to Google's own consent
   screen. The state value is a CSRF guard, checked against this same
   cookie when the callback comes back — without it, an attacker could
   trick a signed-in browser into completing someone else's OAuth flow. */
import crypto from 'crypto';
import { NextResponse } from 'next/server';

export const OAUTH_STATE_COOKIE = 'thaj.oauth_state';

export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: 'Google sign-in is not configured' }, { status: 501 });

  const origin = new URL(req.url).origin;
  const state = crypto.randomBytes(24).toString('base64url');

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', `${origin}/api/auth/google/callback`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'select_account');

  const res = NextResponse.redirect(url);
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 600, path: '/'
  });
  return res;
}
