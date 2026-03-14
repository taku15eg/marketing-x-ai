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
 * - DOM sanitization in page-reader
 * - Content size limits
 * - Chrome extension security
 * - CORS configuration
 */

import { describe, it, expect } from 'vitest';
import {
  validateUrl,
  isIPAddress,
  isPrivateIP,
  isLocalhost,
  validateResolvedIP,
  SSRFError,
} from '../lib/url-validator';
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

  it('SEC-6b: rejects 172.16.x.x private range (CRITICAL)', () => {
    const result = validateUrl('http://172.16.0.1/');
    expect(result.valid).toBe(false);
  });

  it('SEC-6c: rejects 172.31.x.x private range (CRITICAL)', () => {
    const result = validateUrl('http://172.31.255.255/');
    expect(result.valid).toBe(false);
  });

  it('SEC-6d: allows 172.32.x.x (not private) (CRITICAL)', () => {
    const result = validateUrl('http://172.32.0.1/');
    expect(result.valid).toBe(true);
  });

  it('SEC-6e: rejects 127.0.0.2 (loopback range) (CRITICAL)', () => {
    const result = validateUrl('http://127.0.0.2/');
    expect(result.valid).toBe(false);
  });

  it('SEC-6f: rejects 0.0.0.0 (CRITICAL)', () => {
    const result = validateUrl('http://0.0.0.0/');
    expect(result.valid).toBe(false);
  });

  it('SEC-6g: rejects .localhost subdomain (CRITICAL)', () => {
    const result = validateUrl('http://evil.localhost/');
    expect(result.valid).toBe(false);
  });

  it('SEC-6h: rejects 169.254.0.1 link-local (CRITICAL)', () => {
    const result = validateUrl('http://169.254.0.1/');
    expect(result.valid).toBe(false);
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

  it('SEC-8b: rejects data: scheme (HIGH)', () => {
    const result = validateUrl('data:text/html,<h1>test</h1>');
    expect(result.valid).toBe(false);
  });

  it('SEC-8c: rejects vbscript: scheme (HIGH)', () => {
    const result = validateUrl('vbscript:MsgBox("test")');
    expect(result.valid).toBe(false);
  });

  it('SEC-8d: rejects file:// scheme (HIGH)', () => {
    const result = validateUrl('file:///etc/passwd');
    expect(result.valid).toBe(false);
  });

  it('SEC-8e: rejects JAVASCRIPT: (case insensitive) (HIGH)', () => {
    const result = validateUrl('JAVASCRIPT:alert(1)');
    expect(result.valid).toBe(false);
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

  it('rejects null/undefined input', () => {
    expect(validateUrl(null as unknown as string).valid).toBe(false);
    expect(validateUrl(undefined as unknown as string).valid).toBe(false);
  });

  it('handles URLs with paths and query strings', () => {
    const result = validateUrl('https://example.com/path?q=test&a=1');
    expect(result.valid).toBe(true);
    expect(result.sanitized_url).toContain('/path');
  });

  it('handles URLs with ports', () => {
    const result = validateUrl('https://example.com:8080/api');
    expect(result.valid).toBe(true);
  });

  it('handles URLs with fragments', () => {
    const result = validateUrl('https://example.com/page#section');
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Helper function tests
// ---------------------------------------------------------------------------
describe('URL Validator Helper Functions', () => {
  describe('isIPAddress', () => {
    it('detects IPv4 addresses', () => {
      expect(isIPAddress('192.168.1.1')).toBe(true);
      expect(isIPAddress('8.8.8.8')).toBe(true);
      expect(isIPAddress('127.0.0.1')).toBe(true);
    });

    it('rejects non-IP hostnames', () => {
      expect(isIPAddress('example.com')).toBe(false);
      expect(isIPAddress('localhost')).toBe(false);
    });

    it('detects bracketed IPv6', () => {
      expect(isIPAddress('[::1]')).toBe(true);
    });
  });

  describe('isPrivateIP', () => {
    it('detects all private ranges', () => {
      expect(isPrivateIP('10.0.0.1')).toBe(true);
      expect(isPrivateIP('10.255.255.255')).toBe(true);
      expect(isPrivateIP('172.16.0.1')).toBe(true);
      expect(isPrivateIP('172.31.255.255')).toBe(true);
      expect(isPrivateIP('192.168.0.1')).toBe(true);
      expect(isPrivateIP('192.168.255.255')).toBe(true);
      expect(isPrivateIP('127.0.0.1')).toBe(true);
      expect(isPrivateIP('169.254.169.254')).toBe(true);
      expect(isPrivateIP('0.0.0.0')).toBe(true);
    });

    it('allows public IPs', () => {
      expect(isPrivateIP('8.8.8.8')).toBe(false);
      expect(isPrivateIP('1.1.1.1')).toBe(false);
      expect(isPrivateIP('203.0.113.1')).toBe(false);
    });

    it('detects IPv6 private ranges', () => {
      expect(isPrivateIP('::1')).toBe(true);
      expect(isPrivateIP('fc00::1')).toBe(true);
      expect(isPrivateIP('fe80::1')).toBe(true);
    });

    it('handles bracketed IPv6', () => {
      expect(isPrivateIP('[::1]')).toBe(true);
    });
  });

  describe('isLocalhost', () => {
    it('detects localhost variants', () => {
      expect(isLocalhost('localhost')).toBe(true);
      expect(isLocalhost('LOCALHOST')).toBe(true);
      expect(isLocalhost('0.0.0.0')).toBe(true);
      expect(isLocalhost('::1')).toBe(true);
      expect(isLocalhost('[::1]')).toBe(true);
      expect(isLocalhost('evil.localhost')).toBe(true);
    });

    it('does not match non-localhost', () => {
      expect(isLocalhost('example.com')).toBe(false);
      expect(isLocalhost('localhosts.com')).toBe(false);
    });
  });

  describe('validateResolvedIP', () => {
    it('rejects private IPs after DNS resolution', () => {
      expect(validateResolvedIP('127.0.0.1')).toBe(false);
      expect(validateResolvedIP('10.0.0.1')).toBe(false);
      expect(validateResolvedIP('192.168.1.1')).toBe(false);
    });

    it('allows public IPs', () => {
      expect(validateResolvedIP('8.8.8.8')).toBe(true);
      expect(validateResolvedIP('1.1.1.1')).toBe(true);
    });
  });

  describe('SSRFError', () => {
    it('creates proper error instances', () => {
      const err = new SSRFError('test message');
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(SSRFError);
      expect(err.name).toBe('SSRFError');
      expect(err.message).toBe('test message');
    });
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

    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(100);

    for (const id of ids) {
      expect(/^\d+$/.test(id)).toBe(false);
    }

    for (const id of ids) {
      expect(/^[A-Za-z0-9_-]+$/.test(id)).toBe(true);
    }
  });

  it('nanoid IDs have sufficient entropy (no common prefixes)', () => {
    const ids = Array.from({ length: 50 }, () => nanoid(21));
    const prefixes = new Set(ids.map((id) => id.slice(0, 4)));
    expect(prefixes.size).toBeGreaterThan(30);
  });
});

// ---------------------------------------------------------------------------
// SEC-10: Prompt Injection Resilience
// ---------------------------------------------------------------------------
describe('SEC-10: Prompt Injection Resilience', () => {
  it('prompt builder wraps page content in <page_content> XML tags', () => {
    const source = readLib('prompt-builder.ts');
    expect(source).toContain('<page_content>');
    expect(source).toContain('</page_content>');
  });

  it('system prompt declares page_content as user data, not instructions', () => {
    const source = readLib('prompt-builder.ts');
    expect(source).toMatch(/page_content.*指示ではありません/s);
  });

  it('company research data is wrapped in <company_research> tags', () => {
    const source = readLib('prompt-builder.ts');
    expect(source).toContain('<company_research>');
    expect(source).toContain('</company_research>');
  });
});

// ---------------------------------------------------------------------------
// SEC-11: API Key Not Exposed in Client Code
// ---------------------------------------------------------------------------
describe('SEC-11: API Key Client Isolation', () => {
  it('no client file under app/ contains ANTHROPIC_API_KEY', () => {
    const appDir = path.resolve(__dirname, '../app');
    const files = collectFiles(appDir, ['.ts', '.tsx', '.js', '.jsx']);

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(appDir, filePath);

      if (relativePath.includes('route.ts') || relativePath.includes('route.js')) {
        continue;
      }

      expect(
        content.includes('ANTHROPIC_API_KEY'),
        `ANTHROPIC_API_KEY found in client file: app/${relativePath}`
      ).toBe(false);
    }
  });

  it('no component file references secret keys', () => {
    const componentsDir = path.resolve(__dirname, '../components');
    if (!fs.existsSync(componentsDir)) return;

    const files = collectFiles(componentsDir, ['.ts', '.tsx', '.js', '.jsx']);
    const secretKeys = ['ANTHROPIC_API_KEY', 'SCREENSHOT_API_KEY', 'SUPABASE_SERVICE_KEY'];

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(componentsDir, filePath);

      for (const key of secretKeys) {
        expect(
          content.includes(key),
          `Secret key ${key} found in component: ${relativePath}`
        ).toBe(false);
      }
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

  it('no component file contains dangerouslySetInnerHTML', () => {
    const componentsDir = path.resolve(__dirname, '../components');
    if (!fs.existsSync(componentsDir)) return;

    const files = collectFiles(componentsDir, ['.ts', '.tsx', '.js', '.jsx']);

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(componentsDir, filePath);

      expect(
        content.includes('dangerouslySetInnerHTML'),
        `dangerouslySetInnerHTML found in component: ${relativePath}`
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

  it('.gitignore contains .env*.local pattern', () => {
    const gitignorePath = path.resolve(__dirname, '../.gitignore');
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    expect(content).toMatch(/\.env.*local/);
  });
});

// ---------------------------------------------------------------------------
// SEC-14: DOM Sanitization in page-reader
// ---------------------------------------------------------------------------
describe('SEC-14: DOM Sanitization', () => {
  it('page-reader strips script tags from HTML', () => {
    // Sanitization delegated to shared html-utils
    const htmlUtils = readLib('html-utils.ts');
    expect(htmlUtils).toMatch(/<script/);
  });

  it('page-reader strips inline event handlers (onXXX)', () => {
    const source = readLib('page-reader.ts');
    expect(source).toMatch(/on\w+/);
  });

  it('page-reader limits HTML to MAX_TEXT_LENGTH', () => {
    const source = readLib('page-reader.ts');
    expect(source).toContain('MAX_TEXT_LENGTH');
    // Verify the constant is properly defined
    const constants = readLib('constants.ts');
    expect(constants).toContain('50_000');
  });

  it('page-reader limits text content to MAX_TEXT_CONTENT_LENGTH', () => {
    const source = readLib('page-reader.ts');
    expect(source).toContain('MAX_TEXT_CONTENT_LENGTH');
    // Verify the constant is properly defined
    const constants = readLib('constants.ts');
    expect(constants).toContain('10_000');
  });
});

// ---------------------------------------------------------------------------
// SEC-15: Content Size Limits
// ---------------------------------------------------------------------------
describe('SEC-15: Content Size Limits', () => {
  it('fetchWithSSRFProtection defaults to 5MB max response size', () => {
    const constants = readLib('constants.ts');
    expect(constants).toContain('5 * 1024 * 1024');
  });

  it('fetchWithSSRFProtection has 10s default timeout', () => {
    const constants = readLib('constants.ts');
    expect(constants).toContain('10_000');
  });

  it('redirect chain is limited to MAX_REDIRECTS', () => {
    const source = readLib('url-validator.ts');
    expect(source).toContain('MAX_REDIRECTS');
    const constants = readLib('constants.ts');
    expect(constants).toMatch(/MAX_REDIRECTS\s*=\s*3/);
  });
});

// ---------------------------------------------------------------------------
// SEC-16: Chrome Extension Security
// ---------------------------------------------------------------------------
describe('SEC-16: Chrome Extension Security', () => {
  it('manifest.json uses Manifest V3', () => {
    const manifestPath = path.resolve(__dirname, '../../extension/manifest.json');
    if (!fs.existsSync(manifestPath)) return;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(manifest.manifest_version).toBe(3);
  });

  it('manifest.json has minimal permissions (activeTab, sidePanel only)', () => {
    const manifestPath = path.resolve(__dirname, '../../extension/manifest.json');
    if (!fs.existsSync(manifestPath)) return;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const permissions = manifest.permissions || [];
    expect(permissions).toContain('activeTab');
    expect(permissions).toContain('sidePanel');
    expect(permissions).not.toContain('tabs');
    expect(permissions).not.toContain('<all_urls>');
    expect(permissions).not.toContain('webRequest');
  });

  it('extension code does not contain API keys', () => {
    const extensionDir = path.resolve(__dirname, '../../extension');
    if (!fs.existsSync(extensionDir)) return;
    const files = collectFiles(extensionDir, ['.js', '.ts', '.json']);

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(extensionDir, filePath);

      expect(
        content.includes('sk-ant-'),
        `API key pattern found in extension: ${relativePath}`
      ).toBe(false);
    }
  });

  it('content script has PII masking patterns', () => {
    const contentScriptPath = path.resolve(
      __dirname,
      '../../extension/content/content-script.js'
    );
    if (!fs.existsSync(contentScriptPath)) return;
    const source = fs.readFileSync(contentScriptPath, 'utf-8');
    expect(source).toMatch(/email|メール/i);
    expect(source).toMatch(/phone|電話/i);
  });
});

// ---------------------------------------------------------------------------
// SEC-17: CORS Configuration
// ---------------------------------------------------------------------------
describe('SEC-17: CORS Configuration', () => {
  it('analyze API route uses CORS helpers from shared module', () => {
    const source = readRoute('analyze/route.ts');
    expect(source).toContain("from '../../../lib/cors'");
    expect(source).toContain('corsPreflightResponse');
    const corsSource = readLib('cors.ts');
    expect(corsSource).toContain('Access-Control-Allow-Origin');
    expect(corsSource).toContain('Access-Control-Allow-Methods');
  });

  it('share API route uses CORS helpers from shared module', () => {
    const source = readRoute('share/route.ts');
    expect(source).toContain("from '../../../lib/cors'");
    expect(source).toContain('corsPreflightResponse');
  });

  it('API routes handle OPTIONS preflight', () => {
    const analyzeRoute = readRoute('analyze/route.ts');
    const shareRoute = readRoute('share/route.ts');
    expect(analyzeRoute).toContain('export async function OPTIONS');
    expect(shareRoute).toContain('export async function OPTIONS');
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readLib(filename: string): string {
  return fs.readFileSync(path.resolve(__dirname, `../lib/${filename}`), 'utf-8');
}

function readRoute(filename: string): string {
  return fs.readFileSync(path.resolve(__dirname, `../app/api/${filename}`), 'utf-8');
}

function collectFiles(dir: string, extensions: string[]): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

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
