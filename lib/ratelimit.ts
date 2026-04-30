// Lightweight in-memory rate limiter.
//
// For a personal-scale app on one Vercel region, this is sufficient. For
// multi-region or higher-scale deployments, swap in a Redis-backed limiter
// (Upstash, Vercel KV) — the interface is the same.

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

// Periodic cleanup so the map doesn't grow forever in a long-lived runtime.
let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [k, v] of buckets) {
    if (v.resetAt < now) buckets.delete(k);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
};

/**
 * Returns whether the action is allowed under the given key and policy.
 * Default: 5 attempts per 15-minute window. Suitable for sign-in.
 */
export function rateLimit(
  key: string,
  limit = 5,
  windowSeconds = 900
): RateLimitResult {
  maybeCleanup();
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: limit - 1, resetInSeconds: windowSeconds };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: limit - bucket.count,
    resetInSeconds: Math.ceil((bucket.resetAt - now) / 1000),
  };
}

export function clientKey(req: Request, suffix?: string): string {
  // x-forwarded-for is set by Vercel; falls back to a generic key in dev.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return suffix ? `${ip}:${suffix}` : ip;
}
