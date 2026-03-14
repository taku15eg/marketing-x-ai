/**
 * Analyzer (Pipeline Orchestrator) Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  storeAnalysis,
  getAnalysis,
  createShareId,
  getShareAnalysis,
} from '../lib/analyzer';
import { _testing } from '../lib/persistence';
import type { AnalyzeResponse } from '../lib/types';

function makeMockResponse(id: string): AnalyzeResponse {
  return {
    id,
    url: 'https://example.com',
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
          title: 'Test issue',
          diagnosis: 'Test diagnosis',
          impact: 'high',
          handoff_to: 'designer',
          brief: {
            objective: 'Improve CTA',
            direction: 'Make it more prominent',
            specifics: 'Increase button size',
            constraints: [],
            qa_checklist: [],
          },
          evidence: 'DOM analysis',
        },
      ],
      metadata: {
        analyzed_at: new Date().toISOString(),
        analysis_duration_ms: 5000,
        model_used: 'claude-sonnet-4-5-20250514',
        vision_used: false,
        dom_extracted: true,
      },
    },
    created_at: new Date().toISOString(),
  };
}

describe('Analysis Store', () => {
  beforeEach(() => {
    _testing.clearAll();
  });

  it('stores and retrieves analysis by ID', async () => {
    const mock = makeMockResponse('test-store-1');
    await storeAnalysis(mock);
    const retrieved = await getAnalysis('test-store-1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.url).toBe('https://example.com');
    expect(retrieved?.status).toBe('completed');
  });

  it('returns undefined for non-existent ID', async () => {
    const result = await getAnalysis('non-existent-id-' + Date.now());
    expect(result).toBeUndefined();
  });

  it('overwrites analysis with same ID', async () => {
    const mock1 = makeMockResponse('test-overwrite');
    mock1.url = 'https://first.com';
    await storeAnalysis(mock1);

    const mock2 = makeMockResponse('test-overwrite');
    mock2.url = 'https://second.com';
    await storeAnalysis(mock2);

    const retrieved = await getAnalysis('test-overwrite');
    expect(retrieved?.url).toBe('https://second.com');
  });
});

describe('Share Store', () => {
  beforeEach(() => {
    _testing.clearAll();
  });

  it('creates share ID and retrieves linked analysis', async () => {
    const mock = makeMockResponse('test-share-1');
    await storeAnalysis(mock);

    const shareId = await createShareId('test-share-1');
    expect(shareId).toBeDefined();
    expect(shareId.length).toBeGreaterThanOrEqual(21);

    const shared = await getShareAnalysis(shareId);
    expect(shared).toBeDefined();
    expect(shared?.id).toBe('test-share-1');
  });

  it('share IDs are unique for same analysis', async () => {
    const mock = makeMockResponse('test-share-unique');
    await storeAnalysis(mock);

    const id1 = await createShareId('test-share-unique');
    const id2 = await createShareId('test-share-unique');
    expect(id1).not.toBe(id2);
  });

  it('returns undefined for non-existent share ID', async () => {
    const result = await getShareAnalysis('non-existent-share-' + Date.now());
    expect(result).toBeUndefined();
  });

  it('returns undefined if linked analysis is missing', async () => {
    const shareId = await createShareId('missing-analysis-' + Date.now());
    const result = await getShareAnalysis(shareId);
    expect(result).toBeUndefined();
  });
});
