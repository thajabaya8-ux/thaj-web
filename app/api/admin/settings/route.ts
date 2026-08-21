import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { str } from '@/lib/serverValidators';

// Only known keys can be written — the client sending arbitrary key/value
// pairs shouldn't be able to grow the settings table without bound.
const SETTINGS_ALLOWLIST = [
  'hero_eyebrow_en', 'hero_eyebrow_ar', 'hero_title_en', 'hero_title_ar',
  'contact_email', 'contact_location_en', 'contact_location_ar'
];

async function readSettings() {
  const rows = await sql`SELECT key, value FROM settings`;
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;
  return NextResponse.json(await readSettings());
}

export async function PUT(req: Request) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const b = await req.json().catch(() => ({}));
  for (const key of SETTINGS_ALLOWLIST) {
    if (Object.prototype.hasOwnProperty.call(b, key)) {
      const value = key === 'contact_email' ? str(b[key], 254) : str(b[key], 500);
      await sql`INSERT INTO settings (key,value) VALUES (${key},${value})
        ON CONFLICT (key) DO UPDATE SET value = excluded.value`;
    }
  }
  return NextResponse.json(await readSettings());
}
