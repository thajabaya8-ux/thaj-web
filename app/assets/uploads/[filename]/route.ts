/* Proxies admin-uploaded images out of the (private) R2 bucket under the
   same 'assets/uploads/<filename>' path the DB has always stored, so the
   bucket itself never needs public access configured. */
export const runtime = 'nodejs';

import { GetObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { r2, R2_BUCKET } from '@/lib/r2';

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp'
};

export async function GET(_req: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  try {
    const obj = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: filename }));
    const bytes = await obj.Body!.transformToByteArray();
    const ext = filename.slice(filename.lastIndexOf('.'));
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type': obj.ContentType || CONTENT_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
