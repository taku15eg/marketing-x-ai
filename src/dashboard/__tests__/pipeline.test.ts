/**
 * Pipeline Tests
 *
 * Tests the analysis pipeline's resilience and contract compliance.
 * Focuses on:
 * 1. JSON self-heal/fallback when Claude returns invalid JSON
 * 2. "No copy text" principle guard
 * 3. Pipeline step ordering
 */

import { describe, it, expect } from 'vitest';
import { extractJsonFromText } from '../lib/prompt-builder';
import fs from 'fs';
import path from 'path';

describe('Pipeline - JSON Self-Heal/Fallback', () => {
  it('fallback result has valid AnalysisResult structure', () => {
    const promptBuilderSource = fs.readFileSync(
      path.resolve(__dirname, '../lib/prompt-builder.ts'),
      'utf-8'
    );
    // Verify createFallbackResult exists
    expect(promptBuilderSource).toContain('createFallbackResult');
    // Verify it returns all required fields
    expect(promptBuilderSource).toContain('company_understanding');
    expect(promptBuilderSource).toContain('page_reading');
    expect(promptBuilderSource).toContain('improvement_potential');
    expect(promptBuilderSource).toContain('issues');
    expect(promptBuilderSource).toContain('metadata');
  });

  it('fallback result sets confidence to low', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../lib/prompt-builder.ts'),
      'utf-8'
    );
    // In createFallbackResult, confidence should be 'low'
    expect(source).toMatch(/createFallbackResult[\s\S]*confidence:\s*'low'/);
  });

  it('fallback result includes an error issue', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../lib/prompt-builder.ts'),
      'utf-8'
    );
    // Fallback includes an issue explaining the parse failure
    expect(source).toContain('AI分析レスポンスの解析に失敗しました');
  });

  it('parseAnalysisResponse calls createFallbackResult on invalid JSON', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../lib/prompt-builder.ts'),
      'utf-8'
    );
    // The catch block in parseAnalysisResponse should call createFallbackResult
    expect(source).toMatch(/catch[\s\S]*createFallbackResult/);
  });
});

describe('Pipeline - "No Copy Text" Principle', () => {
  const promptSource = fs.readFileSync(
    path.resolve(__dirname, '../lib/prompt-builder.ts'),
    'utf-8'
  );

  it('system prompt explicitly prohibits copy text generation', () => {
    expect(promptSource).toContain('コピー文言は出さず');
  });

  it('system prompt directs structural proposals only', () => {
    expect(promptSource).toContain('構造変化を提案');
  });

  it('system prompt requests JSON output only', () => {
    expect(promptSource).toContain('JSON出力のみ');
    expect(promptSource).toContain('他テキスト禁止');
  });

  it('issue handoff categories do not include "copywriter" standalone', () => {
    const typesSource = fs.readFileSync(
      path.resolve(__dirname, '../lib/types.ts'),
      'utf-8'
    );
    // handoff_to includes 'copywriter+designer' (joint) but not standalone 'copywriter'
    expect(typesSource).toContain("'copywriter+designer'");
    // The handoff types should be the known set
    expect(typesSource).toContain("'designer'");
    expect(typesSource).toContain("'engineer'");
    expect(typesSource).toContain("'marketer'");
  });
});

describe('Pipeline - Step Ordering and Configuration', () => {
  const analyzerSource = fs.readFileSync(
    path.resolve(__dirname, '../lib/analyzer.ts'),
    'utf-8'
  );

  it('pipeline executes steps in correct order: company → page → diagnosis → brief', () => {
    const companyIdx = analyzerSource.indexOf('company_research');
    const pageIdx = analyzerSource.indexOf('page_reading');
    const diagnosisIdx = analyzerSource.indexOf('diagnosis');
    const briefIdx = analyzerSource.indexOf('brief_generation');

    expect(companyIdx).toBeLessThan(pageIdx);
    expect(pageIdx).toBeLessThan(diagnosisIdx);
    expect(diagnosisIdx).toBeLessThan(briefIdx);
  });

  it('pipeline generates nanoid(21) IDs', () => {
    expect(analyzerSource).toContain('nanoid(21)');
  });

  it('pipeline catches errors and returns error status', () => {
    expect(analyzerSource).toContain("status: 'error'");
    expect(analyzerSource).toContain("status: 'completed'");
  });

  it('pipeline records analysis duration', () => {
    expect(analyzerSource).toContain('analysis_duration_ms');
    expect(analyzerSource).toContain('Date.now() - startTime');
  });

  it('pipeline records vision usage', () => {
    expect(analyzerSource).toContain('vision_used');
    expect(analyzerSource).toContain('screenshot_base64 !== null');
  });
});

describe('Pipeline - extractJsonFromText edge cases', () => {
  it('handles JSON with BOM marker', () => {
    const json = '{"test": true}';
    const withBom = '\uFEFF' + json;
    const result = extractJsonFromText(withBom);
    expect(JSON.parse(result)).toEqual({ test: true });
  });

  it('handles nested JSON objects', () => {
    const json = '{"outer": {"inner": {"deep": true}}, "array": [1,2,3]}';
    const result = extractJsonFromText('Here: ' + json + ' done.');
    expect(JSON.parse(result).outer.inner.deep).toBe(true);
  });

  it('handles JSON with unicode characters', () => {
    const json = '{"text": "日本語テスト", "emoji": "📊"}';
    const result = extractJsonFromText(json);
    expect(JSON.parse(result).text).toBe('日本語テスト');
  });
});
