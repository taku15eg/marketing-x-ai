// Shared HTML utility functions used by company-research and page-reader

/**
 * Strip script/style tags and HTML tags from content
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitize HTML by removing dangerous elements (scripts, styles, event handlers)
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
}

/**
 * Mask PII (Personally Identifiable Information) in text before sending to AI.
 * Replaces email addresses, phone numbers, and physical addresses with placeholders.
 */
export function maskPII(text: string): string {
  return text
    // Email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
    // Credit card-like numbers (13-19 digits with optional separators) — must run BEFORE phone/postal
    .replace(/\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{1,7}/g, '[CARD]')
    // Japanese phone numbers: 090-1234-5678, 03-1234-5678, 0120-123-456, etc.
    .replace(/(?:0\d{1,4}[-\s.]?\d{1,4}[-\s.]?\d{3,4})/g, '[PHONE]')
    // Japanese postal codes: 〒123-4567 or 123-4567
    .replace(/〒?\s*\d{3}[-‐ー]\d{4}/g, '[POSTAL]');
}
