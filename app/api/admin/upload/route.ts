/* Magic-byte signatures — the client-supplied Content-Type/extension are
   trivially spoofable, so the accepted list is enforced against the
   file's actual bytes, not the claimed mimetype. Files are pushed to R2;
   app/assets/uploads/[filename]/route.ts proxies them back out under the
   same 'assets/uploads/...' path the DB has always stored. */
export const runtime = 'nodejs';

import crypto from 'crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { r2, R2_BUCKET } from '@/lib/r2';

const MAX_SIZE = 4 * 1024 * 1024; // Vercel serverless functions cap request bodies around 4.5MB

const SIGNATURES = [
  { ext: '.jpg', mime: 'image/jpeg', check: (b: Buffer) => b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF },
  { ext: '.png', mime: 'image/png', check: (b: Buffer) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47 },
  { ext: '.gif', mime: 'image/gif', check: (b: Buffer) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 },
  { ext: '.webp', mime: 'image/webp', check: (b: Buffer) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 }
];

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const form = await req.formData();
  const file = form.get('image');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'image file required (field name "image")' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 4MB)' }, { status: 400 });
  }
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
    return NextResponse.json({ error: 'File is not a recognised image (jpg/png/gif/webp)' }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const sig = SIGNATURES.find((s) => s.check(buf));
  if (!sig) return NextResponse.json({ error: 'File is not a recognised image (jpg/png/gif/webp)' }, { status: 400 });

  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${sig.ext}`;
  await r2.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: filename, Body: buf, ContentType: sig.mime }));

  return NextResponse.json({ path: `assets/uploads/${filename}` }, { status: 201 });
}
