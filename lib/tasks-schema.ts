import { sql } from "@/lib/db";

let ensured = false;

export async function ensureTasksSchema() {
  if (ensured) return;

  await sql`
    ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT false
  `;
  await sql`
    ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0
  `;

  ensured = true;
}
