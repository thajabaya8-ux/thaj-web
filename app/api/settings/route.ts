/* Was its own hardcoded copy of the public settings allowlist,
   independent of (and silently drifting from) the one lib/api.ts's
   getSettings() actually uses for the server-rendered page itself — the
   homepage content editor's new keys landed in one and not the other
   until this was caught live. One function, one allowlist, both callers. */
import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/api';

export async function GET() {
  return NextResponse.json(await getSettings());
}
