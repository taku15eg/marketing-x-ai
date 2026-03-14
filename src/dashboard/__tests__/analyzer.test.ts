/**
 * Analyzer (Pipeline Orchestrator) Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  storeAnalysis,
  getAnalysis,
  createShareId,
  getShareAnalysis,
} from '../lib/analyzer';
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
        model_used: 'claude-sonnet-4-6',
        vision_used: false,
        vision_status: 'failed',
        dom_extracted: true,
      },
    },
    created_at: new Date().toISOString(),
  };
}

describe('Analysis Store', () => {
  it('stores and retrieves analysis by ID', () => {
    const mock = makeMockResponse('test-store-1');
    storeAnalysis(mock);
    const retrieved = getAnalysis('test-store-1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.url).toBe('https://example.com');
    expect(retrieved?.status).toBe('completed');
  });

  it('returns undefined for non-existent ID', () => {
    const result = getAnalysis('non-existent-id-' + Date.now());
    expect(result).toBeUndefined();
  });

  it('overwrites analysis with same ID', () => {
    const mock1 = makeMockResponse('test-overwrite');
    mock1.url = 'https://first.com';
    storeAnalysis(mock1);

    const mock2 = makeMockResponse('test-overwrite');
    mock2.url = 'https://second.com';
    storeAnalysis(mock2);

    const retrieved = getAnalysis('test-overwrite');
    expect(retrieved?.url).toBe('https://second.com');
  });
});

describe('Share Store', () => {
  it('creates share ID and retrieves linked analysis', () => {
    const mock = makeMockResponse('test-share-1');
    storeAnalysis(mock);

    const shareId = createShareId('test-share-1');
    expect(shareId).toBeDefined();
    expect(shareId.length).toBeGreaterThanOrEqual(21);

    const shared = getShareAnalysis(shareId);
    expect(shared).toBeDefined();
    expect(shared?.id).toBe('test-share-1');
  });

  it('share IDs are unique for same analysis', () => {
    const mock = makeMockResponse('test-share-unique');
    storeAnalysis(mock);

    const id1 = createShareId('test-share-unique');
    const id2 = createShareId('test-share-unique');
    expect(id1).not.toBe(id2);
  });

  it('returns undefined for non-existent share ID', () => {
    const result = getShareAnalysis('non-existent-share-' + Date.now());
    expect(result).toBeUndefined();
  });

  it('returns undefined if linked analysis is missing', () => {
    const shareId = createShareId('missing-analysis-' + Date.now());
    const result = getShareAnalysis(shareId);
    expect(result).toBeUndefined();
  });
});
