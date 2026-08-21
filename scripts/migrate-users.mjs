/* One-time migration: admins -> users (adds role + name so the same
   table and the same /login page serve both admins and customers).
   Safe to re-run — no-ops once 'admins' no longer exists.
   Usage: npm run migrate:users */
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Run with: node --env-file=.env.local scripts/migrate-users.mjs');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const [{ exists: adminsExists }] = await sql`
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admins') AS exists
`;

if (!adminsExists) {
  console.log('No "admins" table found — already migrated, nothing to do.');
  process.exit(0);
}

await sql`ALTER TABLE admins RENAME TO users`;
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer'`;
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT`;
// Every row in the old admins-only table was, by definition, an admin.
await sql`UPDATE users SET role = 'admin'`;
await sql`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin','customer'))`;

console.log('Migrated: admins -> users (role, name added; existing rows set to role=admin).');
