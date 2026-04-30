import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import {
  hashPhone,
  verifySecret,
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth";
import { rateLimit, clientKey } from "@/lib/ratelimit";
import { ok, err, SIGNIN_ERROR } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Rate limit: 5 attempts per 15 minutes per IP
  const limit = rateLimit(clientKey(req, "signin"), 5, 900);
  if (!limit.allowed) {
    return err(
      `Too many sign-in attempts. Please wait ${Math.ceil(limit.resetInSeconds / 60)} minute(s) and try again.`,
      429
    );
  }

  let body: { phone?: string; secret?: string };
  try {
    body = await req.json();
  } catch {
    return err("Invalid request body.", 400);
  }

  const { phone, secret } = body;
  if (!phone || !secret) {
    return err(SIGNIN_ERROR, 401);
  }

  let phoneHash: string;
  try {
    phoneHash = hashPhone(phone);
  } catch {
    // Bad phone format -> generic error
    return err(SIGNIN_ERROR, 401);
  }

  const rows = (await sql`
    SELECT id, secret_hash
    FROM accounts
    WHERE phone_hash = ${phoneHash}
    LIMIT 1
  `) as { id: string; secret_hash: string }[];

  if (rows.length === 0) {
    // Same generic error — don't leak whether the phone exists
    return err(SIGNIN_ERROR, 401);
  }

  const account = rows[0];
  const ok_secret = await verifySecret(account.secret_hash, secret);
  if (!ok_secret) {
    return err(SIGNIN_ERROR, 401);
  }

  // Update last_signin_at (fire and forget)
  await sql`
    UPDATE accounts SET last_signin_at = now() WHERE id = ${account.id}::uuid
  `;

  // Issue session
  const token = await createSessionToken(account.id);
  await setSessionCookie(token);

  return ok({ ok: true });
}
