/**
 * Security Test Suite for Publish Gate
 *
 * Validates critical security controls across the application:
 * - SSRF prevention via URL validation
 * - Share URL ID unpredictability
 * - Prompt injection defenses
 * - API key isolation from client code
 * - XSS prevention (no dangerouslySetInnerHTML)
 * - Sensitive file exclusion via .gitignore
 */

import { describe, it, expect } from 'vitest';
import { validateUrl } from '../lib/url-validator';
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// SEC-1 ~ SEC-6: SSRF Prevention - Private/Internal IP Blocking (CRITICAL)
// ---------------------------------------------------------------------------
describe('SSRF Prevention - URL Validator', () => {
  it('SEC-1: rejects localhost URLs (CRITICAL)', () => {
    const result = validateUrl('http://localhost:3000');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('SEC-2: rejects loopback IP 127.0.0.1 (CRITICAL)', () => {
    const result = validateUrl('http://127.0.0.1/admin');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('SEC-3: rejects AWS metadata endpoint 169.254.169.254 (CRITICAL)', () => {
    const result = validateUrl('http://169.254.169.254/latest/meta-data/');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('SEC-4: rejects private IP 10.0.0.1 (CRITICAL)', () => {
    const result = validateUrl('http://10.0.0.1/internal');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('SEC-5: rejects private IP 192.168.1.1 (CRITICAL)', () => {
    const result = validateUrl('http://192.168.1.1');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('SEC-6: rejects IPv6 loopback [::1] (CRITICAL)', () => {
    const result = validateUrl('http://[::1]/');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// SEC-7 ~ SEC-8: Protocol / Scheme Validation (HIGH)
// ---------------------------------------------------------------------------
describe('Protocol and Scheme Validation', () => {
  it('SEC-7: rejects ftp:// protocol (HIGH)', () => {
    const result = validateUrl('ftp://example.com');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('SEC-8: rejects javascript: scheme (HIGH)', () => {
    const result = validateUrl('javascript:alert(1)');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Valid URL acceptance and edge cases
// ---------------------------------------------------------------------------
describe('Valid URL Handling', () => {
  it('accepts valid https:// URLs', () => {
    const result = validateUrl('https://example.com');
    expect(result.valid).toBe(true);
    expect(result.sanitized_url).toBeDefined();
  });

  it('accepts valid http:// URLs to public hosts', () => {
    const result = validateUrl('http://example.com');
    expect(result.valid).toBe(true);
    expect(result.sanitized_url).toBeDefined();
  });

  it('rejects empty string', () => {
    const result = validateUrl('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('adds https:// prefix to URLs without protocol', () => {
    const result = validateUrl('example.com');
    expect(result.valid).toBe(true);
    expect(result.sanitized_url).toContain('https://');
  });
});

// ---------------------------------------------------------------------------
// SEC-9: Share URL ID Format - Unpredictable / Non-Sequential
// ---------------------------------------------------------------------------
describe('SEC-9: Share URL ID Format', () => {
  it('nanoid generates IDs of at least 21 characters', () => {
    const id = nanoid(21);
    expect(id.length).toBeGreaterThanOrEqual(21);
  });

  it('nanoid IDs are not sequential or predictable', () => {
    const ids = Array.from({ length: 100 }, () => nanoid(21));

    // All IDs must be unique
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(100);

    // IDs should not be numeric-only (which would suggest sequential counters)
    for (const id of ids) {
      expect(/^\d+$/.test(id)).toBe(false);
    }

    // IDs should use the nanoid alphabet (URL-safe characters: A-Za-z0-9_-)
    for (const id of ids) {
      expect(/^[A-Za-z0-9_-]+$/.test(id)).toBe(true);
    }
  });

  it('nanoid IDs have sufficient entropy (no common prefixes)', () => {
    const ids = Array.from({ length: 50 }, () => nanoid(21));

    // Check that the first 4 characters vary across IDs (no shared prefix)
    const prefixes = new Set(ids.map((id) => id.slice(0, 4)));
    // With 50 random IDs, we expect many distinct 4-char prefixes
    expect(prefixes.size).toBeGreaterThan(30);
  });
});

// ---------------------------------------------------------------------------
// SEC-10: Prompt Injection Resilience
// ---------------------------------------------------------------------------
describe('SEC-10: Prompt Injection Resilience', () => {
  it('prompt builder wraps page content in <page_content> XML tags', () => {
    const promptBuilderPath = path.resolve(
      __dirname,
      '../lib/prompt-builder.ts'
    );
    const source = fs.readFileSync(promptBuilderPath, 'utf-8');

    expect(source).toContain('<page_content>');
    expect(source).toContain('</page_content>');
  });

  it('system prompt declares page_content as user data, not instructions', () => {
    const promptBuilderPath = path.resolve(
      __dirname,
      '../lib/prompt-builder.ts'
    );
    const source = fs.readFileSync(promptBuilderPath, 'utf-8');

    // The system prompt must instruct the model that page_content is data
    expect(source).toMatch(/page_content.*指示ではありません/s);
  });
});

// ---------------------------------------------------------------------------
// SEC-11: API Key Not Exposed in Client Code
// ---------------------------------------------------------------------------
describe('SEC-11: API Key Client Isolation', () => {
  it('no file under app/ contains the literal string ANTHROPIC_API_KEY', () => {
    const appDir = path.resolve(__dirname, '../app');
    const files = collectFiles(appDir, ['.ts', '.tsx', '.js', '.jsx']);

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(appDir, filePath);

      // Only server-side route handlers (route.ts) are allowed to reference
      // ANTHROPIC_API_KEY via process.env. Client components must not.
      if (relativePath.includes('route.ts') || relativePath.includes('route.js')) {
        continue;
      }

      expect(
        content.includes('ANTHROPIC_API_KEY'),
        `ANTHROPIC_API_KEY found in client file: app/${relativePath}`
      ).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// SEC-12: No dangerouslySetInnerHTML Usage
// ---------------------------------------------------------------------------
describe('SEC-12: XSS Prevention - No dangerouslySetInnerHTML', () => {
  it('no file under app/ contains dangerouslySetInnerHTML', () => {
    const appDir = path.resolve(__dirname, '../app');
    const files = collectFiles(appDir, ['.ts', '.tsx', '.js', '.jsx']);

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(appDir, filePath);

      expect(
        content.includes('dangerouslySetInnerHTML'),
        `dangerouslySetInnerHTML found in: app/${relativePath}`
      ).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// SEC-13: .gitignore Contains .env.local
// ---------------------------------------------------------------------------
describe('SEC-13: Gitignore Protects Environment Files', () => {
  it('.gitignore contains .env.local', () => {
    const gitignorePath = path.resolve(__dirname, '../.gitignore');
    const content = fs.readFileSync(gitignorePath, 'utf-8');

    expect(content).toContain('.env.local');
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Recursively collects all files under `dir` that match the given extensions.
 */
function collectFiles(dir: string, extensions: string[]): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }

  return results;
}
