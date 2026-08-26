/* Step 2: Google redirects back here with a one-time code. Exchanged
   for tokens server-to-server (using GOOGLE_CLIENT_SECRET, which the
   browser never sees), then the id_token's payload is trusted as-is —
   it just came straight from Google's own token endpoint over HTTPS
   authenticated with our client secret, not from anything the client
   could have forged, so a full JWKS signature check would be checking
   a threat that isn't there. The sanity checks below (audience, issuer,
   expiry) still guard against a misconfigured client id or a stale/
   replayed token. */
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createSession } from '@/lib/session';
import { OAUTH_STATE_COOKIE } from '../route';

interface GoogleIdToken {
  sub: string; email?: string; email_verified?: boolean; name?: string;
  aud: string; iss: string; exp: number;
}

function decodeIdToken(idToken: string): GoogleIdToken | null {
  try {
    const [, payload] = idToken.split('.');
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch { return null; }
}

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const fail = (reason: string) => NextResponse.redirect(`${origin}/login?error=google&reason=${reason}`);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail('not_configured');

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const cookieState = req.headers.get('cookie')?.match(new RegExp(`${OAUTH_STATE_COOKIE}=([^;]+)`))?.[1];
  if (!code || !state || !cookieState || state !== cookieState) return fail('state_mismatch');

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: clientId, client_secret: clientSecret,
      redirect_uri: `${origin}/api/auth/google/callback`, grant_type: 'authorization_code'
    })
  }).catch(() => null);
  if (!tokenRes || !tokenRes.ok) return fail('token_exchange_failed');

  const tokenBody = await tokenRes.json().catch(() => null);
  const idToken = tokenBody?.id_token ? decodeIdToken(tokenBody.id_token) : null;
  if (!idToken || !idToken.email || idToken.aud !== clientId
    || !['accounts.google.com', 'https://accounts.google.com'].includes(idToken.iss)
    || idToken.exp * 1000 < Date.now()) {
    return fail('invalid_token');
  }
  if (idToken.email_verified === false) return fail('email_unverified');

  const email = idToken.email.toLowerCase();
  const googleId = idToken.sub;
  const name = idToken.name || null;

  let rows = await sql`SELECT * FROM users WHERE google_id = ${googleId}`;
  if (!rows.length) {
    // No account linked to this Google id yet — an existing password
    // account with the same email gets linked rather than duplicated;
    // otherwise this is a brand-new customer.
    const byEmail = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (byEmail.length) {
      rows = await sql`UPDATE users SET google_id = ${googleId} WHERE id = ${byEmail[0].id} RETURNING *`;
    } else {
      // Public self-registration (Google or otherwise) always creates a
      // 'customer' account — see signup/route.ts's own note on this.
      rows = await sql`INSERT INTO users (email, password_hash, role, name, google_id)
        VALUES (${email}, NULL, 'customer', ${name}, ${googleId}) RETURNING *`;
    }
  }
  const user = rows[0];
  if (user.status === 'suspended') return fail('suspended');

  await sql`UPDATE users SET last_login = now() WHERE id = ${user.id}`;
  await createSession({ userId: user.id, email: user.email, role: user.role, name: user.name });

  const res = NextResponse.redirect(`${origin}${user.role === 'admin' ? '/admin' : '/account'}`);
  res.cookies.delete(OAUTH_STATE_COOKIE);
  return res;
}
