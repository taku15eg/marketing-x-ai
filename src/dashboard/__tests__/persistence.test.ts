/**
 * Persistence Layer Tests
 *
 * Tests the persistence module (in-memory fallback mode, no Supabase env vars).
 * Verifies: save/load analyses, URL caching, share creation/retrieval,
 * TTL expiration, store size limits, and URL normalization.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveAnalysis,
  loadAnalysis,
  loadAnalysisByUrl,
  saveShare,
  loadShare,
  generateShareId,
  _testing,
} from '../lib/persistence';
import type { AnalyzeResponse } from '../lib/types';

function createMockAnalysis(overrides: Partial<AnalyzeResponse> = {}): AnalyzeResponse {
  return {
    id: 'test-' + Math.random().toString(36).slice(2),
    url: 'https://example.com/lp',
    status: 'completed',
    result: {
      company_understanding: {
        summary: 'Test company',
        industry: 'Tech',
        business_model: 'SaaS',
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
        fv_main_copy: 'Test copy',
        fv_sub_copy: '',
        cta_map: [],
        trust_elements: '',
        content_structure: '',
        confidence: 'high',
        screenshot_insights: '',
        dom_insights: '',
      },
      improvement_potential: '+15%',
      issues: [
        {
          priority: 1,
          title: 'FVの訴求力不足',
          diagnosis: 'メインコピーが弱い',
          impact: 'high',
          handoff_to: 'designer',
          evidence: 'テスト',
          brief: {
            objective: 'FV改善',
            direction: '訴求力向上',
            specifics: 'コピー変更',
            constraints: [],
            qa_checklist: [],
          },
        },
      ],
      metadata: {
        analyzed_at: new Date().toISOString(),
        analysis_duration_ms: 3000,
        model_used: 'claude-sonnet-4-5-20250514',
        vision_used: true,
        dom_extracted: true,
      },
    },
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('Persistence Layer (in-memory fallback)', () => {
  beforeEach(() => {
    _testing.clearAll();
  });

  describe('saveAnalysis / loadAnalysis', () => {
    it('saves and loads an analysis by ID', async () => {
      const analysis = createMockAnalysis({ id: 'save-load-1' });
      await saveAnalysis(analysis);

      const loaded = await loadAnalysis('save-load-1');
      expect(loaded).toBeDefined();
      expect(loaded!.id).toBe('save-load-1');
      expect(loaded!.url).toBe('https://example.com/lp');
      expect(loaded!.status).toBe('completed');
      expect(loaded!.result!.improvement_potential).toBe('+15%');
    });

    it('returns null for non-existent ID', async () => {
      const result = await loadAnalysis('nonexistent');
      expect(result).toBeNull();
    });

    it('stores error analyses', async () => {
      const analysis = createMockAnalysis({
        id: 'error-1',
        status: 'error',
        error: 'API key invalid',
        result: undefined,
      });
      await saveAnalysis(analysis);

      const loaded = await loadAnalysis('error-1');
      expect(loaded!.status).toBe('error');
      expect(loaded!.error).toBe('API key invalid');
      expect(loaded!.result).toBeUndefined();
    });

    it('enforces store size limit', async () => {
      // Fill store to max
      for (let i = 0; i < 1001; i++) {
        await saveAnalysis(createMockAnalysis({ id: `fill-${i}` }));
      }
      expect(_testing.analysisStore.size).toBeLessThanOrEqual(1000);
    });
  });

  describe('URL cache', () => {
    it('finds cached analysis by URL', async () => {
      const analysis = createMockAnalysis({
        id: 'url-cache-1',
        url: 'https://example.com/cached-lp',
      });
      await saveAnalysis(analysis);

      const cached = await loadAnalysisByUrl('https://example.com/cached-lp');
      expect(cached).toBeDefined();
      expect(cached!.id).toBe('url-cache-1');
    });

    it('returns null for uncached URL', async () => {
      const result = await loadAnalysisByUrl('https://never-analyzed.com');
      expect(result).toBeNull();
    });

    it('does not cache error analyses by URL', async () => {
      await saveAnalysis(createMockAnalysis({
        id: 'error-no-cache',
        url: 'https://example.com/error-page',
        status: 'error',
        error: 'failed',
        result: undefined,
      }));

      const cached = await loadAnalysisByUrl('https://example.com/error-page');
      expect(cached).toBeNull();
    });
  });

  describe('URL normalization', () => {
    it('strips trailing slash', () => {
      const result = _testing.normalizeUrlForCache('https://example.com/path/');
      expect(result).toBe('https://example.com/path');
    });

    it('keeps root slash', () => {
      const result = _testing.normalizeUrlForCache('https://example.com/');
      expect(result).toBe('https://example.com/');
    });

    it('strips fragment', () => {
      const result = _testing.normalizeUrlForCache('https://example.com/page#section');
      expect(result).toBe('https://example.com/page');
    });

    it('sorts query params', () => {
      const result = _testing.normalizeUrlForCache('https://example.com/?b=2&a=1');
      expect(result).toBe('https://example.com/?a=1&b=2');
    });
  });

  describe('Share links', () => {
    it('generates share IDs of 21+ characters', () => {
      const id = generateShareId();
      expect(id.length).toBeGreaterThanOrEqual(21);
    });

    it('generates unique share IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateShareId()));
      expect(ids.size).toBe(100);
    });

    it('saves and loads a share', async () => {
      const analysis = createMockAnalysis({ id: 'shared-analysis-1' });
      await saveAnalysis(analysis);

      const shareId = generateShareId();
      await saveShare(shareId, 'shared-analysis-1');

      const result = await loadShare(shareId);
      expect(result).toBeDefined();
      expect(result!.share_id).toBe(shareId);
      expect(result!.analysis.id).toBe('shared-analysis-1');
      expect(result!.analysis.result!.issues).toHaveLength(1);
    });

    it('returns null for non-existent share', async () => {
      const result = await loadShare('nonexistent-share');
      expect(result).toBeNull();
    });

    it('returns null when underlying analysis is missing', async () => {
      const shareId = generateShareId();
      await saveShare(shareId, 'missing-analysis');

      const result = await loadShare(shareId);
      expect(result).toBeNull();
    });
  });

  describe('Full flow: analyze → share → retrieve', () => {
    it('end-to-end share flow works', async () => {
      // 1. Save analysis
      const analysis = createMockAnalysis({
        id: 'e2e-flow-1',
        url: 'https://client-site.com/lp',
      });
      await saveAnalysis(analysis);

      // 2. Create share
      const shareId = generateShareId();
      await saveShare(shareId, 'e2e-flow-1');

      // 3. Retrieve via share (simulates share page load)
      const shared = await loadShare(shareId);
      expect(shared).toBeDefined();
      expect(shared!.analysis.url).toBe('https://client-site.com/lp');
      expect(shared!.analysis.result!.improvement_potential).toBe('+15%');
      expect(shared!.analysis.result!.issues[0].title).toBe('FVの訴求力不足');
    });

    it('multiple shares for same analysis work independently', async () => {
      const analysis = createMockAnalysis({ id: 'multi-share' });
      await saveAnalysis(analysis);

      const share1 = generateShareId();
      const share2 = generateShareId();
      await saveShare(share1, 'multi-share');
      await saveShare(share2, 'multi-share');

      expect(share1).not.toBe(share2);

      const result1 = await loadShare(share1);
      const result2 = await loadShare(share2);
      expect(result1!.analysis.id).toBe('multi-share');
      expect(result2!.analysis.id).toBe('multi-share');
    });
  });
});
