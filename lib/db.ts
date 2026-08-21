/* ==========================================================
   THAJ — db
   Neon Postgres connection (HTTP driver — no persistent TCP
   connections, which fits serverless functions on Vercel).
   ========================================================== */
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

export const sql = neon(process.env.DATABASE_URL);
