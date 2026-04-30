import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAccount, refreshSession } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export const dynamic = "force-dynamic";

type Entry = {
  id: string;
  title: string;
  body: string;
  visibility: "private" | "link" | "public";
  created_at: string;
  updated_at: string;
};

// -------- GET /api/entries — list current user's entries -----------
export async function GET(req: NextRequest) {
  const account = await getCurrentAccount();
  if (!account) return err("Not authenticated", 401);

  const url = new URL(req.url);
  const visibility = url.searchParams.get("visibility");

  let rows: Entry[];
  if (visibility && ["private", "link", "public"].includes(visibility)) {
    rows = (await sql`
      SELECT id, title, body, visibility, created_at, updated_at
      FROM entries
      WHERE account_id = ${account.id}::uuid AND visibility = ${visibility}
      ORDER BY updated_at DESC
      LIMIT 200
    `) as Entry[];
  } else {
    rows = (await sql`
      SELECT id, title, body, visibility, created_at, updated_at
      FROM entries
      WHERE account_id = ${account.id}::uuid
      ORDER BY updated_at DESC
      LIMIT 200
    `) as Entry[];
  }

  await refreshSession(account.id);
  return ok({ entries: rows });
}

// -------- POST /api/entries — create a new entry -----------
export async function POST(req: NextRequest) {
  const account = await getCurrentAccount();
  if (!account) return err("Not authenticated", 401);

  let body: { title?: string; body?: string };
  try {
    body = await req.json();
  } catch {
    return err("Invalid request body.", 400);
  }

  const title = (body.title || "").trim().slice(0, 500);
  const text = (body.body || "").slice(0, 100_000); // 100KB cap per entry

  const rows = (await sql`
    INSERT INTO entries (account_id, title, body)
    VALUES (${account.id}::uuid, ${title}, ${text})
    RETURNING id, title, body, visibility, created_at, updated_at
  `) as Entry[];

  await refreshSession(account.id);
  return ok({ entry: rows[0] }, 201);
}
