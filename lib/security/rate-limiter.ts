interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic cleanup of stale records every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleRecords(now: number, windowMs: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of rateLimitStore.entries()) {
    record.timestamps = record.timestamps.filter((t) => now - t < windowMs);
    if (record.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Checks in-memory sliding window rate limit for an identifier (e.g. IP + endpoint).
 */
export function checkRateLimit(
  key: string,
  limit: number = 60,
  windowSeconds: number = 60
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  cleanupStaleRecords(now, windowMs);

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filter timestamps within current sliding window
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  const resetAt = record.timestamps.length > 0 ? record.timestamps[0] + windowMs : now + windowMs;

  if (record.timestamps.length >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt,
    };
  }

  record.timestamps.push(now);

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - record.timestamps.length),
    resetAt,
  };
}

/**
 * Extracts client IP safely from standard proxy headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "127.0.0.1";
}
