import { NextRequest, NextResponse } from 'next/server';
import { validateUrl } from '../../../lib/url-validator';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '../../../lib/rate-limiter';
import { runAnalysis, storeAnalysis } from '../../../lib/analyzer';
import type { AnalyzeRequest } from '../../../lib/types';

// CORS headers for Chrome extension access
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * OPTIONS handler for CORS preflight requests from Chrome extension.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * POST /api/analyze
 *
 * Accepts { url: string }, validates the URL, checks rate limits,
 * runs the 4-step analysis pipeline, stores the result, and returns
 * the AnalyzeResponse JSON.
 */
export async function POST(request: NextRequest) {
  try {
    // --- Parse request body ---
    let body: AnalyzeRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'リクエストボディのJSONが不正です' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URLが指定されていません' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // --- Validate URL (SSRF protection) ---
    const validation = validateUrl(url);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // --- Rate limiting ---
    const clientIP = getClientIP(request);

    // Per-minute rate limit
    const minuteLimit = checkRateLimit(
      `minute:${clientIP}`,
      RATE_LIMITS.per_minute
    );
    if (!minuteLimit.allowed) {
      return NextResponse.json(
        {
          error: 'レート制限に達しました。しばらくお待ちください。',
          reset_at: new Date(minuteLimit.reset_at).toISOString(),
        },
        {
          status: 429,
          headers: {
            ...CORS_HEADERS,
            'Retry-After': String(
              Math.ceil((minuteLimit.reset_at - Date.now()) / 1000)
            ),
          },
        }
      );
    }

    // Monthly free-tier limit
    const monthlyLimit = checkRateLimit(
      `monthly:${clientIP}`,
      RATE_LIMITS.free_monthly
    );
    if (!monthlyLimit.allowed) {
      return NextResponse.json(
        {
          error: '月間の無料分析回数（5回）に達しました。',
          reset_at: new Date(monthlyLimit.reset_at).toISOString(),
        },
        {
          status: 429,
          headers: {
            ...CORS_HEADERS,
            'Retry-After': String(
              Math.ceil((monthlyLimit.reset_at - Date.now()) / 1000)
            ),
          },
        }
      );
    }

    // --- Run analysis pipeline ---
    const result = await runAnalysis(validation.sanitized_url!);

    // --- Store result ---
    storeAnalysis(result);

    // --- Return response ---
    return NextResponse.json(result, {
      status: result.status === 'error' ? 500 : 200,
      headers: {
        ...CORS_HEADERS,
        'X-RateLimit-Remaining': String(monthlyLimit.remaining),
        'X-RateLimit-Reset': new Date(monthlyLimit.reset_at).toISOString(),
      },
    });
  } catch (error) {
    console.error('[/api/analyze] Unhandled error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '分析中に予期せぬエラーが発生しました',
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
