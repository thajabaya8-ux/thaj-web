import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createSession } from '@/lib/session';
import { isEmail, str } from '@/lib/serverValidators';

// Public self-registration always creates a 'customer' account — role is
// never taken from the request body, so a visitor can't grant themselves
// admin access by sending {"role":"admin"}.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = str(body?.name, 200);
  const email = String((body && body.email) || '').trim().toLowerCase();
  const password = String((body && body.password) || '');

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (!isEmail(email)) return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });

  const existing = await sql`SELECT 1 FROM users WHERE email = ${email}`;
  if (existing.length) return NextResponse.json({ error: 'An account with that email already exists' }, { status: 409 });

  const hash = bcrypt.hashSync(password, 12);
  const rows = await sql`INSERT INTO users (email, password_hash, role, name)
    VALUES (${email}, ${hash}, 'customer', ${name}) RETURNING id, email, role, name`;
  const user = rows[0];

  await createSession({ userId: user.id, email: user.email, role: user.role, name: user.name });
  return NextResponse.json({ email: user.email, role: user.role, name: user.name }, { status: 201 });
}
