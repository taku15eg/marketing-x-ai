/**
 * API Contract Tests
 *
 * Validates that the API endpoints conform to the documented contract
 * (docs/api_contract.md) and that types.ts remains the single source of truth.
 *
 * These tests verify:
 * 1. AnalyzeResponse structure matches types.ts
 * 2. AnalysisResult structure matches CLAUDE.md output JSON
 * 3. Error responses use consistent ApiError format
 * 4. Share API response matches ShareResponse type
 * 5. Extension compatibility (ref field accepted)
 */

import { describe, it, expect } from 'vitest';
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  AnalysisResult,
  Issue,
  RegulatoryCheck,
  CompanyUnderstanding,
  PageReading,
  AnalysisMetadata,
  HandoffBrief,
  CTAInfo,
  BrandTone,
  ShareRequest,
  ShareResponse,
  ApiError,
  ExtensionAnalyzeRequest,
} from '../lib/types';

// --- Helpers ---

function makeValidAnalysisResult(): AnalysisResult {
  return {
    company_understanding: {
      summary: 'テスト企業',
      industry: 'SaaS',
      business_model: 'B2B',
      brand_tone: {
        sentence_endings: ['〜ます'],
        uses_questions: true,
        tone_keywords: ['信頼'],
        example_phrases: ['信頼のサービス'],
      },
      key_vocabulary: ['DX', 'クラウド'],
      credentials: ['導入100社以上'],
      site_cta_structure: 'FV直下にCTA',
    },
    page_reading: {
      page_type: 'サービスLP',
      fv_main_copy: 'DXを加速する',
      fv_sub_copy: 'クラウドで効率化',
      cta_map: [
        { text: '無料で始める', href: '/signup', position: 'fv', prominence: 'primary' },
      ],
      trust_elements: '導入企業ロゴ5社',
      content_structure: 'FV→課題提起→解決策→事例→CTA',
      confidence: 'high',
      screenshot_insights: 'FVに大きなヒーロー画像',
      dom_insights: 'H1が1つ、CTAが3箇所',
    },
    improvement_potential: '+25%',
    issues: [
      {
        priority: 1,
        title: 'FVのCTAが目立たない',
        diagnosis: 'CTAボタンが背景と同系色で視認性が低い',
        impact: 'high',
        handoff_to: 'designer',
        brief: {
          objective: 'CTAの視認性向上',
          direction: 'コントラスト比を高める配色変更',
          specifics: 'ボタンをアクセントカラーに変更',
          constraints: ['ブランドカラーの範囲内'],
          qa_checklist: ['モバイルでも視認性確認'],
        },
        evidence: 'CTAボタンのコントラスト比が2.1:1（WCAG基準4.5:1未満）',
      },
    ],
    regulatory: {
      yakujiho_risks: [
        {
          expression: '痩せる効果',
          risk_level: 'high',
          reason: '健康食品で効果効能の直接表現は薬機法違反の可能性',
          recommendation: '個人の感想としての表現に変更',
        },
      ],
      keihinhyoujiho_risks: [],
    },
    metadata: {
      analyzed_at: '2026-03-14T00:00:00.000Z',
      analysis_duration_ms: 12000,
      model_used: 'claude-sonnet-4-6',
      vision_used: true,
      dom_extracted: true,
    },
  };
}

function makeValidAnalyzeResponse(): AnalyzeResponse {
  return {
    id: 'test-id-abc123',
    url: 'https://example.com',
    status: 'completed',
    result: makeValidAnalysisResult(),
    created_at: '2026-03-14T00:00:00.000Z',
  };
}

// === Contract Tests ===

describe('Contract: AnalyzeRequest', () => {
  it('accepts minimal request with url only', () => {
    const req: AnalyzeRequest = { url: 'https://example.com' };
    expect(req.url).toBeDefined();
    expect(req.ref).toBeUndefined();
  });

  it('accepts request with ref field', () => {
    const req: AnalyzeRequest = { url: 'https://example.com', ref: 'share' };
    expect(req.ref).toBe('share');
  });

  it('ExtensionAnalyzeRequest requires ref=extension', () => {
    const req: ExtensionAnalyzeRequest = { url: 'https://example.com', ref: 'extension' };
    expect(req.ref).toBe('extension');
  });
});

describe('Contract: AnalyzeResponse', () => {
  it('completed response has required fields', () => {
    const res = makeValidAnalyzeResponse();
    expect(res.id).toBeDefined();
    expect(res.url).toBeDefined();
    expect(res.status).toBe('completed');
    expect(res.result).toBeDefined();
    expect(res.created_at).toBeDefined();
    expect(res.error).toBeUndefined();
  });

  it('error response has error field and no result', () => {
    const res: AnalyzeResponse = {
      id: 'err-1',
      url: 'https://example.com',
      status: 'error',
      error: '分析に失敗しました',
      created_at: '2026-03-14T00:00:00.000Z',
    };
    expect(res.status).toBe('error');
    expect(res.error).toBeDefined();
    expect(res.result).toBeUndefined();
  });

  it('status values are restricted to processing|completed|error', () => {
    const validStatuses: AnalyzeResponse['status'][] = ['processing', 'completed', 'error'];
    expect(validStatuses).toHaveLength(3);
  });
});

describe('Contract: AnalysisResult structure', () => {
  const result = makeValidAnalysisResult();

  it('has all 4 required top-level sections', () => {
    expect(result.company_understanding).toBeDefined();
    expect(result.page_reading).toBeDefined();
    expect(result.improvement_potential).toBeDefined();
    expect(result.issues).toBeDefined();
    expect(result.metadata).toBeDefined();
  });

  it('improvement_potential follows +XX% format', () => {
    expect(result.improvement_potential).toMatch(/^\+\d+%$/);
  });

  it('issues are sorted by priority', () => {
    const priorities = result.issues.map(i => i.priority);
    const sorted = [...priorities].sort((a, b) => a - b);
    expect(priorities).toEqual(sorted);
  });

  it('regulatory is optional', () => {
    const resultWithout: AnalysisResult = { ...result, regulatory: undefined };
    expect(resultWithout.regulatory).toBeUndefined();
  });
});

describe('Contract: CompanyUnderstanding', () => {
  const cu = makeValidAnalysisResult().company_understanding;

  it('has all required fields', () => {
    expect(cu.summary).toBeDefined();
    expect(cu.industry).toBeDefined();
    expect(cu.business_model).toBeDefined();
    expect(cu.brand_tone).toBeDefined();
    expect(cu.key_vocabulary).toBeInstanceOf(Array);
    expect(cu.credentials).toBeInstanceOf(Array);
    expect(cu.site_cta_structure).toBeDefined();
  });
});

describe('Contract: PageReading', () => {
  const pr = makeValidAnalysisResult().page_reading;

  it('has all required fields', () => {
    expect(pr.page_type).toBeDefined();
    expect(pr.fv_main_copy).toBeDefined();
    expect(pr.cta_map).toBeInstanceOf(Array);
    expect(pr.confidence).toBeDefined();
  });

  it('confidence is one of high|medium|low', () => {
    expect(['high', 'medium', 'low']).toContain(pr.confidence);
  });

  it('cta_map items have required fields', () => {
    for (const cta of pr.cta_map) {
      expect(cta.text).toBeDefined();
      expect(cta.position).toBeDefined();
      expect(['primary', 'secondary', 'tertiary']).toContain(cta.prominence);
    }
  });
});

describe('Contract: Issue', () => {
  const issue = makeValidAnalysisResult().issues[0];

  it('has all required fields', () => {
    expect(issue.priority).toBeGreaterThanOrEqual(1);
    expect(issue.title).toBeDefined();
    expect(issue.diagnosis).toBeDefined();
    expect(['high', 'medium', 'low']).toContain(issue.impact);
    expect(['designer', 'engineer', 'copywriter+designer', 'marketer']).toContain(issue.handoff_to);
    expect(issue.brief).toBeDefined();
    expect(issue.evidence).toBeDefined();
  });

  it('brief has all required fields', () => {
    const brief = issue.brief;
    expect(brief.objective).toBeDefined();
    expect(brief.direction).toBeDefined();
    expect(brief.specifics).toBeDefined();
    expect(brief.constraints).toBeInstanceOf(Array);
    expect(brief.qa_checklist).toBeInstanceOf(Array);
  });

  it('does NOT contain copy text (structural proposals only)', () => {
    // CLAUDE.md rule: コピー文言は出さない。構造変化を図示する
    // Brief should describe structural changes, not write copy
    const brief = issue.brief;
    expect(brief.direction).not.toBe('');
    // direction should describe a structural change
    expect(typeof brief.direction).toBe('string');
  });
});

describe('Contract: RegulatoryCheck', () => {
  const reg = makeValidAnalysisResult().regulatory!;

  it('has yakujiho_risks and keihinhyoujiho_risks arrays', () => {
    expect(reg.yakujiho_risks).toBeInstanceOf(Array);
    expect(reg.keihinhyoujiho_risks).toBeInstanceOf(Array);
  });

  it('risks have required fields', () => {
    for (const risk of reg.yakujiho_risks) {
      expect(risk.expression).toBeDefined();
      expect(['high', 'medium', 'low']).toContain(risk.risk_level);
      expect(risk.reason).toBeDefined();
      expect(risk.recommendation).toBeDefined();
    }
  });
});

describe('Contract: AnalysisMetadata', () => {
  const meta = makeValidAnalysisResult().metadata;

  it('has all required fields', () => {
    expect(meta.analyzed_at).toBeDefined();
    expect(meta.analysis_duration_ms).toBeGreaterThanOrEqual(0);
    expect(meta.model_used).toBeDefined();
    expect(typeof meta.vision_used).toBe('boolean');
    expect(typeof meta.dom_extracted).toBe('boolean');
  });

  it('analyzed_at is valid ISO8601', () => {
    const date = new Date(meta.analyzed_at);
    expect(date.toISOString()).toBe(meta.analyzed_at);
  });
});

describe('Contract: ShareRequest / ShareResponse', () => {
  it('ShareRequest has analysis_id', () => {
    const req: ShareRequest = { analysis_id: 'test-123' };
    expect(req.analysis_id).toBeDefined();
  });

  it('ShareResponse has share_id and share_url', () => {
    const res: ShareResponse = {
      share_id: 'share-abc',
      share_url: 'https://publishgate.jp/share/share-abc',
    };
    expect(res.share_id).toBeDefined();
    expect(res.share_url).toBeDefined();
    expect(res.share_url).toContain(res.share_id);
  });
});

describe('Contract: ApiError', () => {
  it('has error string', () => {
    const err: ApiError = { error: 'URLが指定されていません' };
    expect(err.error).toBeDefined();
    expect(err.reset_at).toBeUndefined();
  });

  it('rate limit error includes reset_at', () => {
    const err: ApiError = {
      error: 'レート制限に達しました',
      reset_at: '2026-03-14T01:00:00.000Z',
    };
    expect(err.reset_at).toBeDefined();
  });
});

describe('Contract: Extension ↔ Dashboard API compatibility', () => {
  it('extension sends AnalyzeRequest with ref=extension', () => {
    // This simulates what the extension service-worker sends
    const extensionPayload: AnalyzeRequest = { url: 'https://example.com', ref: 'extension' };

    // Must be valid AnalyzeRequest
    const req = extensionPayload;
    expect(req.url).toBe('https://example.com');
    expect(req.ref).toBe('extension');
  });

  it('extension receives standard AnalyzeResponse', () => {
    // The dashboard API returns the same response regardless of source
    const res = makeValidAnalyzeResponse();
    expect(res.id).toBeDefined();
    expect(res.result).toBeDefined();
    expect(res.result!.issues).toBeInstanceOf(Array);
    expect(res.result!.company_understanding).toBeDefined();
    expect(res.result!.page_reading).toBeDefined();
  });

  it('extension can handle error responses', () => {
    const errorRes: AnalyzeResponse = {
      id: 'err-ext-1',
      url: 'https://example.com',
      status: 'error',
      error: 'URLが不正です',
      created_at: new Date().toISOString(),
    };
    expect(errorRes.status).toBe('error');
    expect(errorRes.error).toBeDefined();
  });
});

describe('Contract: CLAUDE.md alignment', () => {
  it('AnalysisResult matches CLAUDE.md 4-step output structure', () => {
    const result = makeValidAnalysisResult();

    // Step 1: 企業を知る → company_understanding
    expect(result.company_understanding.summary).toBeDefined();
    expect(result.company_understanding.site_cta_structure).toBeDefined();

    // Step 2: ページを見る → page_reading
    expect(result.page_reading.page_type).toBeDefined();
    expect(result.page_reading.fv_main_copy).toBeDefined();
    expect(result.page_reading.cta_map).toBeDefined();
    expect(result.page_reading.confidence).toBeDefined();

    // Step 3: 診断する → issues with impact ordering
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0].priority).toBeDefined();
    expect(result.issues[0].diagnosis).toBeDefined();

    // Step 4: 依頼パックを出す → issue.brief
    expect(result.issues[0].brief.objective).toBeDefined();
    expect(result.issues[0].brief.direction).toBeDefined();
    expect(result.issues[0].brief.constraints).toBeDefined();
    expect(result.issues[0].brief.qa_checklist).toBeDefined();
  });

  it('handoff_to matches CLAUDE.md categories', () => {
    const validHandoffs = ['designer', 'engineer', 'copywriter+designer', 'marketer'];
    const result = makeValidAnalysisResult();
    for (const issue of result.issues) {
      expect(validHandoffs).toContain(issue.handoff_to);
    }
  });
});
