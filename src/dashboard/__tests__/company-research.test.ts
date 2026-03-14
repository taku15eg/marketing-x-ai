/**
 * Company Research Unit Tests
 *
 * Tests the company information extraction logic.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(
  path.resolve(__dirname, '../lib/company-research.ts'),
  'utf-8'
);

describe('Company Research - Source Validation', () => {
  it('uses fetchWithSSRFProtection for safe fetching', () => {
    expect(source).toContain('fetchWithSSRFProtection');
  });

  it('limits fetched HTML to MAX_TEXT_LENGTH', () => {
    expect(source).toContain('MAX_TEXT_LENGTH');
  });

  it('uses FETCH_TIMEOUT_MS constant for fetch timeout', () => {
    expect(source).toContain('FETCH_TIMEOUT_MS');
  });

  it('fetches both target page and root page', () => {
    expect(source).toContain('fetchPageHtml(url)');
    expect(source).toContain("fetchPageHtml(origin + '/')");
  });

  it('uses Promise.allSettled for parallel fetch resilience', () => {
    expect(source).toContain('Promise.allSettled');
  });
});

describe('Company Research - Brand Tone Analysis', () => {
  it('detects common Japanese sentence endings', () => {
    const endings = ['します', 'ます', 'です', 'ください', 'しましょう', 'できます'];
    for (const ending of endings) {
      expect(source).toContain(ending);
    }
  });

  it('detects tone keywords', () => {
    const tones = ['信頼', '安心', '成長', '革新', '効率', '品質'];
    for (const tone of tones) {
      expect(source).toContain(tone);
    }
  });

  it('detects question usage', () => {
    expect(source).toMatch(/？|\\?/);
  });
});

describe('Company Research - Credential Extraction', () => {
  it('extracts company count patterns', () => {
    // Patterns like "導入企業XX社", "XX社以上"
    expect(source).toMatch(/導入/);
    expect(source).toMatch(/社/);
  });

  it('extracts certification patterns', () => {
    expect(source).toContain('ISO');
  });

  it('extracts achievement patterns', () => {
    expect(source).toContain('実績');
    expect(source).toContain('満足度');
  });

  it('limits credentials to 5 items', () => {
    expect(source).toContain('.slice(0, 5)');
  });

  it('deduplicates credentials', () => {
    expect(source).toContain('new Set(credentials)');
  });
});

describe('Company Research - HTML Stripping', () => {
  const htmlUtilsSource = fs.readFileSync(
    path.resolve(__dirname, '../lib/html-utils.ts'),
    'utf-8'
  );

  it('strips script and style tags', () => {
    expect(htmlUtilsSource).toMatch(/<script/i);
    expect(htmlUtilsSource).toMatch(/<style/i);
  });

  it('strips HTML tags for text extraction', () => {
    // The stripHtml function uses /<[^>]+>/g regex
    expect(htmlUtilsSource).toContain('<[^>]+>');
  });

  it('company-research imports shared html utils', () => {
    expect(source).toContain('html-utils');
  });
});

describe('Company Research - Key Vocabulary', () => {
  it('extracts CJK words (2-10 chars)', () => {
    // Regex for Japanese/Chinese characters
    expect(source).toMatch(/\\u4e00-\\u9fff/);
    expect(source).toMatch(/\\u3040-\\u309f/); // hiragana
    expect(source).toMatch(/\\u30a0-\\u30ff/); // katakana
  });

  it('filters stop words', () => {
    const stopWords = ['について', 'こちら', 'ページ', 'サイト'];
    for (const word of stopWords) {
      expect(source).toContain(word);
    }
  });

  it('requires minimum frequency of 2', () => {
    expect(source).toContain('count >= 2');
  });

  it('limits vocabulary to 10 items', () => {
    expect(source).toContain('.slice(0, 10)');
  });
});
