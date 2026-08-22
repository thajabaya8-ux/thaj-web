/* Streams the payment receipt for one order from R2 — admin-only, unlike
   assets/uploads/* which is publicly proxied. Receipts are payment proof
   tied to a specific customer's order, not general site imagery. */
export const runtime = 'nodejs';

import { GetObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { r2, R2_BUCKET } from '@/lib/r2';

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp'
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const rows = await sql`SELECT receipt_key FROM orders WHERE id = ${id}`;
  const key = rows[0]?.receipt_key;
  if (!key) return new NextResponse(null, { status: 404 });

  try {
    const obj = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    const bytes = await obj.Body!.transformToByteArray();
    const ext = key.slice(key.lastIndexOf('.'));
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type': obj.ContentType || CONTENT_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': 'private, no-store'
      }
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
