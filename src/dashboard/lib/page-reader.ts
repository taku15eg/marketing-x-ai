// Step 2: Page Reader
// DOM extraction + Screenshot capture via Vision API

import { fetchWithSSRFProtection } from './url-validator';
import { stripHtml as sharedStripHtml, sanitizeHtml as sharedSanitizeHtml } from './html-utils';
import type { DOMData, CTAInfo } from './types';

export class ContentTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContentTypeError';
  }
}

export class EmptyDOMError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmptyDOMError';
  }
}

const ALLOWED_CONTENT_TYPES = [
  'text/html',
  'application/xhtml+xml',
  'text/plain', // some servers misconfigure this for HTML
];

export async function readPage(url: string): Promise<{
  dom: DOMData;
  screenshot_base64: string | null;
  raw_html: string;
  warnings: string[];
}> {
  // Fetch the page HTML
  const response = await fetchWithSSRFProtection(url, { timeout: 10000, maxSize: 5 * 1024 * 1024 });

  // Validate content-type: only allow HTML-like content
  const contentType = response.headers.get('content-type') || '';
  const mimeType = contentType.split(';')[0].trim().toLowerCase();
  if (mimeType && !ALLOWED_CONTENT_TYPES.some(allowed => mimeType.includes(allowed))) {
    throw new ContentTypeError(
      `HTMLページのみ分析可能です。検出されたコンテンツタイプ: ${mimeType}`
    );
  }

  // Check for auth-required responses
  if (response.status === 401 || response.status === 403) {
    throw new ContentTypeError(
      'このページは認証が必要なため、分析できませんでした'
    );
  }

  const html = await response.text();
  const limitedHtml = html.slice(0, 50000);
  const warnings: string[] = [];

  // Extract DOM data
  const dom = extractDOMData(limitedHtml, url);

  // Check for empty DOM (SPA or auth wall)
  const hasContent = dom.headings.h1.length > 0 || dom.headings.h2.length > 0 || dom.ctas.length > 0 || dom.text_content.length > 200;
  if (!hasContent) {
    warnings.push('ページコンテンツの取得が不十分でした。SPAや認証が必要なページの可能性があります。');
  }

  // Capture screenshot via external service
  const screenshot_base64 = await captureScreenshot(url);

  return { dom, screenshot_base64, raw_html: limitedHtml, warnings };
}

function extractDOMData(html: string, url: string): DOMData {
  // Sanitize: remove script tags and event handlers
  const sanitized = sanitizeHtml(html);

  // Extract meta
  const title = extractTag(sanitized, 'title') || '';
  const metaDesc = extractMeta(sanitized, 'description') || '';
  const ogTitle = extractOGMeta(sanitized, 'og:title') || '';
  const ogDesc = extractOGMeta(sanitized, 'og:description') || '';
  const ogImage = extractOGMeta(sanitized, 'og:image') || '';
  const canonical = extractLink(sanitized, 'canonical') || url;

  // Extract headings
  const h1 = extractAllTags(sanitized, 'h1');
  const h2 = extractAllTags(sanitized, 'h2');
  const h3 = extractAllTags(sanitized, 'h3');

  // Extract CTAs
  const ctas = extractCTAs(sanitized);

  // Extract images
  const images = extractImages(sanitized);

  // Extract text content
  const textContent = stripHtml(sanitized).slice(0, 10000);
  const wordCount = textContent.length;
  const linkCount = (sanitized.match(/<a\s/gi) || []).length;

  return {
    title,
    meta_description: metaDesc,
    og_title: ogTitle,
    og_description: ogDesc,
    og_image: ogImage,
    canonical,
    headings: { h1, h2, h3 },
    ctas,
    images,
    text_content: textContent,
    word_count: wordCount,
    link_count: linkCount,
  };
}

function sanitizeHtml(html: string): string {
  return sharedSanitizeHtml(html);
}

function extractTag(html: string, tag: string): string | null {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? stripHtml(match[1]).trim() : null;
}

function extractAllTags(html: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi');
  const results: string[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = stripHtml(match[1]).trim();
    if (text) results.push(text);
  }
  return results;
}

function extractMeta(html: string, name: string): string | null {
  const match = html.match(
    new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([\\s\\S]*?)["']`, 'i')
  );
  if (match) return match[1];
  const match2 = html.match(
    new RegExp(`<meta[^>]*content=["']([\\s\\S]*?)["'][^>]*name=["']${name}["']`, 'i')
  );
  return match2 ? match2[1] : null;
}

function extractOGMeta(html: string, property: string): string | null {
  const match = html.match(
    new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([\\s\\S]*?)["']`, 'i')
  );
  if (match) return match[1];
  const match2 = html.match(
    new RegExp(`<meta[^>]*content=["']([\\s\\S]*?)["'][^>]*property=["']${property}["']`, 'i')
  );
  return match2 ? match2[1] : null;
}

function extractLink(html: string, rel: string): string | null {
  const match = html.match(
    new RegExp(`<link[^>]*rel=["']${rel}["'][^>]*href=["']([\\s\\S]*?)["']`, 'i')
  );
  if (match) return match[1];
  const match2 = html.match(
    new RegExp(`<link[^>]*href=["']([\\s\\S]*?)["'][^>]*rel=["']${rel}["']`, 'i')
  );
  return match2 ? match2[1] : null;
}

function extractCTAs(html: string): CTAInfo[] {
  const ctas: CTAInfo[] = [];

  // Links with button-like text
  const linkRegex = /<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const text = stripHtml(match[2]).trim();
    if (!text || text.length > 50) continue;

    const ctaPatterns = /お問い合わせ|資料請求|資料|ダウンロード|無料|申し込|購入|登録|エントリー|相談|見積|体験|トライアル|カウンセリング|予約|始める|導入|詳しく|今すぐ|特典|限定|キャンペーン|お試し|デモ|見学|参加|入会|契約|お申込|ご相談|contact|sign\s?up|free|trial|demo|buy|cart|get\s?started|subscribe|book|order/i;
    if (ctaPatterns.test(text) || ctaPatterns.test(href)) {
      ctas.push({
        text,
        href,
        position: estimatePosition(html, match.index),
        prominence: estimateProminence(match[0]),
      });
    }
  }

  // Buttons
  const buttonRegex = /<button[^>]*>([\s\S]*?)<\/button>/gi;
  while ((match = buttonRegex.exec(html)) !== null) {
    const text = stripHtml(match[1]).trim();
    if (text && text.length <= 50) {
      ctas.push({
        text,
        href: '',
        position: estimatePosition(html, match.index),
        prominence: 'primary',
      });
    }
  }

  return ctas.slice(0, 20);
}

function estimatePosition(html: string, index: number): string {
  const ratio = index / html.length;
  if (ratio < 0.15) return 'header';
  if (ratio < 0.35) return 'fv';
  if (ratio < 0.7) return 'middle';
  return 'footer';
}

function estimateProminence(tag: string): 'primary' | 'secondary' | 'tertiary' {
  if (/class=["'][^"']*(primary|main|hero|cta|btn-lg)/i.test(tag)) return 'primary';
  if (/class=["'][^"']*(secondary|outline|ghost)/i.test(tag)) return 'secondary';
  return 'tertiary';
}

function extractImages(html: string): { alt: string; width: number; height: number }[] {
  const images: { alt: string; width: number; height: number }[] = [];
  const imgRegex = /<img[^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const alt = match[0].match(/alt=["'](.*?)["']/i)?.[1] || '';
    const width = parseInt(match[0].match(/width=["']?(\d+)/i)?.[1] || '0');
    const height = parseInt(match[0].match(/height=["']?(\d+)/i)?.[1] || '0');
    images.push({ alt, width, height });
  }
  return images.slice(0, 50);
}

function stripHtml(html: string): string {
  return sharedStripHtml(html);
}

/**
 * Capture screenshot using a headless browser API.
 * In production, this would use Puppeteer/Playwright on a server
 * or a screenshot API like screenshotapi.net / urlbox.io
 * Returns base64-encoded image or null on failure.
 */
async function captureScreenshot(url: string): Promise<string | null> {
  // Use a public screenshot API endpoint
  // In production, replace with self-hosted Puppeteer or paid API
  try {
    const screenshotUrl = `https://api.screenshotone.com/take?url=${encodeURIComponent(url)}&viewport_width=1280&viewport_height=800&format=jpeg&quality=80`;

    // Check if we have an API key
    const apiKey = process.env.SCREENSHOT_API_KEY;
    if (!apiKey) {
      // Fallback: return null, analysis will rely on DOM only
      console.warn('SCREENSHOT_API_KEY not set, skipping screenshot capture');
      return null;
    }

    const response = await fetch(
      `${screenshotUrl}&access_key=${apiKey}`,
      { signal: AbortSignal.timeout(15000) }
    );

    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return base64;
  } catch {
    console.warn('Screenshot capture failed, continuing with DOM analysis only');
    return null;
  }
}
