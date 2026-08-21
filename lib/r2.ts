/* ==========================================================
   THAJ — r2
   Cloudflare R2 client (S3-compatible API) for admin-uploaded
   piece/collection/journal photos. Buckets are kept private —
   app/assets/uploads/[filename]/route.ts proxies reads through
   this app's own origin instead, so no public R2 access needs
   to be configured and the existing 'assets/uploads/...' image
   paths stored in the DB keep working unchanged.
   ========================================================== */
import { S3Client } from '@aws-sdk/client-s3';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!accountId || !accessKeyId || !secretAccessKey) {
  throw new Error('R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY must be set');
}

export const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey }
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME;
if (!R2_BUCKET) throw new Error('R2_BUCKET_NAME is not set');
