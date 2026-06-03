import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAccount, refreshSession } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export const dynamic = "force-dynamic";

type Task = {
  id: string;
  title: string;
  done: boolean;
  pinned: boolean;
  sort_order: number;
  created_at: string;
};

export async function GET() {
  const account = await getCurrentAccount();
  if (!account) return err("Not authenticated", 401);

  const rows = (await sql`
    SELECT id, title, done, pinned, sort_order, created_at
    FROM tasks
    WHERE account_id = ${account.id}::uuid
    ORDER BY pinned DESC, done ASC, sort_order ASC, created_at DESC
    LIMIT 200
  `) as Task[];

  await refreshSession(account.id);
  return ok({ tasks: rows });
}

export async function POST(req: NextRequest) {
  const account = await getCurrentAccount();
  if (!account) return err("Not authenticated", 401);

  let body: { title?: string };
  try {
    body = await req.json();
  } catch {
    return err("Invalid request body.", 400);
  }

  const title = (body.title || "").trim().slice(0, 500);
  if (!title) return err("Task title is required.", 400);

  const rows = (await sql`
    INSERT INTO tasks (account_id, title)
    VALUES (${account.id}::uuid, ${title})
    RETURNING id, title, done, pinned, sort_order, created_at
  `) as Task[];

  await refreshSession(account.id);
  return ok({ task: rows[0] }, 201);
}

// PATCH /api/tasks — bulk reorder: accepts { ids: string[] } and sets sort_order
export async function PATCH(req: NextRequest) {
  const account = await getCurrentAccount();
  if (!account) return err("Not authenticated", 401);

  let body: { ids?: string[]; pinned?: boolean };
  try {
    body = await req.json();
  } catch {
    return err("Invalid request body.", 400);
  }

  const ids = body.ids;
  if (!Array.isArray(ids) || ids.length === 0) return err("ids array is required.", 400);

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (ids.some((id) => !UUID_RE.test(id))) return err("Invalid task id in list.", 400);

  // Verify all IDs belong to this account before modifying anything
  const owned = (await sql`
    SELECT id FROM tasks
    WHERE id = ANY(${ids}::uuid[]) AND account_id = ${account.id}::uuid
  `) as { id: string }[];

  if (owned.length !== ids.length) return err("One or more task IDs not found.", 404);

  // pinned flag tells us which group: pinned tasks offset by 0, pending by 10000
  const isPinned = body.pinned === true;
  const offset = isPinned ? 0 : 10000;

  // Update each task's sort_order in a single atomic query using unnest
  const sortOrders = ids.map((_, i) => offset + i);
  await sql`
    UPDATE tasks
    SET sort_order = v.ord
    FROM unnest(${ids}::uuid[], ${sortOrders}::int[]) AS v(id, ord)
    WHERE tasks.id = v.id AND tasks.account_id = ${account.id}::uuid
  `;

  await refreshSession(account.id);
  return ok({ ok: true });
}
