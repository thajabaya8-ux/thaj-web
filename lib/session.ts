/* ==========================================================
   THAJ — session
   Admin auth session as a signed cookie instead of server-side
   session storage: Vercel serverless functions don't share
   memory between invocations, so express-session's in-memory
   store (what thaj-site used) can't survive across requests.
   The cookie carries {adminId, adminEmail, exp}, HMAC-signed
   with SESSION_SECRET so it can't be forged or tampered with.
   ========================================================== */
import crypto from 'crypto';
import { cookies } from 'next/headers';

const SECRET = process.env.SESSION_SECRET;
if (!SECRET) throw new Error('SESSION_SECRET is not set');

export const SESSION_COOKIE = 'thaj.sid';
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours, matches thaj-site's session cookie

export interface SessionPayload {
  adminId: number;
  adminEmail: string;
}

function sign(data: string): string {
  return crypto.createHmac('sha256', SECRET!).update(data).digest('base64url');
}

function encode(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + MAX_AGE_SECONDS * 1000 })).toString('base64url');
  return `${body}.${sign(body)}`;
}

function decode(token: string): SessionPayload | null {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;

  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;
    if (typeof payload.adminId !== 'number' || typeof payload.adminEmail !== 'string') return null;
    return { adminId: payload.adminId, adminEmail: payload.adminEmail };
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload) {
  const store = await cookies();
  store.set(SESSION_COOKIE, encode(payload), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE_SECONDS,
    path: '/'
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decode(token);
}
