/**
 * Value Pipeline Flow Tests
 *
 * Validates the end-to-end value delivery pipeline:
 * URL入力 → 分析 → 結果表示 → 共有URL → 再閲覧
 *
 * Tests the flow contracts at each handoff point without
 * requiring a running server (source verification + unit tests).
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  storeAnalysis,
  getAnalysis,
  createShareId,
  getShareAnalysis,
  getCachedAnalysisByUrl,
} from '../lib/analyzer';
import type { AnalyzeResponse } from '../lib/types';

// Helper: create a valid AnalyzeResponse for testing
function createMockAnalysis(overrides: Partial<AnalyzeResponse> = {}): AnalyzeResponse {
  return {
    id: `flow-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    url: 'https://example.com/lp',
    status: 'completed',
    result: {
      company_understanding: {
        summary: 'テスト企業', industry: 'IT', business_model: 'SaaS',
        brand_tone: { sentence_endings: [], uses_questions: false, tone_keywords: [], example_phrases: [] },
        key_vocabulary: [], credentials: [], site_cta_structure: '',
      },
      page_reading: {
        page_type: 'サービスLP', fv_main_copy: 'テストコピー', fv_sub_copy: '',
        cta_map: [{ text: '無料で始める', href: '/signup', position: 'fv', prominence: 'primary' }],
        trust_elements: '', content_structure: '', confidence: 'high',
        screenshot_insights: '', dom_insights: '',
      },
      improvement_potential: '+15%',
      issues: [{
        priority: 1, title: 'FVの訴求力不足',
        diagnosis: 'メインコピーが曖昧', impact: 'high',
        handoff_to: 'designer',
        brief: { objective: '訴求力向上', direction: '構造変更', specifics: '', constraints: [], qa_checklist: [] },
        evidence: 'H1が一般的すぎる',
      }],
      metadata: {
        analyzed_at: new Date().toISOString(),
        analysis_duration_ms: 5000,
        model_used: 'claude-sonnet-4-6',
        vision_used: true,
        dom_extracted: true,
      },
    },
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('Flow - URL入力 → 分析結果保存', () => {
  it('analysis result is stored and retrievable by ID', () => {
    const analysis = createMockAnalysis();
    storeAnalysis(analysis);
    const retrieved = getAnalysis(analysis.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe(analysis.id);
    expect(retrieved!.url).toBe(analysis.url);
    expect(retrieved!.status).toBe('completed');
  });

  it('completed analysis is cached by URL', () => {
    const url = `https://flow-cache-${Date.now()}.example.com/lp`;
    const analysis = createMockAnalysis({ url });
    storeAnalysis(analysis);
    const cached = getCachedAnalysisByUrl(url);
    expect(cached).toBeDefined();
    expect(cached!.id).toBe(analysis.id);
  });

  it('error analysis is stored but not URL-cached', () => {
    const url = `https://flow-error-${Date.now()}.example.com/lp`;
    const analysis = createMockAnalysis({
      url,
      status: 'error',
      error: 'API key missing',
      result: undefined,
    });
    storeAnalysis(analysis);
    expect(getAnalysis(analysis.id)).toBeDefined();
    expect(getCachedAnalysisByUrl(url)).toBeUndefined();
  });
});

describe('Flow - 結果表示 → 共有URL生成', () => {
  it('share link is created from analysis ID', () => {
    const analysis = createMockAnalysis();
    storeAnalysis(analysis);

    const shareId = createShareId(analysis.id);
    expect(shareId).toHaveLength(21);
    expect(typeof shareId).toBe('string');
  });

  it('multiple share links can point to same analysis', () => {
    const analysis = createMockAnalysis();
    storeAnalysis(analysis);

    const shareId1 = createShareId(analysis.id);
    const shareId2 = createShareId(analysis.id);
    expect(shareId1).not.toBe(shareId2);

    const shared1 = getShareAnalysis(shareId1);
    const shared2 = getShareAnalysis(shareId2);
    expect(shared1!.id).toBe(shared2!.id);
  });
});

describe('Flow - 共有URL → 再閲覧', () => {
  it('shared analysis is retrievable by share ID', () => {
    const analysis = createMockAnalysis();
    storeAnalysis(analysis);
    const shareId = createShareId(analysis.id);

    const shared = getShareAnalysis(shareId);
    expect(shared).toBeDefined();
    expect(shared!.result).toBeDefined();
    expect(shared!.result!.issues.length).toBeGreaterThan(0);
  });

  it('shared analysis preserves all result fields', () => {
    const analysis = createMockAnalysis();
    storeAnalysis(analysis);
    const shareId = createShareId(analysis.id);

    const shared = getShareAnalysis(shareId);
    expect(shared!.result!.company_understanding.summary).toBe('テスト企業');
    expect(shared!.result!.page_reading.page_type).toBe('サービスLP');
    expect(shared!.result!.improvement_potential).toBe('+15%');
    expect(shared!.result!.metadata.vision_used).toBe(true);
  });

  it('invalid share ID returns undefined', () => {
    expect(getShareAnalysis('nonexistent-id')).toBeUndefined();
  });
});

describe('Flow - Page Contracts (source verification)', () => {
  const homePage = fs.readFileSync(
    path.resolve(__dirname, '../app/page.tsx'), 'utf-8'
  );
  const analysisPage = fs.readFileSync(
    path.resolve(__dirname, '../app/analysis/[id]/page.tsx'), 'utf-8'
  );
  const sharePage = fs.readFileSync(
    path.resolve(__dirname, '../app/share/[id]/page.tsx'), 'utf-8'
  );

  it('home page sends POST to /api/analyze', () => {
    expect(homePage).toContain("'/api/analyze'");
    expect(homePage).toContain("method: 'POST'");
  });

  it('home page stores result in sessionStorage before navigating', () => {
    expect(homePage).toContain('sessionStorage.setItem');
    expect(homePage).toContain('analysis_${data.id}');
  });

  it('home page navigates to /analysis/{id}', () => {
    expect(homePage).toContain('router.push(`/analysis/${data.id}`)');
  });

  it('home page handles 429 rate limit with reset_at', () => {
    expect(homePage).toContain('res.status === 429');
    expect(homePage).toContain('data.reset_at');
  });

  it('home page supports cancel via AbortController', () => {
    expect(homePage).toContain('AbortController');
    expect(homePage).toContain('AbortError');
  });

  it('analysis page fetches by ID from /api/analyze', () => {
    expect(analysisPage).toContain('/api/analyze?id=');
  });

  it('analysis page checks sessionStorage first', () => {
    expect(analysisPage).toContain('sessionStorage.getItem');
  });

  it('analysis page shows ShareButton', () => {
    expect(analysisPage).toContain('ShareButton');
    expect(analysisPage).toContain('analysisId={data.id}');
  });

  it('analysis page shows AnalysisResult component', () => {
    expect(analysisPage).toContain('<AnalysisResult');
  });

  it('analysis page shows error state with retry link', () => {
    expect(analysisPage).toContain('分析結果が見つかりません');
    expect(analysisPage).toContain('トップに戻って再分析');
  });

  it('share page fetches from /api/share', () => {
    expect(sharePage).toContain('/api/share?id=');
  });

  it('share page shows viral CTA with ?ref=share', () => {
    expect(sharePage).toContain("/?ref=share");
  });

  it('share page shows SocialShareButtons', () => {
    expect(sharePage).toContain('SocialShareButtons');
  });

  it('share page shows PoweredByBadge', () => {
    expect(sharePage).toContain('PoweredByBadge');
  });

  it('share page handles expired/invalid links gracefully', () => {
    expect(sharePage).toContain('リンクが無効です');
    expect(sharePage).toContain('共有リンクが無効または期限切れです');
  });
});

describe('Flow - Viral Loop Contract', () => {
  const sharePage = fs.readFileSync(
    path.resolve(__dirname, '../app/share/[id]/page.tsx'), 'utf-8'
  );

  it('share page has conversion CTA to analyze own LP', () => {
    expect(sharePage).toContain('自分のLPも分析する');
  });

  it('share page bottom CTA uses ref=share tracking', () => {
    // Both top and bottom CTAs should use ref=share
    const refShareCount = (sharePage.match(/\?ref=share/g) || []).length;
    expect(refShareCount).toBeGreaterThanOrEqual(2);
  });

  it('share page displays analysis URL to build trust', () => {
    expect(sharePage).toContain('data.url');
  });
});
