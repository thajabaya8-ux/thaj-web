/* ==========================================================
   THAJ — session
   Auth session as a signed cookie instead of server-side session
   storage: Vercel serverless functions don't share memory between
   invocations, so express-session's in-memory store (what
   thaj-site used) can't survive across requests.
   The cookie carries {userId, email, role, exp}, HMAC-signed with
   SESSION_SECRET so it can't be forged or tampered with. `role`
   ('admin' | 'customer') is set once at login from the users
   table and never trusted from the client — it's what lets
   lib/adminAuth.ts tell the two kinds of account apart.
   ========================================================== */
import crypto from 'crypto';
import { cookies } from 'next/headers';

const SECRET = process.env.SESSION_SECRET;
if (!SECRET) throw new Error('SESSION_SECRET is not set');

export const SESSION_COOKIE = 'thaj.sid';
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours, matches thaj-site's session cookie

export type Role = 'admin' | 'customer';

export interface SessionPayload {
  userId: number;
  email: string;
  role: Role;
  name: string | null;
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
    if (typeof payload.userId !== 'number' || typeof payload.email !== 'string') return null;
    if (payload.role !== 'admin' && payload.role !== 'customer') return null;
    return { userId: payload.userId, email: payload.email, role: payload.role, name: payload.name ?? null };
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
