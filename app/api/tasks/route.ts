import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAccount, refreshSession } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export const dynamic = "force-dynamic";

type Task = { id: string; title: string; done: boolean; created_at: string };

export async function GET() {
  const account = await getCurrentAccount();
  if (!account) return err("Not authenticated", 401);

  const rows = (await sql`
    SELECT id, title, done, created_at
    FROM tasks
    WHERE account_id = ${account.id}::uuid
    ORDER BY done ASC, created_at DESC
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
    RETURNING id, title, done, created_at
  `) as Task[];

  await refreshSession(account.id);
  return ok({ task: rows[0] }, 201);
}
