/* Creates the Postgres schema on Neon. Safe to re-run (IF NOT EXISTS).
   Usage: npm run migrate */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Run with: node --env-file=.env.local scripts/migrate.mjs');
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = neon(process.env.DATABASE_URL);
const schema = readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

const statements = schema
  .split(/;\s*(?:\n|$)/)
  .map((s) => s.trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
  console.log('OK:', statement.split('\n')[0].slice(0, 60));
}

console.log(`Migration complete — ${statements.length} statements applied.`);
