import { NextRequest, NextResponse } from 'next/server';
import { getAnalysis } from '../../../lib/analyzer';
import { generateAdCreatives } from '../../../lib/ad-creative-generator';
import { checkRateLimitAsync, getClientIP, RATE_LIMITS } from '../../../lib/rate-limiter';
import { CORS_HEADERS } from '../../../lib/cors';
import { logEvent } from '../../../lib/event-logger';

// In-memory cache for ad creative results (MVP)
const adCreativeStore = new Map<
  string,
  { result: Awaited<ReturnType<typeof generateAdCreatives>>; _stored_at: number }
>();
const AD_CREATIVE_TTL_MS = 24 * 60 * 60 * 1000;

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * GET /api/ad-creative?analysis_id=<id>
 * Retrieves cached ad creative results.
 */
export async function GET(request: NextRequest) {
  const analysisId = request.nextUrl.searchParams.get('analysis_id');

  if (!analysisId) {
    return NextResponse.json(
      { error: '分析IDが指定されていません' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const cached = adCreativeStore.get(analysisId);
  if (cached && Date.now() - cached._stored_at < AD_CREATIVE_TTL_MS) {
    return NextResponse.json(cached.result, {
      status: 200,
      headers: { ...CORS_HEADERS, 'X-Cache': 'HIT' },
    });
  }

  return NextResponse.json(
    { error: '広告訴求データが見つかりません。生成してください。' },
    { status: 404, headers: CORS_HEADERS }
  );
}

/**
 * POST /api/ad-creative
 * Generates ad creatives from an existing LP analysis result.
 * Body: { analysis_id: string }
 */
export async function POST(request: NextRequest) {
  try {
    let body: { analysis_id?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'リクエストボディのJSONが不正です' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const { analysis_id } = body;
    if (!analysis_id || typeof analysis_id !== 'string') {
      return NextResponse.json(
        { error: '分析IDが指定されていません' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Check for cached result first
    const cached = adCreativeStore.get(analysis_id);
    if (cached && Date.now() - cached._stored_at < AD_CREATIVE_TTL_MS) {
      return NextResponse.json(cached.result, {
        status: 200,
        headers: { ...CORS_HEADERS, 'X-Cache': 'HIT' },
      });
    }

    // Rate limiting
    const clientIP = getClientIP(request);
    const minuteLimit = await checkRateLimitAsync(
      `minute:${clientIP}`,
      RATE_LIMITS.per_minute
    );
    if (!minuteLimit.allowed) {
      return NextResponse.json(
        { error: 'レート制限に達しました。しばらくお待ちください。' },
        {
          status: 429,
          headers: {
            ...CORS_HEADERS,
            'Retry-After': String(Math.ceil((minuteLimit.reset_at - Date.now()) / 1000)),
          },
        }
      );
    }

    // Get analysis result
    const analysis = getAnalysis(analysis_id);
    if (!analysis || !analysis.result) {
      return NextResponse.json(
        { error: '指定された分析結果が見つかりません' },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    logEvent('ad_creative_started', { analysis_id });

    // Generate ad creatives
    const adCreatives = await generateAdCreatives(analysis.result, analysis_id);

    // Cache the result
    adCreativeStore.set(analysis_id, {
      result: adCreatives,
      _stored_at: Date.now(),
    });

    logEvent('ad_creative_completed', { analysis_id });

    return NextResponse.json(adCreatives, {
      status: 200,
      headers: { ...CORS_HEADERS, 'X-Cache': 'MISS' },
    });
  } catch (error) {
    console.error('[/api/ad-creative] Unhandled error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '広告訴求生成中に予期せぬエラーが発生しました',
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
