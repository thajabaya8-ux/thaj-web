import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { IMAGE_SETTINGS_KEYS } from '@/lib/img';

const PUBLIC_SETTINGS_ALLOWLIST = [
  'hero_eyebrow_en', 'hero_eyebrow_ar', 'hero_title_en', 'hero_title_ar',
  'contact_email', 'contact_location_en', 'contact_location_ar', 'egp_per_sar',
  ...IMAGE_SETTINGS_KEYS
];

export async function GET() {
  const rows = await sql`SELECT key, value FROM settings WHERE key = ANY(${PUBLIC_SETTINGS_ALLOWLIST})`;
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value;
  return NextResponse.json(out);
}
