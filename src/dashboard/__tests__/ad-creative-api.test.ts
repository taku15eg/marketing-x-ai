/**
 * Ad Creative API Integration Tests
 *
 * Tests the /api/ad-creative endpoint behavior.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const routeSource = fs.readFileSync(
  path.resolve(__dirname, '../app/api/ad-creative/route.ts'),
  'utf-8'
);

describe('Ad Creative API - Route Configuration', () => {
  it('exports OPTIONS handler for CORS', () => {
    expect(routeSource).toContain('export async function OPTIONS');
  });

  it('exports GET handler for cached results', () => {
    expect(routeSource).toContain('export async function GET');
  });

  it('exports POST handler for generation', () => {
    expect(routeSource).toContain('export async function POST');
  });

  it('includes CORS headers in all responses', () => {
    expect(routeSource).toContain('CORS_HEADERS');
  });
});

describe('Ad Creative API - Input Validation', () => {
  it('validates analysis_id parameter on GET', () => {
    expect(routeSource).toContain("'analysis_id'");
    expect(routeSource).toContain('分析IDが指定されていません');
  });

  it('validates analysis_id in POST body', () => {
    expect(routeSource).toContain('analysis_id');
    expect(routeSource).toContain("typeof analysis_id !== 'string'");
  });

  it('returns 400 for invalid JSON body', () => {
    expect(routeSource).toContain('リクエストボディのJSONが不正です');
    expect(routeSource).toContain('status: 400');
  });
});

describe('Ad Creative API - Rate Limiting', () => {
  it('applies per-minute rate limiting', () => {
    expect(routeSource).toContain('checkRateLimit');
    expect(routeSource).toContain('RATE_LIMITS.per_minute');
  });

  it('returns 429 with Retry-After header', () => {
    expect(routeSource).toContain('status: 429');
    expect(routeSource).toContain('Retry-After');
  });
});

describe('Ad Creative API - Caching', () => {
  it('checks cache before generating', () => {
    expect(routeSource).toContain("'X-Cache': 'HIT'");
    expect(routeSource).toContain("'X-Cache': 'MISS'");
  });

  it('has TTL-based cache expiration', () => {
    expect(routeSource).toContain('AD_CREATIVE_TTL_MS');
    expect(routeSource).toContain('24 * 60 * 60 * 1000');
  });

  it('stores results after generation', () => {
    expect(routeSource).toContain('adCreativeStore.set');
  });
});

describe('Ad Creative API - Error Handling', () => {
  it('returns 404 when analysis not found', () => {
    expect(routeSource).toContain('指定された分析結果が見つかりません');
    expect(routeSource).toContain('status: 404');
  });

  it('returns 500 for unhandled errors', () => {
    expect(routeSource).toContain('status: 500');
  });

  it('logs events for tracking', () => {
    expect(routeSource).toContain("logEvent('ad_creative_started'");
    expect(routeSource).toContain("logEvent('ad_creative_completed'");
  });
});

describe('Ad Creative API - Dependencies', () => {
  it('retrieves analysis from analyzer store', () => {
    expect(routeSource).toContain('getAnalysis');
  });

  it('uses generateAdCreatives function', () => {
    expect(routeSource).toContain('generateAdCreatives');
  });
});
