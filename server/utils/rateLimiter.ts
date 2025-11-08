/**
 * In-memory sliding window rate limiter.
 * - Not for production scale (process memory only), fine for local/dev.
 */
const buckets = new Map<string, number[]>();

export interface LimitResult {
  ok: boolean;
  retryAfterSec?: number;
}

export function checkLimit(
  key: string,
  max: number,
  windowMs: number
): LimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;
  const arr = buckets.get(key) ?? [];
  const recent = arr.filter((t) => t > windowStart);
  if (recent.length >= max) {
    const earliest = Math.min(...recent);
    const retryAfterSec = Math.ceil((earliest + windowMs - now) / 1000);
    buckets.set(key, recent);
    return { ok: false, retryAfterSec: Math.max(retryAfterSec, 1) };
  }
  recent.push(now);
  buckets.set(key, recent);
  return { ok: true };
}
