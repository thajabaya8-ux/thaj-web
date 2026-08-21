import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createSession } from '@/lib/session';

// Compared against on every failed lookup so that "unknown email" and
// "wrong password" take the same amount of time — otherwise the response
// latency itself tells an attacker which emails have accounts.
const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(24).toString('hex'), 12);

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String((body && body.email) || '').trim().toLowerCase();
  const password = String((body && body.password) || '');

  const rows = await sql`SELECT * FROM admins WHERE email = ${email}`;
  const admin = rows[0];
  const validPassword = bcrypt.compareSync(password, admin ? admin.password_hash : DUMMY_HASH);

  if (!admin || !validPassword) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  await createSession({ adminId: admin.id, adminEmail: admin.email });
  return NextResponse.json({ email: admin.email });
}
