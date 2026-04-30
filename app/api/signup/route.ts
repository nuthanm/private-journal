import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import {
  hashPhone,
  hashSecret,
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth";
import { rateLimit, clientKey } from "@/lib/ratelimit";
import { ok, err } from "@/lib/api";

export const dynamic = "force-dynamic";

// Block at the route level if signup is disabled
const SIGNUP_ENABLED = process.env.ALLOW_SIGNUP !== "false";

export async function POST(req: NextRequest) {
  if (!SIGNUP_ENABLED) {
    return err("Signups are currently closed.", 403);
  }

  // Rate limit: 3 signups per hour per IP
  const limit = rateLimit(clientKey(req, "signup"), 3, 3600);
  if (!limit.allowed) {
    return err("Too many signup attempts. Please try again later.", 429);
  }

  let body: { phone?: string; secret?: string };
  try {
    body = await req.json();
  } catch {
    return err("Invalid request body.", 400);
  }

  const { phone, secret } = body;
  if (!phone || !secret) {
    return err("Phone and secret are both required.", 400);
  }

  let phoneHash: string;
  let secretHash: string;
  try {
    phoneHash = hashPhone(phone);
    secretHash = await hashSecret(secret);
  } catch (e) {
    return err((e as Error).message, 400);
  }

  // Check for existing account
  const existing = (await sql`
    SELECT id FROM accounts WHERE phone_hash = ${phoneHash} LIMIT 1
  `) as { id: string }[];

  if (existing.length > 0) {
    // Don't reveal that the account exists; return generic conflict
    return err(
      "An account with this combination already exists. Try signing in instead.",
      409
    );
  }

  const result = (await sql`
    INSERT INTO accounts (phone_hash, secret_hash, last_signin_at)
    VALUES (${phoneHash}, ${secretHash}, now())
    RETURNING id
  `) as { id: string }[];

  const accountId = result[0].id;

  // Issue session immediately so the user lands on the dashboard
  const token = await createSessionToken(accountId);
  await setSessionCookie(token);

  return ok({ id: accountId }, 201);
}
