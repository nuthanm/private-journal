import { sql } from "@/lib/db";

let ensured = false;
let ensurePromise: Promise<void> | null = null;

export async function ensureTasksSchema() {
  if (ensured) return;
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    await sql`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT false
    `;
    await sql`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0
    `;
    ensured = true;
  })();

  try {
    await ensurePromise;
  } finally {
    ensurePromise = null;
  }
}
