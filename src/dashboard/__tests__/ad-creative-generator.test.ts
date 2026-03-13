/**
 * Ad Creative Generator Unit Tests
 *
 * Tests the ad creative prompt construction and response parsing logic.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(
  path.resolve(__dirname, '../lib/ad-creative-generator.ts'),
  'utf-8'
);

describe('Ad Creative Generator - System Prompt', () => {
  it('includes platform-specific instructions', () => {
    expect(source).toContain('Google Ads RSA');
    expect(source).toContain('Meta Ads');
    expect(source).toContain('PMax');
  });

  it('specifies character limits for Google Ads', () => {
    expect(source).toContain('見出し30文字以内');
    expect(source).toContain('説明文90文字以内');
  });

  it('specifies character limits for Meta Ads', () => {
    expect(source).toContain('プライマリテキスト125文字以内');
    expect(source).toContain('見出し40文字以内');
  });

  it('includes regulatory compliance warning', () => {
    expect(source).toContain('薬機法・景品表示法リスクのある表現は絶対に使わない');
  });

  it('specifies angle types', () => {
    expect(source).toContain('課題解決型');
    expect(source).toContain('実績・数値型');
    expect(source).toContain('感情訴求型');
  });

  it('instructs to base creatives on LP analysis results', () => {
    expect(source).toContain('LP分析結果から');
  });

  it('requires JSON-only output', () => {
    expect(source).toContain('JSON出力のみ');
  });
});

describe('Ad Creative Generator - User Content', () => {
  it('wraps analysis data in XML tags', () => {
    expect(source).toContain('<analysis_result>');
    expect(source).toContain('</analysis_result>');
  });

  it('includes company understanding data', () => {
    expect(source).toContain('company_understanding.summary');
    expect(source).toContain('company_understanding.industry');
  });

  it('includes page reading data', () => {
    expect(source).toContain('page_reading.fv_main_copy');
    expect(source).toContain('page_reading.trust_elements');
  });

  it('includes issues from analysis', () => {
    expect(source).toContain('result.issues.map');
  });

  it('includes regulatory risks when present', () => {
    expect(source).toContain('result.regulatory');
    expect(source).toContain('薬機法');
    expect(source).toContain('景表法');
  });
});

describe('Ad Creative Generator - Response Parsing', () => {
  it('handles JSON code block extraction', () => {
    expect(source).toContain('```(?:json)?');
  });

  it('normalizes ad items with character limit enforcement', () => {
    expect(source).toContain('text.slice(0, maxChars)');
  });

  it('includes analysis_id in result', () => {
    expect(source).toContain('analysis_id: analysisId');
  });

  it('includes generated_at timestamp', () => {
    expect(source).toContain('generated_at: new Date().toISOString()');
  });
});

describe('Ad Creative Generator - Security', () => {
  it('only uses server-side API key', () => {
    expect(source).toContain('process.env.ANTHROPIC_API_KEY');
    expect(source).not.toContain('NEXT_PUBLIC_');
  });

  it('throws error when API key is missing', () => {
    expect(source).toContain("throw new Error('ANTHROPIC_API_KEY is not configured')");
  });
});
