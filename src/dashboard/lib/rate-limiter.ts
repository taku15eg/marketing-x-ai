// Rate limiter with Upstash Redis backend
// Falls back to in-memory store when UPSTASH_REDIS_REST_URL is not configured

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// === Types ===

export interface RateLimitConfig {
  max_requests: number;
  window_ms: number;
}

export const RATE_LIMITS = {
  free_monthly: { max_requests: 5, window_ms: 30 * 24 * 60 * 60 * 1000 },
  starter_monthly: { max_requests: 30, window_ms: 30 * 24 * 60 * 60 * 1000 },
  pro_monthly: { max_requests: 200, window_ms: 30 * 24 * 60 * 60 * 1000 },
  business_monthly: { max_requests: 500, window_ms: 30 * 24 * 60 * 60 * 1000 },
  per_minute: { max_requests: 10, window_ms: 60 * 1000 },
} as const;

export type PlanType = 'free' | 'starter' | 'pro' | 'business';

export function getRateLimitForPlan(plan: PlanType): RateLimitConfig {
  switch (plan) {
    case 'starter': return RATE_LIMITS.starter_monthly;
    case 'pro': return RATE_LIMITS.pro_monthly;
    case 'business': return RATE_LIMITS.business_monthly;
    default: return RATE_LIMITS.free_monthly;
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset_at: number;
}

// === Redis detection ===

function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

// === Upstash Redis rate limiters (lazy-initialized) ===

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

// Cache Ratelimit instances by config key to avoid re-creating them
const ratelimiterCache = new Map<string, Ratelimit>();

function getUpstashRatelimiter(config: RateLimitConfig): Ratelimit {
  const cacheKey = `${config.max_requests}:${config.window_ms}`;
  let limiter = ratelimiterCache.get(cacheKey);
  if (!limiter) {
    // Convert window_ms to the appropriate Upstash duration string
    const windowSeconds = Math.ceil(config.window_ms / 1000);
    limiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(config.max_requests, `${windowSeconds} s`),
      prefix: 'pg:ratelimit',
    });
    ratelimiterCache.set(cacheKey, limiter);
  }
  return limiter;
}

// === In-memory fallback (development/test) ===

interface RateLimitEntry {
  count: number;
  reset_at: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

function checkRateLimitMemory(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now >= entry.reset_at) {
    memoryStore.set(key, { count: 1, reset_at: now + config.window_ms });
    return {
      allowed: true,
      remaining: config.max_requests - 1,
      reset_at: now + config.window_ms,
    };
  }

  if (entry.count >= config.max_requests) {
    return {
      allowed: false,
      remaining: 0,
      reset_at: entry.reset_at,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.max_requests - entry.count,
    reset_at: entry.reset_at,
  };
}

// === Public API (same interface as before) ===

export async function checkRateLimitAsync(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (!isRedisConfigured()) {
    return checkRateLimitMemory(key, config);
  }

  const limiter = getUpstashRatelimiter(config);
  const result = await limiter.limit(key);

  return {
    allowed: result.success,
    remaining: result.remaining,
    reset_at: result.reset,
  };
}

/**
 * Synchronous rate limit check (in-memory only).
 * Kept for backward compatibility with existing code.
 * In production with Redis, use checkRateLimitAsync instead.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  return checkRateLimitMemory(key, config);
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}
