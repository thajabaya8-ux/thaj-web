/* Public: a checkout in progress hasn't created an order yet, so this
   can't require a session — anyone completing checkout needs to attach
   a receipt before the order exists. The uploaded key is only ever
   returned to admins (app/api/admin/orders/[id]/receipt), never proxied
   publicly like assets/uploads/* — it's payment proof tied to a specific
   order, not a piece/collection photo. */
export const runtime = 'nodejs';

import crypto from 'crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { r2, R2_BUCKET } from '@/lib/r2';
import { MAX_IMAGE_SIZE, detectImageSignature } from '@/lib/imageValidation';

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('receipt');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'receipt file required (field name "receipt")' }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 4MB)' }, { status: 400 });
  }
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
    return NextResponse.json({ error: 'File is not a recognised image (jpg/png/gif/webp)' }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const sig = detectImageSignature(buf);
  if (!sig) return NextResponse.json({ error: 'File is not a recognised image (jpg/png/gif/webp)' }, { status: 400 });

  const key = `receipts/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${sig.ext}`;
  await r2.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: buf, ContentType: sig.mime }));

  return NextResponse.json({ receiptKey: key }, { status: 201 });
}
