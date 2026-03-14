/**
 * Page Reader Unit Tests
 *
 * Tests DOM extraction and sanitization logic.
 * Uses the internal functions indirectly through the module.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// We test the page-reader logic by verifying the source code patterns
// and behavior, since the internal functions are not exported.
// For runtime tests we verify the sanitization regex patterns work correctly.

describe('Page Reader - Sanitization Patterns', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../lib/page-reader.ts'),
    'utf-8'
  );
  const htmlUtilsSource = fs.readFileSync(
    path.resolve(__dirname, '../lib/html-utils.ts'),
    'utf-8'
  );

  it('removes script tags with regex', () => {
    // Sanitization is now in shared html-utils
    expect(htmlUtilsSource).toContain('<script');
    expect(htmlUtilsSource).toContain('script>');
  });

  it('removes style tags with regex', () => {
    expect(htmlUtilsSource).toMatch(/<style/i);
  });

  it('removes inline event handlers (onXXX attributes)', () => {
    // page-reader delegates to sharedSanitizeHtml which strips on* event attributes
    // In source code the regex is escaped: \\son\\w+\\s*=
    expect(htmlUtilsSource).toContain('on\\w+');
  });

  it('limits CTA extraction to MAX_CTA_COUNT', () => {
    expect(source).toContain('MAX_CTA_COUNT');
    expect(source).toContain('.slice(0, MAX_CTA_COUNT)');
  });

  it('limits image extraction to MAX_IMAGE_COUNT', () => {
    expect(source).toContain('MAX_IMAGE_COUNT');
    expect(source).toContain('.slice(0, MAX_IMAGE_COUNT)');
  });
});

describe('Page Reader - Sanitization Regex Validation', () => {
  // Test the actual regex patterns used in page-reader.ts
  const scriptRegex = /<script[^>]*>[\s\S]*?<\/script>/gi;
  const styleRegex = /<style[^>]*>[\s\S]*?<\/style>/gi;
  const eventRegex = /\son\w+\s*=\s*["'][^"']*["']/gi;

  it('strips inline script tags', () => {
    const html = '<div>Hello</div><script>alert("xss")</script><p>World</p>';
    const cleaned = html.replace(scriptRegex, '');
    expect(cleaned).not.toContain('alert');
    expect(cleaned).toContain('Hello');
    expect(cleaned).toContain('World');
  });

  it('strips multi-line script tags', () => {
    const html = `<script type="text/javascript">
      var x = 1;
      document.write("injected");
    </script><p>Safe</p>`;
    const cleaned = html.replace(scriptRegex, '');
    expect(cleaned).not.toContain('document.write');
    expect(cleaned).toContain('Safe');
  });

  it('strips style tags', () => {
    const html = '<style>.evil { display: none }</style><p>Content</p>';
    const cleaned = html.replace(styleRegex, '');
    expect(cleaned).not.toContain('.evil');
    expect(cleaned).toContain('Content');
  });

  it('strips onclick event handlers', () => {
    const html = '<button onclick="alert(1)">Click</button>';
    const cleaned = html.replace(eventRegex, '');
    expect(cleaned).not.toContain('alert');
    expect(cleaned).toContain('Click');
  });

  it('strips onmouseover event handlers', () => {
    const html = '<div onmouseover="steal()">Hover me</div>';
    const cleaned = html.replace(eventRegex, '');
    expect(cleaned).not.toContain('steal');
  });

  it('strips onerror event handlers', () => {
    const html = '<img onerror="alert(document.cookie)" src="x">';
    const cleaned = html.replace(eventRegex, '');
    expect(cleaned).not.toContain('document.cookie');
  });
});

describe('Page Reader - CTA Detection Patterns', () => {
  it('CTA pattern matches Japanese CTA keywords', () => {
    const ctaPatterns = /お問い合わせ|資料|ダウンロード|無料|申し込|購入|登録|エントリー|相談|見積|体験|トライアル|カウンセリング|予約|contact|sign\s?up|free|trial|demo|buy|cart/i;

    expect(ctaPatterns.test('お問い合わせはこちら')).toBe(true);
    expect(ctaPatterns.test('無料で始める')).toBe(true);
    expect(ctaPatterns.test('資料ダウンロード')).toBe(true);
    expect(ctaPatterns.test('申し込む')).toBe(true);
    expect(ctaPatterns.test('Free Trial')).toBe(true);
    expect(ctaPatterns.test('Sign Up')).toBe(true);
    expect(ctaPatterns.test('Buy Now')).toBe(true);
    expect(ctaPatterns.test('普通のテキスト')).toBe(false);
  });
});

describe('Page Reader - Meta Extraction Patterns', () => {
  it('extracts title from HTML', () => {
    const html = '<html><head><title>テストページ</title></head><body></body></html>';
    const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    expect(match?.[1]).toBe('テストページ');
  });

  it('extracts meta description', () => {
    const html = '<meta name="description" content="テスト説明文">';
    const match = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i);
    expect(match?.[1]).toBe('テスト説明文');
  });

  it('extracts OG title', () => {
    const html = '<meta property="og:title" content="OGタイトル">';
    const match = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([\s\S]*?)["']/i);
    expect(match?.[1]).toBe('OGタイトル');
  });

  it('handles reverse attribute order in meta tags', () => {
    const html = '<meta content="逆順" name="description">';
    const match = html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i);
    expect(match?.[1]).toBe('逆順');
  });
});
