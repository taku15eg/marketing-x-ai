/**
 * Rate Limiter Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { checkRateLimit, checkRateLimitAsync, getClientIP, RATE_LIMITS } from '../lib/rate-limiter';

describe('Rate Limiter', () => {
  describe('checkRateLimit (synchronous / in-memory)', () => {
    it('allows first request within window', () => {
      const result = checkRateLimit('test-first-' + Date.now(), {
        max_requests: 5,
        window_ms: 60000,
      });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('tracks remaining count correctly', () => {
      const key = 'test-track-' + Date.now();
      const config = { max_requests: 3, window_ms: 60000 };

      const r1 = checkRateLimit(key, config);
      expect(r1.remaining).toBe(2);

      const r2 = checkRateLimit(key, config);
      expect(r2.remaining).toBe(1);

      const r3 = checkRateLimit(key, config);
      expect(r3.remaining).toBe(0);
    });

    it('blocks requests after limit is reached', () => {
      const key = 'test-block-' + Date.now();
      const config = { max_requests: 2, window_ms: 60000 };

      checkRateLimit(key, config);
      checkRateLimit(key, config);

      const result = checkRateLimit(key, config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('returns reset_at timestamp in the future', () => {
      const now = Date.now();
      const result = checkRateLimit('test-reset-' + now, {
        max_requests: 5,
        window_ms: 60000,
      });
      expect(result.reset_at).toBeGreaterThan(now);
    });

    it('resets after window expires', () => {
      const key = 'test-expire-' + Date.now();
      const config = { max_requests: 1, window_ms: 1 }; // 1ms window

      checkRateLimit(key, config);

      // Wait for window to expire
      const start = Date.now();
      while (Date.now() - start < 5) { /* busy wait */ }

      const result = checkRateLimit(key, config);
      expect(result.allowed).toBe(true);
    });

    it('isolates different keys', () => {
      const ts = Date.now();
      const config = { max_requests: 1, window_ms: 60000 };

      checkRateLimit(`key-a-${ts}`, config);
      const result = checkRateLimit(`key-b-${ts}`, config);
      expect(result.allowed).toBe(true);
    });
  });

  describe('checkRateLimitAsync (falls back to in-memory without Redis)', () => {
    it('allows first request', async () => {
      const result = await checkRateLimitAsync('async-first-' + Date.now(), {
        max_requests: 5,
        window_ms: 60000,
      });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('blocks after limit reached', async () => {
      const key = 'async-block-' + Date.now();
      const config = { max_requests: 2, window_ms: 60000 };

      await checkRateLimitAsync(key, config);
      await checkRateLimitAsync(key, config);

      const result = await checkRateLimitAsync(key, config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('returns same interface as sync version', async () => {
      const result = await checkRateLimitAsync('async-interface-' + Date.now(), {
        max_requests: 10,
        window_ms: 60000,
      });
      expect(result).toHaveProperty('allowed');
      expect(result).toHaveProperty('remaining');
      expect(result).toHaveProperty('reset_at');
      expect(typeof result.allowed).toBe('boolean');
      expect(typeof result.remaining).toBe('number');
      expect(typeof result.reset_at).toBe('number');
    });
  });

  describe('RATE_LIMITS constants', () => {
    it('free_monthly allows 5 requests', () => {
      expect(RATE_LIMITS.free_monthly.max_requests).toBe(5);
    });

    it('per_minute allows 10 requests', () => {
      expect(RATE_LIMITS.per_minute.max_requests).toBe(10);
    });

    it('free_monthly window is ~30 days', () => {
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      expect(RATE_LIMITS.free_monthly.window_ms).toBe(thirtyDaysMs);
    });

    it('per_minute window is 60 seconds', () => {
      expect(RATE_LIMITS.per_minute.window_ms).toBe(60000);
    });
  });

  describe('getClientIP', () => {
    it('extracts IP from x-forwarded-for header', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '203.0.113.50, 70.41.3.18, 150.172.238.178' },
      });
      expect(getClientIP(req)).toBe('203.0.113.50');
    });

    it('extracts IP from x-real-ip header', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-real-ip': '203.0.113.50' },
      });
      expect(getClientIP(req)).toBe('203.0.113.50');
    });

    it('prefers x-forwarded-for over x-real-ip', () => {
      const req = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '1.2.3.4',
          'x-real-ip': '5.6.7.8',
        },
      });
      expect(getClientIP(req)).toBe('1.2.3.4');
    });

    it('returns "unknown" when no IP headers present', () => {
      const req = new Request('http://localhost');
      expect(getClientIP(req)).toBe('unknown');
    });
  });
});
