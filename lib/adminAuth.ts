import { NextResponse } from 'next/server';
import { getSession, type SessionPayload } from '@/lib/session';

// Every admin route handler starts with:
//   const session = await requireAdmin();
//   if (session instanceof NextResponse) return session;
// Rejects both anonymous requests and authenticated customer accounts —
// role is read from the signed session cookie (set at login from the
// users table), never from anything the client can influence.
export async function requireAdmin(): Promise<SessionPayload | NextResponse> {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return session;
}
