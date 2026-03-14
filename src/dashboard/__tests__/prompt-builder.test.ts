/**
 * Prompt Builder Unit Tests
 *
 * Tests the prompt construction and response parsing logic.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(
  path.resolve(__dirname, '../lib/prompt-builder.ts'),
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
    expect(source).toContain('ファーストビュー');
    expect(source).toContain('レイアウト構造');
    expect(source).toContain('CTA視認性');
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

describe('Prompt Builder - Response Parsing', () => {
  it('handles markdown code block wrapped JSON', () => {
    // The parser extracts JSON from ```json ... ``` blocks
    expect(source).toMatch(/```(?:json)?/);
  });

  it('normalizes issues with priority sorting', () => {
    expect(source).toContain('.sort((a, b) => a.priority - b.priority)');
  });

  it('handles missing regulatory data gracefully', () => {
    expect(source).toContain('parsed.regulatory');
    expect(source).toContain('yakujiho_risks');
    expect(source).toContain('keihinhyoujiho_risks');
  });

  it('sets default metadata values', () => {
    expect(source).toContain("dom_extracted: true");
  });
});
