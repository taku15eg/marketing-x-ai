// Simple in-memory rate limiter
// Production should use Redis/Cloudflare KV

interface RateLimitEntry {
  count: number;
  reset_at: number;
}

const store = new Map<string, RateLimitEntry>();

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

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.reset_at) {
    store.set(key, { count: 1, reset_at: now + config.window_ms });
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

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}
