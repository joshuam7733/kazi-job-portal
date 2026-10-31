import { headers } from "next/headers";

/**
 * Fixed-window in-memory rate limiter. Suitable for a single Node instance; for multi-instance
 * deployments swap the store for Redis/Upstash (see DEPLOYMENT.md).
 */
type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSeconds: number };

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    if (store.size > 10_000) sweep(now);
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }
  bucket.count += 1;
  const ok = bucket.count <= limit;
  return {
    ok,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: ok ? 0 : Math.ceil((bucket.resetAt - now) / 1000),
  };
}

function sweep(now: number) {
  for (const [k, b] of store) if (b.resetAt <= now) store.delete(k);
}

export function resetRateLimits() {
  store.clear();
}

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

/** Convenience: rate-limit by action + client IP (+ optional user id). */
export async function limitAction(action: string, limit: number, windowMs: number, userId?: string) {
  const ip = await clientIp();
  return rateLimit(`${action}:${userId ?? ip}`, limit, windowMs);
}
