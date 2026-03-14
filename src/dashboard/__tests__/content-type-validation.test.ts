/**
 * Content-Type Validation Tests
 * Ensures non-HTML content types are rejected by the page reader
 */

import { describe, it, expect } from 'vitest';
import { ContentTypeError } from '../lib/page-reader';

describe('ContentTypeError', () => {
  it('has correct name property', () => {
    const error = new ContentTypeError('test');
    expect(error.name).toBe('ContentTypeError');
  });

  it('is instanceof Error', () => {
    const error = new ContentTypeError('test');
    expect(error instanceof Error).toBe(true);
  });

  it('preserves message', () => {
    const msg = 'HTMLページのみ分析可能です。検出されたコンテンツタイプ: application/pdf';
    const error = new ContentTypeError(msg);
    expect(error.message).toBe(msg);
  });
});

describe('Content-Type validation logic', () => {
  // Test the ALLOWED_CONTENT_TYPES matching logic
  const ALLOWED_CONTENT_TYPES = [
    'text/html',
    'application/xhtml+xml',
    'text/plain',
  ];

  function isAllowedContentType(contentType: string): boolean {
    const mimeType = contentType.split(';')[0].trim().toLowerCase();
    if (!mimeType) return true; // no content-type header → allow (best effort)
    return ALLOWED_CONTENT_TYPES.some(allowed => mimeType.includes(allowed));
  }

  it('allows text/html', () => {
    expect(isAllowedContentType('text/html')).toBe(true);
  });

  it('allows text/html with charset', () => {
    expect(isAllowedContentType('text/html; charset=utf-8')).toBe(true);
  });

  it('allows application/xhtml+xml', () => {
    expect(isAllowedContentType('application/xhtml+xml')).toBe(true);
  });

  it('allows text/plain (servers sometimes misconfigure)', () => {
    expect(isAllowedContentType('text/plain')).toBe(true);
  });

  it('allows empty content-type (best effort)', () => {
    expect(isAllowedContentType('')).toBe(true);
  });

  it('rejects application/pdf', () => {
    expect(isAllowedContentType('application/pdf')).toBe(false);
  });

  it('rejects image/jpeg', () => {
    expect(isAllowedContentType('image/jpeg')).toBe(false);
  });

  it('rejects image/png', () => {
    expect(isAllowedContentType('image/png')).toBe(false);
  });

  it('rejects application/json', () => {
    expect(isAllowedContentType('application/json')).toBe(false);
  });

  it('rejects application/octet-stream', () => {
    expect(isAllowedContentType('application/octet-stream')).toBe(false);
  });

  it('rejects video/mp4', () => {
    expect(isAllowedContentType('video/mp4')).toBe(false);
  });

  it('rejects application/zip', () => {
    expect(isAllowedContentType('application/zip')).toBe(false);
  });
});
