// SSRF Defense - URL Validator
// CRITICAL security component: validates URLs before server-side fetch

import { MAX_REDIRECTS } from './constants';

const PRIVATE_IP_RANGES = [
  // IPv4
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,        // 127.0.0.0/8
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,          // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/, // 172.16.0.0/12
  /^192\.168\.\d{1,3}\.\d{1,3}$/,             // 192.168.0.0/16
  /^169\.254\.\d{1,3}\.\d{1,3}$/,             // 169.254.0.0/16
  /^0\.0\.0\.0$/,                              // 0.0.0.0
  // IPv6
  /^::1$/,                                     // IPv6 loopback
  /^fc00:/i,                                   // IPv6 unique local
  /^fe80:/i,                                   // IPv6 link-local
];

const ALLOWED_PROTOCOLS = ['http:', 'https:'];

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized_url?: string;
}

export function validateUrl(input: string): ValidationResult {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'URLが入力されていません' };
  }

  const trimmed = input.trim();

  // Block javascript: and other dangerous schemes
  if (/^(javascript|data|vbscript|file|ftp):/i.test(trimmed)) {
    return { valid: false, error: '許可されていないURLスキームです' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    // Try adding https:// if no protocol
    try {
      parsed = new URL(`https://${trimmed}`);
    } catch {
      return { valid: false, error: '有効なURLを入力してください' };
    }
  }

  // Protocol check
  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    return { valid: false, error: 'httpまたはhttpsのURLのみ対応しています' };
  }

  // IP address direct access check
  const hostname = parsed.hostname;

  // Block IPv6 addresses in brackets
  if (hostname.startsWith('[') || hostname === '::1') {
    return { valid: false, error: 'IPアドレス直指定は許可されていません' };
  }

  // Check if hostname is an IP address
  if (isIPAddress(hostname)) {
    if (isPrivateIP(hostname)) {
      return { valid: false, error: 'プライベートIPアドレスへのアクセスは許可されていません' };
    }
  }

  // Block localhost variants
  if (isLocalhost(hostname)) {
    return { valid: false, error: 'ローカルアドレスへのアクセスは許可されていません' };
  }

  return {
    valid: true,
    sanitized_url: parsed.toString(),
  };
}

export function isIPAddress(hostname: string): boolean {
  // IPv4
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return true;
  }
  // IPv6 (with or without brackets)
  if (/^[\da-f:]+$/i.test(hostname) || hostname.startsWith('[')) {
    return true;
  }
  return false;
}

export function isPrivateIP(ip: string): boolean {
  const cleaned = ip.replace(/^\[|\]$/g, '');
  return PRIVATE_IP_RANGES.some((range) => range.test(cleaned));
}

export function isLocalhost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return (
    lower === 'localhost' ||
    lower === '0.0.0.0' ||
    lower === '::1' ||
    lower === '[::1]' ||
    lower.endsWith('.localhost')
  );
}

/**
 * Validate resolved IP after DNS resolution (defense against DNS rebinding)
 */
export function validateResolvedIP(ip: string): boolean {
  if (isPrivateIP(ip)) return false;
  if (isLocalhost(ip)) return false;
  return true;
}

/**
 * Full validation including redirect chain check
 * Max 3 redirects, each checked against private IP ranges
 */
export async function fetchWithSSRFProtection(
  url: string,
  options: { timeout?: number; maxSize?: number } = {}
): Promise<Response> {
  const { timeout = 10000, maxSize = 5 * 1024 * 1024 } = options;

  const validation = validateUrl(url);
  if (!validation.valid) {
    throw new SSRFError(validation.error!);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    let currentUrl = validation.sanitized_url!;
    let redirectCount = 0;

    while (redirectCount <= MAX_REDIRECTS) {
      // DNS rebinding defense: resolve hostname and check IP before fetching
      const parsedUrl = new URL(currentUrl);
      if (!isIPAddress(parsedUrl.hostname)) {
        try {
          const { resolve4 } = await import('node:dns/promises');
          const addresses = await resolve4(parsedUrl.hostname);
          for (const addr of addresses) {
            if (!validateResolvedIP(addr)) {
              throw new SSRFError(`DNSが内部IPに解決されました: ${parsedUrl.hostname} -> ${addr}`);
            }
          }
        } catch (e) {
          // If DNS resolution fails with SSRFError, re-throw
          if (e instanceof SSRFError) throw e;
          // Otherwise DNS resolution unavailable (edge runtime) — proceed with URL-level checks only
        }
      }

      const response = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: 'manual',
        headers: {
          'User-Agent': 'PublishGate/1.0 (LP Analysis Bot)',
        },
      });

      // Handle redirects manually to check each destination
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) break;

        const redirectUrl = new URL(location, currentUrl).toString();
        const redirectValidation = validateUrl(redirectUrl);
        if (!redirectValidation.valid) {
          throw new SSRFError(`リダイレクト先が不正です: ${redirectValidation.error}`);
        }

        currentUrl = redirectValidation.sanitized_url!;
        redirectCount++;
        continue;
      }

      // Check content-length if available
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > maxSize) {
        throw new SSRFError(`レスポンスサイズが上限(${maxSize / 1024 / 1024}MB)を超えています`);
      }

      return response;
    }

    throw new SSRFError(`リダイレクト回数が上限(${MAX_REDIRECTS}回)を超えました`);
  } finally {
    clearTimeout(timeoutId);
  }
}

export class SSRFError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SSRFError';
  }
}
