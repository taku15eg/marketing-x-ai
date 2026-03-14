import { NextRequest } from 'next/server';
import { validateUrl } from '../../../lib/url-validator';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '../../../lib/rate-limiter';
import { runAnalysis, storeAnalysis, getAnalysis, getCachedAnalysisByUrl } from '../../../lib/analyzer';
import { corsPreflightResponse, errorResponse, jsonResponse } from '../../../lib/cors';
import { logEvent } from '../../../lib/event-logger';
import { MAX_REQUEST_BODY_SIZE } from '../../../lib/constants';
import type { AnalyzeRequest } from '../../../lib/types';

export async function OPTIONS() {
  return corsPreflightResponse();
}

/**
 * GET /api/analyze?id=<analysisId>
 * Retrieves a stored analysis result by its ID.
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return errorResponse('分析IDが指定されていません', 400);
  }

  const analysis = getAnalysis(id);
  if (!analysis) {
    return errorResponse('指定された分析結果が見つかりません', 404);
  }

  return jsonResponse(analysis);
}

/**
 * POST /api/analyze
 * Accepts { url: string }, validates, rate-limits, runs the 4-step pipeline.
 */
export async function POST(request: NextRequest) {
  try {
    // Check body size
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_REQUEST_BODY_SIZE) {
      return errorResponse('リクエストボディが大きすぎます（上限10KB）', 413);
    }

    // Parse body
    let body: AnalyzeRequest;
    try {
      body = await request.json();
    } catch {
      return errorResponse('リクエストボディのJSONが不正です', 400);
    }

    const { url, ref } = body;

    if (!url || typeof url !== 'string') {
      return errorResponse('URLが指定されていません', 400);
    }

    // SSRF protection
    const validation = validateUrl(url);
    if (!validation.valid) {
      return errorResponse(validation.error!, 400);
    }

    // Rate limiting
    const clientIP = getClientIP(request);

    const minuteLimit = checkRateLimit(`minute:${clientIP}`, RATE_LIMITS.per_minute);
    if (!minuteLimit.allowed) {
      return errorResponse(
        'レート制限に達しました。しばらくお待ちください。',
        429,
        { 'Retry-After': String(Math.ceil((minuteLimit.reset_at - Date.now()) / 1000)) },
      );
    }

    const monthlyLimit = checkRateLimit(`monthly:${clientIP}`, RATE_LIMITS.free_monthly);
    if (!monthlyLimit.allowed) {
      return errorResponse(
        '月間の無料分析回数（5回）に達しました。',
        429,
        { 'Retry-After': String(Math.ceil((monthlyLimit.reset_at - Date.now()) / 1000)) },
      );
    }

    // URL cache check
    const referralSource = ref === 'share' ? 'share' : 'direct';
    logEvent('analysis_started', { url: validation.sanitized_url!, referral_source: referralSource });

    const cached = getCachedAnalysisByUrl(validation.sanitized_url!);
    if (cached) {
      logEvent('analysis_cache_hit', { url: validation.sanitized_url! });
      return jsonResponse(cached, 200, {
        'X-Cache': 'HIT',
        'X-RateLimit-Remaining': String(monthlyLimit.remaining + 1),
        'X-RateLimit-Reset': new Date(monthlyLimit.reset_at).toISOString(),
      });
    }

    // Run pipeline
    const result = await runAnalysis(validation.sanitized_url!);
    storeAnalysis(result);

    if (result.status === 'completed') {
      logEvent('analysis_completed', { url: validation.sanitized_url!, referral_source: referralSource });
    } else {
      logEvent('analysis_error', { url: validation.sanitized_url!, error: result.error || '' });
    }

    return jsonResponse(result, 200, {
      'X-Cache': 'MISS',
      'X-RateLimit-Remaining': String(monthlyLimit.remaining),
      'X-RateLimit-Reset': new Date(monthlyLimit.reset_at).toISOString(),
    });
  } catch (error) {
    console.error('[/api/analyze] Unhandled error:', error);
    return errorResponse(
      error instanceof Error ? error.message : '分析中に予期せぬエラーが発生しました',
      500,
    );
  }
}
