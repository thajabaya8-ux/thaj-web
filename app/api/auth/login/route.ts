import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createSession } from '@/lib/session';
import { clientIp, isRateLimited } from '@/lib/rateLimit';

// Compared against on every failed lookup so that "unknown email" and
// "wrong password" take the same amount of time — otherwise the response
// latency itself tells an attacker which emails have accounts.
const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(24).toString('hex'), 12);

export async function POST(req: Request) {
  // Credential stuffing / brute force guard — generous enough that a
  // shared office IP or a genuine typo-then-retry never trips it.
  if (await isRateLimited(`login:${clientIp(req)}`, 15, 300)) {
    return NextResponse.json({ error: 'Too many attempts — please wait a few minutes and try again' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const email = String((body && body.email) || '').trim().toLowerCase();
  const password = String((body && body.password) || '');

  const rows = await sql`SELECT * FROM users WHERE email = ${email}`;
  const user = rows[0];
  // A Google-only account has no password_hash to compare against — falls
  // through to the dummy hash exactly like an unknown email, so this also
  // doesn't leak "this email exists but only via Google" through timing.
  const validPassword = bcrypt.compareSync(password, (user && user.password_hash) || DUMMY_HASH);

  if (!user || !validPassword) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }
  if (user.status === 'suspended') {
    return NextResponse.json({ error: 'This account has been suspended' }, { status: 403 });
  }

  await sql`UPDATE users SET last_login = now() WHERE id = ${user.id}`;
  await createSession({ userId: user.id, email: user.email, role: user.role, name: user.name });
  return NextResponse.json({ email: user.email, role: user.role, name: user.name });
}
