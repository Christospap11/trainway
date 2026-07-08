import { headers } from "next/headers";

/**
 * Lightweight in-memory sliding-window rate limiter for auth-style endpoints.
 *
 * NOTE: in-memory means it's per-instance — good enough for a single server or
 * dev, but a multi-instance/serverless production deploy needs a shared store
 * (e.g. Upstash Redis / @upstash/ratelimit). Swap `hit()` for that when scaling.
 */
const buckets = new Map<string, number[]>();

export function hit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return false; // limited
  }
  recent.push(now);
  buckets.set(key, recent);
  return true; // allowed
}

/** Best-effort client IP from proxy headers (falls back to a shared bucket). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}
