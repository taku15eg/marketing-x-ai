import { NextRequest, NextResponse } from 'next/server';
import { validateUrl } from '../../../lib/url-validator';
import { checkRateLimitAsync, getClientIP, getRateLimitForPlan, RATE_LIMITS } from '../../../lib/rate-limiter';
import { runAnalysis, storeAnalysis, getAnalysis, getCachedAnalysisByUrl } from '../../../lib/analyzer';
import { CORS_HEADERS } from '../../../lib/cors';
import { logEvent } from '../../../lib/event-logger';
import { getAuthenticatedUser } from '../../../lib/auth';
import type { AnalyzeRequest } from '../../../lib/types';

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
 * GET /api/analyze?id=<analysisId>
 *
 * Retrieves a stored analysis result by its ID.
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: '分析IDが指定されていません' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const analysis = getAnalysis(id);
  if (!analysis) {
    return NextResponse.json(
      { error: '指定された分析結果が見つかりません' },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(analysis, {
    status: 200,
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
    // --- Check body size (max 10KB) ---
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 10240) {
      return NextResponse.json(
        { error: 'リクエストボディが大きすぎます（上限10KB）' },
        { status: 413, headers: CORS_HEADERS }
      );
    }

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

    const { url, ref } = body as AnalyzeRequest & { ref?: string };

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

    // Per-minute rate limit (applies to all tiers)
    const minuteLimit = await checkRateLimitAsync(
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

    // Determine user plan and apply tier-appropriate monthly limit
    const authUser = await getAuthenticatedUser(request);
    const plan = authUser?.plan ?? 'free';
    const monthlyConfig = getRateLimitForPlan(plan);
    const rateLimitKey = authUser ? `monthly:user:${authUser.id}` : `monthly:${clientIP}`;

    const monthlyLimit = await checkRateLimitAsync(rateLimitKey, monthlyConfig);
    if (!monthlyLimit.allowed) {
      const limitLabel = monthlyConfig.max_requests;
      return NextResponse.json(
        {
          error: `月間の分析回数（${limitLabel}回）に達しました。`,
          reset_at: new Date(monthlyLimit.reset_at).toISOString(),
          plan,
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

    // --- Check URL cache (same URL analyzed within 1h returns cached result) ---
    // This avoids redundant Claude API calls, reducing cost significantly.
    // Cache hit does NOT consume monthly rate limit.
    const referralSource = ref === 'share' ? 'share' : 'direct';
    logEvent('analysis_started', { url: validation.sanitized_url!, referral_source: referralSource });

    const cached = getCachedAnalysisByUrl(validation.sanitized_url!);
    if (cached) {
      logEvent('analysis_cache_hit', { url: validation.sanitized_url! });
      return NextResponse.json(cached, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'X-Cache': 'HIT',
          'X-RateLimit-Remaining': String(monthlyLimit.remaining + 1), // refund the count
          'X-RateLimit-Reset': new Date(monthlyLimit.reset_at).toISOString(),
        },
      });
    }

    // --- Run analysis pipeline ---
    const result = await runAnalysis(validation.sanitized_url!);

    // --- Store result ---
    storeAnalysis(result);

    if (result.status === 'completed') {
      logEvent('analysis_completed', { url: validation.sanitized_url!, referral_source: referralSource });
    } else {
      logEvent('analysis_error', { url: validation.sanitized_url!, error: result.error || '' });
    }

    // --- Return response ---
    return NextResponse.json(result, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'X-Cache': 'MISS',
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
