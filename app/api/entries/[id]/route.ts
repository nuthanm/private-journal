import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAccount, refreshSession } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// UUID v4 format validator — keeps invalid IDs out of SQL parameters
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// -------- GET /api/entries/[id] -----------
export async function GET(_req: NextRequest, { params }: Params) {
  const account = await getCurrentAccount();
  if (!account) return err("Not authenticated", 401);

  const { id } = await params;
  if (!UUID_RE.test(id)) return err("Invalid entry id", 400);

  const rows = (await sql`
    SELECT id, title, body, visibility, created_at, updated_at
    FROM entries
    WHERE id = ${id}::uuid AND account_id = ${account.id}::uuid
    LIMIT 1
  `) as Array<{
    id: string;
    title: string;
    body: string;
    visibility: string;
    created_at: string;
    updated_at: string;
  }>;

  if (rows.length === 0) return err("Entry not found.", 404);

  await refreshSession(account.id);
  return ok({ entry: rows[0] });
}

// -------- PUT /api/entries/[id] -----------
export async function PUT(req: NextRequest, { params }: Params) {
  const account = await getCurrentAccount();
  if (!account) return err("Not authenticated", 401);

  const { id } = await params;
  if (!UUID_RE.test(id)) return err("Invalid entry id", 400);

  let body: { title?: string; body?: string; visibility?: string };
  try {
    body = await req.json();
  } catch {
    return err("Invalid request body.", 400);
  }

  const title = body.title !== undefined ? body.title.trim().slice(0, 500) : undefined;
  const text = body.body !== undefined ? body.body.slice(0, 100_000) : undefined;
  const vis = body.visibility !== undefined && ["private", "link", "public"].includes(body.visibility)
    ? body.visibility
    : undefined;

  // Build the update dynamically with COALESCE to only set provided fields
  const rows = (await sql`
    UPDATE entries
    SET
      title      = COALESCE(${title ?? null}, title),
      body       = COALESCE(${text ?? null}, body),
      visibility = COALESCE(${vis ?? null}, visibility)
    WHERE id = ${id}::uuid AND account_id = ${account.id}::uuid
    RETURNING id, title, body, visibility, created_at, updated_at
  `) as Array<{
    id: string;
    title: string;
    body: string;
    visibility: string;
    created_at: string;
    updated_at: string;
  }>;

  if (rows.length === 0) return err("Entry not found.", 404);

  await refreshSession(account.id);
  return ok({ entry: rows[0] });
}

// -------- DELETE /api/entries/[id] -----------
export async function DELETE(_req: NextRequest, { params }: Params) {
  const account = await getCurrentAccount();
  if (!account) return err("Not authenticated", 401);

  const { id } = await params;
  if (!UUID_RE.test(id)) return err("Invalid entry id", 400);

  const result = (await sql`
    DELETE FROM entries
    WHERE id = ${id}::uuid AND account_id = ${account.id}::uuid
    RETURNING id
  `) as { id: string }[];

  if (result.length === 0) return err("Entry not found.", 404);

  await refreshSession(account.id);
  return ok({ ok: true });
}
