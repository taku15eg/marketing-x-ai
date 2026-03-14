/**
 * Prompt Builder Unit Tests
 *
 * Tests the prompt construction and response parsing logic.
 * Normalization/parsing logic has moved to shared/normalize.ts — tested there.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(
  path.resolve(__dirname, '../lib/prompt-builder.ts'),
  'utf-8'
);

const normalizeSource = fs.readFileSync(
  path.resolve(__dirname, '../../shared/normalize.ts'),
  'utf-8'
);

describe('Prompt Builder - System Prompt', () => {
  it('includes role definition as LP analysis engine', () => {
    expect(source).toContain('課題をインパクト順に構造化');
  });

  it('prohibits copy text generation', () => {
    expect(source).toContain('コピー文言は出さず');
  });

  it('includes regulatory check instructions (薬機法)', () => {
    expect(source).toContain('薬機法');
    expect(source).toContain('効果効能');
  });

  it('includes regulatory check instructions (景品表示法)', () => {
    expect(source).toContain('景品表示法');
    expect(source).toContain('優良誤認');
  });

  it('specifies JSON output format', () => {
    expect(source).toContain('JSON出力のみ');
  });

  it('includes CRO principles', () => {
    expect(source).toContain('FV3秒ルール');
    expect(source).toContain('CTA近接性');
  });

  it('warns against baseless speculation', () => {
    expect(source).toContain('根拠のない推測');
  });
});

describe('Prompt Builder - User Content Construction', () => {
  it('wraps page content in XML tags for injection defense', () => {
    expect(source).toContain("'<page_content>'");
    expect(source).toContain("'</page_content>'");
  });

  it('wraps company research in XML tags', () => {
    expect(source).toContain("'<company_research>'");
    expect(source).toContain("'</company_research>'");
  });

  it('includes DOM data: title, meta, headings, CTAs, images', () => {
    expect(source).toContain('params.dom.title');
    expect(source).toContain('params.dom.meta_description');
    expect(source).toContain('params.dom.headings');
    expect(source).toContain('params.dom.ctas');
    expect(source).toContain('params.dom.images');
  });

  it('includes screenshot as base64 image when available', () => {
    expect(source).toContain("type: 'image'");
    expect(source).toContain("media_type: 'image/jpeg'");
    expect(source).toContain('screenshot_base64');
  });

  it('adds screenshot analysis instruction', () => {
    expect(source).toContain('ファーストビューのスクリーンショット');
  });
});

describe('Prompt Builder - Claude API Configuration', () => {
  it('uses the correct API endpoint', () => {
    expect(source).toContain('https://api.anthropic.com/v1/messages');
  });

  it('sets max_tokens to 4096', () => {
    expect(source).toContain('4096');
  });

  it('requires ANTHROPIC_API_KEY from env', () => {
    expect(source).toContain('process.env.ANTHROPIC_API_KEY');
  });

  it('sends anthropic-version header', () => {
    expect(source).toContain("'anthropic-version'");
  });
});

describe('Prompt Builder - Response Parsing (delegated to shared normalizer)', () => {
  it('uses shared extractJsonFromResponse for code block handling', () => {
    expect(source).toContain('extractJsonFromResponse');
  });

  it('uses shared normalizeAnalysisResult for normalization', () => {
    expect(source).toContain('normalizeAnalysisResult');
  });

  it('shared normalizer handles issue priority sorting', () => {
    expect(normalizeSource).toContain('.sort((a, b) => a.priority - b.priority)');
  });

  it('shared normalizer handles regulatory data', () => {
    expect(normalizeSource).toContain('yakujiho_risks');
    expect(normalizeSource).toContain('keihinhyoujiho_risks');
  });

  it('passes source and vision_used to normalizer', () => {
    expect(source).toContain("source: 'dashboard'");
    expect(source).toContain('vision_used: visionUsed');
  });
});
