/**
 * Analyzer (Pipeline Orchestrator) Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  storeAnalysis,
  getAnalysis,
  createShareId,
  getShareAnalysis,
  stripInternalMetadata,
  getShareAnalysisPublic,
} from '../lib/analyzer';
import type { AnalyzeResponse } from '../lib/types';
import { INTERNAL_METADATA_KEYS } from '../lib/types';

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
        dom_extracted: true,
        prompt_version: '1.0.0',
        pipeline_version: '0.5.0',
        schema_version: '1.0.0',
        vision_capture_status: 'skipped',
        compliance_check_status: 'skipped',
        analysis_source: 'fresh',
        generated_at: new Date().toISOString(),
        normalized_at: new Date().toISOString(),
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

describe('Metadata Stripping', () => {
  it('stripInternalMetadata removes internal fields from response', () => {
    const mock = makeMockResponse('test-strip-1');
    const stripped = stripInternalMetadata(mock);

    // Public fields should remain
    expect(stripped.result?.metadata.analyzed_at).toBeDefined();
    expect(stripped.result?.metadata.analysis_duration_ms).toBe(5000);
    expect(stripped.result?.metadata.model_used).toBe('claude-sonnet-4-6');
    expect(stripped.result?.metadata.vision_used).toBe(false);
    expect(stripped.result?.metadata.dom_extracted).toBe(true);

    // Internal fields should be removed
    const meta = stripped.result?.metadata as Record<string, unknown>;
    for (const key of INTERNAL_METADATA_KEYS) {
      expect(meta[key]).toBeUndefined();
    }
  });

  it('stripInternalMetadata handles response without result', () => {
    const errorResponse: AnalyzeResponse = {
      id: 'test-strip-error',
      url: 'https://example.com',
      status: 'error',
      error: 'Some error',
      created_at: new Date().toISOString(),
    };
    const stripped = stripInternalMetadata(errorResponse);
    expect(stripped).toEqual(errorResponse);
  });

  it('stripInternalMetadata does not mutate original response', () => {
    const mock = makeMockResponse('test-strip-immutable');
    const originalMeta = { ...mock.result!.metadata };
    stripInternalMetadata(mock);

    // Original should still have all fields
    expect(mock.result!.metadata.prompt_version).toBe(originalMeta.prompt_version);
    expect(mock.result!.metadata.pipeline_version).toBe(originalMeta.pipeline_version);
  });

  it('getShareAnalysisPublic returns stripped metadata', () => {
    const mock = makeMockResponse('test-share-public-1');
    storeAnalysis(mock);
    const shareId = createShareId('test-share-public-1');

    const result = getShareAnalysisPublic(shareId);
    expect(result).toBeDefined();
    expect(result?.id).toBe('test-share-public-1');

    // Internal fields should not be present
    const meta = result?.result?.metadata as Record<string, unknown>;
    for (const key of INTERNAL_METADATA_KEYS) {
      expect(meta[key]).toBeUndefined();
    }
  });

  it('internal analysis retrieval preserves all metadata', () => {
    const mock = makeMockResponse('test-internal-meta');
    storeAnalysis(mock);

    const retrieved = getAnalysis('test-internal-meta');
    expect(retrieved?.result?.metadata.prompt_version).toBe('1.0.0');
    expect(retrieved?.result?.metadata.pipeline_version).toBe('0.5.0');
    expect(retrieved?.result?.metadata.schema_version).toBe('1.0.0');
    expect(retrieved?.result?.metadata.vision_capture_status).toBe('skipped');
    expect(retrieved?.result?.metadata.compliance_check_status).toBe('skipped');
    expect(retrieved?.result?.metadata.analysis_source).toBe('fresh');
    expect(retrieved?.result?.metadata.generated_at).toBeDefined();
    expect(retrieved?.result?.metadata.normalized_at).toBeDefined();
  });
});

describe('Analysis Metadata Version Constants', () => {
  it('new metadata fields are populated with valid values', () => {
    const mock = makeMockResponse('test-versions');
    expect(mock.result!.metadata.prompt_version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(mock.result!.metadata.pipeline_version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(mock.result!.metadata.schema_version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('vision_capture_status has valid enum value', () => {
    const mock = makeMockResponse('test-vision-status');
    expect(['success', 'failed', 'skipped']).toContain(mock.result!.metadata.vision_capture_status);
  });

  it('compliance_check_status has valid enum value', () => {
    const mock = makeMockResponse('test-compliance-status');
    expect(['completed', 'partial', 'skipped']).toContain(mock.result!.metadata.compliance_check_status);
  });

  it('analysis_source has valid enum value', () => {
    const mock = makeMockResponse('test-source');
    expect(['fresh', 'cache']).toContain(mock.result!.metadata.analysis_source);
  });
});
