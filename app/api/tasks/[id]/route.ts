import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAccount, refreshSession } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PUT(req: NextRequest, { params }: Params) {
  const account = await getCurrentAccount();
  if (!account) return err("Not authenticated", 401);

  const { id } = await params;
  if (!UUID_RE.test(id)) return err("Invalid task id", 400);

  let body: { done?: boolean; title?: string; pinned?: boolean };
  try {
    body = await req.json();
  } catch {
    return err("Invalid request body.", 400);
  }

  const done   = typeof body.done   === "boolean" ? body.done   : null;
  const pinned = typeof body.pinned === "boolean" ? body.pinned : null;
  const title  = typeof body.title  === "string"  ? body.title.trim().slice(0, 500) : null;

  const rows = (await sql`
    UPDATE tasks
    SET done   = COALESCE(${done},   done),
        pinned = COALESCE(${pinned}, pinned),
        title  = COALESCE(${title},  title)
    WHERE id = ${id}::uuid AND account_id = ${account.id}::uuid
    RETURNING id, title, done, pinned, sort_order, created_at
  `) as Array<{ id: string; title: string; done: boolean; pinned: boolean; sort_order: number; created_at: string }>;

  if (rows.length === 0) return err("Task not found.", 404);

  await refreshSession(account.id);
  return ok({ task: rows[0] });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const account = await getCurrentAccount();
  if (!account) return err("Not authenticated", 401);

  const { id } = await params;
  if (!UUID_RE.test(id)) return err("Invalid task id", 400);

  const rows = (await sql`
    DELETE FROM tasks
    WHERE id = ${id}::uuid AND account_id = ${account.id}::uuid
    RETURNING id
  `) as { id: string }[];

  if (rows.length === 0) return err("Task not found.", 404);

  await refreshSession(account.id);
  return ok({ ok: true });
}
