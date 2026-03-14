/**
 * Shared Analysis Schema — Unit Tests
 *
 * Tests Zod schema validation, normalization, and edge cases.
 */

import { describe, it, expect } from 'vitest';
import {
  AnalysisResultSchema,
  AnalyzeResponseSchema,
  IssueSchema,
  RegulatoryCheckSchema,
  type AnalysisResult,
} from '../schema';
import {
  normalizeAnalysisResult,
  normalizeProxyResult,
  extractJsonFromResponse,
} from '../normalize';
import { SCHEMA_VERSION } from '../version';

// ─── Schema Validation ────────────────────────────────────

describe('AnalysisResultSchema', () => {
  it('parses a complete valid result', () => {
    const input = {
      company_understanding: {
        summary: 'SaaS company providing HR tools',
        industry: 'HR Tech',
        business_model: 'B2B SaaS',
        brand_tone: {
          sentence_endings: ['です', 'ます'],
          uses_questions: true,
          tone_keywords: ['効率化'],
          example_phrases: ['業務を効率化'],
        },
        key_vocabulary: ['DX', 'HR'],
        credentials: ['導入実績500社'],
        site_cta_structure: '無料トライアル → 資料請求',
      },
      page_reading: {
        page_type: 'サービスLP',
        fv_main_copy: '人事業務をDXする',
        fv_sub_copy: '導入実績500社',
        cta_map: [{ text: '無料トライアル', href: '/trial', position: 'header', prominence: 'primary' }],
        trust_elements: 'ロゴ一覧、導入事例',
        content_structure: 'FV → 機能紹介 → 事例 → CTA',
        confidence: 'high',
        screenshot_insights: 'Clean layout',
        dom_insights: 'Well-structured HTML',
      },
      improvement_potential: '+25%',
      issues: [
        {
          priority: 1,
          title: 'FVのCTAが目立たない',
          diagnosis: 'ボタンが背景色と同系色',
          impact: 'high',
          handoff_to: 'designer',
          brief: {
            objective: 'CTA視認性向上',
            direction: 'コントラスト比を上げる',
            specifics: 'ボタン色を#FF6B35に変更',
            constraints: ['ブランドカラーとの整合性'],
            qa_checklist: ['WCAG AA以上のコントラスト比'],
          },
          evidence: 'FVスクリーンショットで確認',
        },
      ],
      regulatory: {
        yakujiho_risks: [
          {
            expression: '効果を実感',
            risk_level: 'high',
            reason: '効能効果の暗示',
            recommendation: '体験談として再構成',
          },
        ],
        keihinhyoujiho_risks: [],
      },
      metadata: {
        schema_version: '1.0.0',
        analyzed_at: '2026-03-14T00:00:00.000Z',
        analysis_duration_ms: 5000,
        model_used: 'claude-sonnet-4-6',
        vision_used: true,
        dom_extracted: true,
        source: 'dashboard',
      },
    };

    const result = AnalysisResultSchema.parse(input);
    expect(result.company_understanding.summary).toBe('SaaS company providing HR tools');
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].priority).toBe(1);
    expect(result.regulatory?.yakujiho_risks).toHaveLength(1);
    expect(result.metadata.schema_version).toBe('1.0.0');
    expect(result.metadata.source).toBe('dashboard');
  });

  it('applies defaults for missing fields', () => {
    const result = AnalysisResultSchema.parse({});
    expect(result.company_understanding.summary).toBe('');
    expect(result.page_reading.confidence).toBe('medium');
    expect(result.issues).toEqual([]);
    expect(result.improvement_potential).toBe('');
    expect(result.metadata.schema_version).toBe(SCHEMA_VERSION);
    expect(result.metadata.dom_extracted).toBe(true);
  });

  it('strips unknown fields', () => {
    const result = AnalysisResultSchema.parse({
      unknown_field: 'should be stripped',
      company_understanding: { summary: 'test', extra: 'stripped' },
    });
    expect(result.company_understanding.summary).toBe('test');
    expect((result.company_understanding as Record<string, unknown>).extra).toBeUndefined();
  });

  it('validates enum values', () => {
    expect(() =>
      AnalysisResultSchema.parse({
        page_reading: { confidence: 'invalid' },
      })
    ).toThrow();
  });
});

describe('IssueSchema', () => {
  it('validates a complete issue', () => {
    const issue = IssueSchema.parse({
      priority: 1,
      title: 'CTA改善',
      diagnosis: 'ボタンが小さすぎる',
      impact: 'high',
      handoff_to: 'designer',
      brief: {
        objective: 'クリック率向上',
        direction: 'ボタンサイズ拡大',
        specifics: '高さ48px以上に',
        constraints: ['モバイル対応'],
        qa_checklist: ['タップ領域44x44px以上'],
      },
      evidence: 'ヒートマップ分析',
    });
    expect(issue.priority).toBe(1);
    expect(issue.brief.qa_checklist).toHaveLength(1);
  });

  it('applies defaults for minimal issue', () => {
    const issue = IssueSchema.parse({});
    expect(issue.priority).toBe(1);
    expect(issue.title).toBe('');
    expect(issue.impact).toBe('medium');
    expect(issue.handoff_to).toBe('designer');
    expect(issue.brief.constraints).toEqual([]);
  });
});

// ─── Normalization ────────────────────────────────────────

describe('normalizeAnalysisResult', () => {
  it('normalizes a complete raw output', () => {
    const raw = {
      company_understanding: { summary: 'テスト企業', industry: 'IT' },
      page_reading: { page_type: 'LP', confidence: 'high' },
      improvement_potential: '+20%',
      issues: [
        { priority: 2, title: 'Issue B', impact: 'low', handoff_to: 'engineer' },
        { priority: 1, title: 'Issue A', impact: 'high', handoff_to: 'designer' },
      ],
    };

    const result = normalizeAnalysisResult(raw, { source: 'dashboard', model_used: 'claude-sonnet-4-6' });
    expect(result.company_understanding.summary).toBe('テスト企業');
    expect(result.metadata.schema_version).toBe(SCHEMA_VERSION);
    expect(result.metadata.source).toBe('dashboard');
    // Issues sorted by priority
    expect(result.issues[0].title).toBe('Issue A');
    expect(result.issues[1].title).toBe('Issue B');
  });

  it('handles missing fields gracefully', () => {
    const raw = {};
    const result = normalizeAnalysisResult(raw);
    expect(result.company_understanding.summary).toBe('');
    expect(result.page_reading.confidence).toBe('medium');
    expect(result.issues).toEqual([]);
    expect(result.metadata.schema_version).toBe(SCHEMA_VERSION);
  });

  it('assigns priority when missing from issues', () => {
    const raw = {
      issues: [
        { title: 'First' },
        { title: 'Second' },
        { title: 'Third' },
      ],
    };
    const result = normalizeAnalysisResult(raw);
    expect(result.issues[0].priority).toBe(1);
    expect(result.issues[1].priority).toBe(2);
    expect(result.issues[2].priority).toBe(3);
  });

  it('normalizes brief sub-objects with missing fields', () => {
    const raw = {
      issues: [
        {
          priority: 1,
          title: 'Test',
          brief: { objective: 'Goal' },
        },
      ],
    };
    const result = normalizeAnalysisResult(raw);
    expect(result.issues[0].brief.objective).toBe('Goal');
    expect(result.issues[0].brief.constraints).toEqual([]);
    expect(result.issues[0].brief.qa_checklist).toEqual([]);
  });

  it('filters empty regulatory arrays', () => {
    const raw = {
      regulatory: {
        yakujiho_risks: [],
        keihinhyoujiho_risks: [],
      },
    };
    const result = normalizeAnalysisResult(raw);
    expect(result.regulatory).toBeUndefined();
  });

  it('preserves non-empty regulatory risks', () => {
    const raw = {
      regulatory: {
        yakujiho_risks: [
          { expression: '効く', risk_level: 'high', reason: '効能表現', recommendation: '削除' },
        ],
        keihinhyoujiho_risks: [],
      },
    };
    const result = normalizeAnalysisResult(raw);
    expect(result.regulatory).toBeDefined();
    expect(result.regulatory!.yakujiho_risks).toHaveLength(1);
  });

  it('handles model output with extra/unknown fields', () => {
    const raw = {
      company_understanding: {
        summary: 'Test',
        unknown_ai_field: 'should be stripped',
      },
      extra_top_level: 'stripped',
      issues: [
        {
          priority: 1,
          title: 'Test',
          unknown_field: 'stripped',
          brief: { objective: 'Goal', extra: 'stripped' },
        },
      ],
    };
    const result = normalizeAnalysisResult(raw);
    expect(result.company_understanding.summary).toBe('Test');
    expect((result as Record<string, unknown>).extra_top_level).toBeUndefined();
  });
});

// ─── Proxy Normalization ──────────────────────────────────

describe('normalizeProxyResult', () => {
  it('converts goal_card/proposals to canonical format', () => {
    const raw = {
      goal_card: {
        company_hypothesis: 'SaaS企業',
        page_role: '獲得LP',
        primary_cv: '無料トライアル',
        secondary_cv: '資料請求',
        confidence: 'high',
      },
      judgment: 'FAIL',
      judgment_reason: 'CTA改善余地あり',
      proposals: [
        {
          priority: 1,
          title: 'CTAボタン改善',
          category: 'cta',
          before: '小さいボタン',
          after: '大きいボタン',
          evidence: 'FV分析',
          confidence: 'high',
        },
      ],
    };

    const result = normalizeProxyResult(raw, 'https://example.com');
    expect(result.company_understanding.summary).toBe('SaaS企業');
    expect(result.page_reading.page_type).toBe('獲得LP');
    expect(result.page_reading.fv_main_copy).toBe('無料トライアル');
    expect(result.improvement_potential).toBe('High');
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].handoff_to).toBe('designer');
    expect(result.metadata.source).toBe('proxy');
    expect(result.metadata.schema_version).toBe(SCHEMA_VERSION);
  });

  it('handles empty proxy response', () => {
    const result = normalizeProxyResult({}, '');
    expect(result.company_understanding.summary).toBe('');
    expect(result.issues).toEqual([]);
    expect(result.metadata.source).toBe('proxy');
  });

  it('maps proposal categories to handoff targets', () => {
    const raw = {
      proposals: [
        { title: 'Copy', category: 'copy', priority: 1 },
        { title: 'Speed', category: 'speed', priority: 2 },
        { title: 'SEO', category: 'seo', priority: 3 },
        { title: 'Layout', category: 'layout', priority: 4 },
      ],
    };
    const result = normalizeProxyResult(raw, '');
    expect(result.issues[0].handoff_to).toBe('copywriter+designer');
    expect(result.issues[1].handoff_to).toBe('engineer');
    expect(result.issues[2].handoff_to).toBe('engineer');
    expect(result.issues[3].handoff_to).toBe('designer');
  });
});

// ─── JSON Extraction ──────────────────────────────────────

describe('extractJsonFromResponse', () => {
  it('extracts JSON from markdown code block', () => {
    const text = '```json\n{"key": "value"}\n```';
    expect(extractJsonFromResponse(text)).toBe('{"key": "value"}');
  });

  it('extracts JSON from plain code block', () => {
    const text = '```\n{"key": "value"}\n```';
    expect(extractJsonFromResponse(text)).toBe('{"key": "value"}');
  });

  it('returns raw text when no code block', () => {
    const text = '{"key": "value"}';
    expect(extractJsonFromResponse(text)).toBe('{"key": "value"}');
  });

  it('handles whitespace around code blocks', () => {
    const text = '  ```json\n  {"key": "value"}  \n```  ';
    const extracted = extractJsonFromResponse(text);
    expect(JSON.parse(extracted)).toEqual({ key: 'value' });
  });
});

// ─── AnalyzeResponse Schema ──────────────────────────────

describe('AnalyzeResponseSchema', () => {
  it('validates a completed response', () => {
    const response = AnalyzeResponseSchema.parse({
      id: 'abc123',
      url: 'https://example.com',
      status: 'completed',
      result: {
        company_understanding: { summary: 'Test' },
        improvement_potential: '+15%',
        issues: [],
      },
      created_at: '2026-03-14T00:00:00.000Z',
    });
    expect(response.status).toBe('completed');
    expect(response.result?.company_understanding.summary).toBe('Test');
  });

  it('validates an error response', () => {
    const response = AnalyzeResponseSchema.parse({
      id: 'abc123',
      url: 'https://example.com',
      status: 'error',
      error: 'API error',
      created_at: '2026-03-14T00:00:00.000Z',
    });
    expect(response.status).toBe('error');
    expect(response.error).toBe('API error');
  });

  it('rejects invalid status', () => {
    expect(() =>
      AnalyzeResponseSchema.parse({
        id: 'abc123',
        url: 'https://example.com',
        status: 'invalid',
        created_at: '2026-03-14T00:00:00.000Z',
      })
    ).toThrow();
  });
});

// ─── Backward Compatibility ──────────────────────────────

describe('Backward Compatibility', () => {
  it('handles pre-schema_version data (no metadata.schema_version)', () => {
    const raw = {
      company_understanding: { summary: 'Old data' },
      page_reading: { page_type: 'LP' },
      improvement_potential: '+10%',
      issues: [],
    };
    const result = normalizeAnalysisResult(raw);
    // schema_version should be set to current version
    expect(result.metadata.schema_version).toBe(SCHEMA_VERSION);
  });

  it('handles issues without brief object', () => {
    const raw = {
      issues: [{ priority: 1, title: 'No brief' }],
    };
    const result = normalizeAnalysisResult(raw);
    expect(result.issues[0].brief.objective).toBe('');
    expect(result.issues[0].brief.constraints).toEqual([]);
  });
});
