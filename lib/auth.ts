import argon2 from "argon2";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import { sql } from "./db";

const TEXT_ENCODER = new TextEncoder();
const SESSION_COOKIE = "session";

// Lazy environment access — read at first use, not at module load.
// This lets `next build` complete without env vars set.
function getJwtKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set. See .env.example.");
  return TEXT_ENCODER.encode(secret);
}

function getPhoneSalt(): string {
  const salt = process.env.PHONE_SALT;
  if (!salt) throw new Error("PHONE_SALT is not set. See .env.example.");
  return salt;
}

function getIdleMinutes(): number {
  return parseInt(process.env.IDLE_TIMEOUT_MINUTES || "20", 10);
}

function getIdleSeconds(): number {
  return getIdleMinutes() * 60;
}

// ----------------------------------------------------------------------------
// Phone hashing — deterministic so we can look up by phone, but salted so the
// raw phone number cannot be brute-forced from the database alone.
// ----------------------------------------------------------------------------
export function hashPhone(phone: string): string {
  const normalized = phone.replace(/\D/g, "");
  if (normalized.length < 7) {
    throw new Error("Phone must be at least 7 digits.");
  }
  // SHA-256 with salt — fast, deterministic, suitable for indexing
  return createHash("sha256")
    .update(`${getPhoneSalt()}:${normalized}`)
    .digest("hex");
}

// ----------------------------------------------------------------------------
// Secret hashing — Argon2id, slow on purpose, never reversible.
// ----------------------------------------------------------------------------
export async function hashSecret(secret: string): Promise<string> {
  const normalized = secret.toLowerCase().trim();
  if (normalized.length < 3) {
    throw new Error("Secret must be at least 3 characters.");
  }
  return argon2.hash(normalized, {
    type: argon2.argon2id,
    memoryCost: 19_456, // 19 MiB — OWASP recommended baseline
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifySecret(hash: string, secret: string): Promise<boolean> {
  const normalized = secret.toLowerCase().trim();
  try {
    return await argon2.verify(hash, normalized);
  } catch {
    return false;
  }
}

// ----------------------------------------------------------------------------
// Session JWT — short-lived, refreshed on every authenticated request.
// ----------------------------------------------------------------------------
export type SessionPayload = {
  sub: string; // account id
  iat: number;
  exp: number;
};

export async function createSessionToken(accountId: string): Promise<string> {
  return new SignJWT({ sub: accountId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${getIdleMinutes()}m`)
    .sign(getJwtKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtKey());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------------------
// Cookie helpers — HTTP-only, secure, SameSite=Strict.
// ----------------------------------------------------------------------------
export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: getIdleSeconds(),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

// ----------------------------------------------------------------------------
// getCurrentAccount — the single function every protected route calls.
// Returns null if the session is missing, expired, or invalid.
// ----------------------------------------------------------------------------
export type Account = {
  id: string;
  created_at: string;
  last_signin_at: string | null;
};

export async function getCurrentAccount(): Promise<Account | null> {
  const token = await getSessionCookie();
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload || !payload.sub) return null;

  // Server-side enforcement: also check that the account still exists.
  const rows = (await sql`
    SELECT id, created_at, last_signin_at
    FROM accounts
    WHERE id = ${payload.sub}::uuid
    LIMIT 1
  `) as Account[];

  if (rows.length === 0) return null;

  return rows[0];
}

// ----------------------------------------------------------------------------
// Refresh the session — bump expiry on every authenticated request.
// Called automatically by API routes after they verify the session.
// ----------------------------------------------------------------------------
export async function refreshSession(accountId: string): Promise<void> {
  const newToken = await createSessionToken(accountId);
  await setSessionCookie(newToken);
}

export function getIdleTimeoutSeconds(): number {
  return getIdleSeconds();
}
export function getIdleTimeoutMinutes(): number {
  return getIdleMinutes();
}
