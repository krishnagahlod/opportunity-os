import "server-only";
import { type NextRequest } from "next/server";

interface RateLimitRecord {
  timestamps: number[];
}

// Global in-memory storage for sliding window rate limiting
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale keys every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      const activeTimestamps = record.timestamps.filter((ts) => now - ts < 3600_000);
      if (activeTimestamps.length === 0) {
        rateLimitStore.delete(key);
      } else {
        record.timestamps = activeTimestamps;
      }
    }
  }, 300_000).unref?.();
}

/**
 * Extracts a client IP from NextRequest or Headers.
 */
export function getClientIp(req: NextRequest | Headers): string {
  const headers = req instanceof Headers ? req : req.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

/**
 * Sliding window rate limit check.
 * @param key Unique identifier (e.g., `login:${ip}` or `ai:${userId}`)
 * @param limit Maximum allowed requests within the window
 * @param windowMs Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Retain only timestamps within the sliding window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= limit) {
    const oldestTimestamp = record.timestamps[0];
    const resetMs = oldestTimestamp + windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(resetMs, 0),
    };
  }

  // Record this hit
  record.timestamps.push(now);

  return {
    allowed: true,
    remaining: limit - record.timestamps.length,
    resetMs: windowMs,
  };
}
