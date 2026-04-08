/**
 * Rate limiting utility.
 *
 * Uses Upstash Redis in production (set UPSTASH_REDIS_REST_URL + TOKEN).
 * Falls back to in-memory for development (not suitable for multi-instance prod).
 *
 * Usage in API routes / Server Actions:
 *   const result = await rateLimit("login", ip, { max: 5, windowSecs: 60 });
 *   if (!result.success) return { error: "Too many attempts" };
 */

interface RateLimitOptions {
  max: number;
  windowSecs: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp
}

// =============================================================================
// In-memory fallback (development / single-instance only)
// =============================================================================

const memoryStore = new Map<string, { count: number; resetAt: number }>();

function memoryRateLimit(
  key: string,
  { max, windowSecs }: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const existing = memoryStore.get(key);

  if (!existing || existing.resetAt < now) {
    const resetAt = now + windowSecs * 1000;
    memoryStore.set(key, { count: 1, resetAt });
    return { success: true, remaining: max - 1, resetAt };
  }

  existing.count += 1;
  const remaining = Math.max(0, max - existing.count);
  return {
    success: existing.count <= max,
    remaining,
    resetAt: existing.resetAt,
  };
}

// =============================================================================
// Upstash Redis rate limiter
// =============================================================================

async function upstashRateLimit(
  key: string,
  { max, windowSecs }: RateLimitOptions
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;

  const pipeline = [
    ["INCR", key],
    ["EXPIRE", key, windowSecs.toString()],
  ];

  const response = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pipeline),
    cache: "no-store",
  });

  if (!response.ok) {
    // If Redis is down, fail open (allow request)
    console.error("[RateLimit] Upstash Redis request failed, failing open");
    return { success: true, remaining: max, resetAt: Date.now() + windowSecs * 1000 };
  }

  const results = (await response.json()) as [{ result: number }, { result: number }];
  const count = results[0].result;
  const remaining = Math.max(0, max - count);

  return {
    success: count <= max,
    remaining,
    resetAt: Date.now() + windowSecs * 1000,
  };
}

// =============================================================================
// Public API
// =============================================================================

const useUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

export async function rateLimit(
  identifier: string, // e.g. "login", "register", "contact"
  key: string,        // e.g. IP address or user ID
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const fullKey = `nexcart:rl:${identifier}:${key}`;

  if (useUpstash) {
    return upstashRateLimit(fullKey, options);
  }

  return memoryRateLimit(fullKey, options);
}

// Preset limits for common routes
export const RATE_LIMITS = {
  login: { max: 5, windowSecs: 60 },
  register: { max: 3, windowSecs: 300 },
  forgotPassword: { max: 3, windowSecs: 300 },
  passwordReset: { max: 5, windowSecs: 300 },
  contact: { max: 3, windowSecs: 300 },
  search: { max: 30, windowSecs: 60 },
  adminAction: { max: 60, windowSecs: 60 },
  upload: { max: 10, windowSecs: 60 },
} as const;
