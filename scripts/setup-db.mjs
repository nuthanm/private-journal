// Runs scripts/schema.sql against the database in DATABASE_URL.
// Usage:  node scripts/setup-db.mjs

import { neon } from "@neondatabase/serverless";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL is not set in .env.local");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

// Embed the schema directly in this file to avoid any parsing issues with
// dollar-quoted function bodies. Each entry in this array is one statement.
const STATEMENTS = [
  `CREATE EXTENSION IF NOT EXISTS pgcrypto`,

  `CREATE TABLE IF NOT EXISTS accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_hash      TEXT NOT NULL UNIQUE,
    secret_hash     TEXT NOT NULL,
    recovery_hash   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_signin_at  TIMESTAMPTZ
  )`,

  `CREATE INDEX IF NOT EXISTS accounts_phone_idx ON accounts(phone_hash)`,

  `CREATE TABLE IF NOT EXISTS entries (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id   UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    title        TEXT NOT NULL DEFAULT '',
    body         TEXT NOT NULL DEFAULT '',
    title_ciphertext  BYTEA,
    body_ciphertext   BYTEA,
    nonce             BYTEA,
    wrapped_entry_key BYTEA,
    visibility   TEXT NOT NULL DEFAULT 'private'
                   CHECK (visibility IN ('private','link','public')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,

  `CREATE INDEX IF NOT EXISTS entries_account_updated_idx
    ON entries(account_id, updated_at DESC)`,

  `CREATE TABLE IF NOT EXISTS tasks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id  UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    done        BOOLEAN NOT NULL DEFAULT false,
    pinned      BOOLEAN NOT NULL DEFAULT false,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,

  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT false`,

  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0`,

  `CREATE INDEX IF NOT EXISTS tasks_account_idx ON tasks(account_id, created_at DESC)`,

  `CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
   BEGIN
     NEW.updated_at = now();
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql`,

  `DROP TRIGGER IF EXISTS entries_touch_updated_at ON entries`,

  `CREATE TRIGGER entries_touch_updated_at
    BEFORE UPDATE ON entries
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at()`,
];

async function main() {
  console.log(`Running ${STATEMENTS.length} statements against database...`);

  for (const stmt of STATEMENTS) {
    const preview = stmt.replace(/\s+/g, " ").slice(0, 70);
    process.stdout.write(`  ${preview}... `);
    try {
      await sql(stmt);
      console.log("ok");
    } catch (e) {
      console.log("FAIL");
      console.error("    ", e.message);
      process.exit(1);
    }
  }

  // Verify the tables actually exist after we ran the schema
  const tables = await sql`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename IN ('accounts','entries','tasks')
    ORDER BY tablename
  `;
  console.log(
    "\nTables present:",
    tables.map((t) => t.tablename).join(", ") || "(none)",
  );

  if (tables.length === 3) {
    console.log("Done. Schema is in place.");
    console.log("Next: visit /signup to create your first account.");
  } else {
    console.error("Some tables missing. Check Neon dashboard.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
