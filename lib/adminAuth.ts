import { NextResponse } from 'next/server';
import { getSession, type SessionPayload } from '@/lib/session';

// Every admin route handler starts with:
//   const session = await requireAdmin();
//   if (session instanceof NextResponse) return session;
export async function requireAdmin(): Promise<SessionPayload | NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  return session;
}
