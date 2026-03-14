/**
 * URL Cache Unit Tests
 * Tests getCachedAnalysisByUrl and normalizeUrlForCache behavior
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  storeAnalysis,
  getCachedAnalysisByUrl,
} from '../lib/analyzer';
import { _testing } from '../lib/persistence';
import type { AnalyzeResponse } from '../lib/types';

function makeMockResponse(id: string, url: string): AnalyzeResponse {
  return {
    id,
    url,
    status: 'completed',
    result: {
      company_understanding: {
        summary: 'Test company',
        industry: 'SaaS',
        business_model: 'B2B',
        brand_tone: {
          sentence_endings: [],
          uses_questions: false,
          tone_keywords: [],
          example_phrases: [],
        },
        key_vocabulary: [],
        credentials: [],
        site_cta_structure: '',
      },
      page_reading: {
        page_type: 'LP',
        fv_main_copy: 'Test',
        fv_sub_copy: '',
        cta_map: [],
        trust_elements: '',
        content_structure: '',
        confidence: 'high',
        screenshot_insights: '',
        dom_insights: '',
      },
      improvement_potential: '+10%',
      issues: [],
      metadata: {
        analyzed_at: new Date().toISOString(),
        analysis_duration_ms: 3000,
        model_used: 'claude-sonnet-4-5-20250514',
        vision_used: false,
        dom_extracted: true,
      },
    },
    created_at: new Date().toISOString(),
  };
}

describe('URL Cache', () => {
  beforeEach(() => {
    _testing.clearAll();
  });

  it('returns cached analysis for same URL', async () => {
    const url = 'https://cache-test-' + Date.now() + '.com/page';
    const mock = makeMockResponse('cache-hit-1', url);
    await storeAnalysis(mock);

    const cached = await getCachedAnalysisByUrl(url);
    expect(cached).toBeDefined();
    expect(cached?.id).toBe('cache-hit-1');
  });

  it('returns undefined for uncached URL', async () => {
    const result = await getCachedAnalysisByUrl('https://never-cached-' + Date.now() + '.com');
    expect(result).toBeUndefined();
  });

  it('normalizes URLs with trailing slash', async () => {
    const url = 'https://trailing-' + Date.now() + '.com/path';
    const mock = makeMockResponse('trailing-1', url);
    await storeAnalysis(mock);

    // Should match with trailing slash
    const cached = await getCachedAnalysisByUrl(url + '/');
    expect(cached).toBeDefined();
    expect(cached?.id).toBe('trailing-1');
  });

  it('normalizes URLs with different query param order', async () => {
    const base = 'https://params-' + Date.now() + '.com/page';
    const url1 = base + '?a=1&b=2';
    const mock = makeMockResponse('params-1', url1);
    await storeAnalysis(mock);

    // Same params in different order should match
    const cached = await getCachedAnalysisByUrl(base + '?b=2&a=1');
    expect(cached).toBeDefined();
    expect(cached?.id).toBe('params-1');
  });

  it('normalizes URLs by stripping fragment', async () => {
    const url = 'https://fragment-' + Date.now() + '.com/page';
    const mock = makeMockResponse('fragment-1', url);
    await storeAnalysis(mock);

    // URL with fragment should match
    const cached = await getCachedAnalysisByUrl(url + '#section1');
    expect(cached).toBeDefined();
    expect(cached?.id).toBe('fragment-1');
  });

  it('does not cache error status analyses', async () => {
    const url = 'https://error-' + Date.now() + '.com';
    const mock: AnalyzeResponse = {
      id: 'error-no-cache',
      url,
      status: 'error',
      error: 'Something failed',
      created_at: new Date().toISOString(),
    };
    await storeAnalysis(mock);

    const cached = await getCachedAnalysisByUrl(url);
    expect(cached).toBeUndefined();
  });

  it('root URL with trailing slash is preserved', async () => {
    // Root paths should keep their trailing slash
    const url = 'https://root-' + Date.now() + '.com/';
    const mock = makeMockResponse('root-1', url);
    await storeAnalysis(mock);

    const cached = await getCachedAnalysisByUrl(url);
    expect(cached).toBeDefined();
  });
});
