import { NextRequest } from 'next/server';
import { createShareId, getAnalysis, getShareAnalysis } from '../../../lib/analyzer';
import { checkRateLimit, getClientIP } from '../../../lib/rate-limiter';
import { corsPreflightResponse, errorResponse, jsonResponse } from '../../../lib/cors';
import { logEvent } from '../../../lib/event-logger';

export async function OPTIONS() {
  return corsPreflightResponse();
}

/**
 * POST /api/share
 * Creates a share URL for an existing analysis.
 */
export async function POST(request: NextRequest) {
  try {
    let body: { analysis_id?: string };
    try {
      body = await request.json();
    } catch {
      return errorResponse('リクエストボディのJSONが不正です', 400);
    }

    // Rate limit share creation (30/min per IP)
    const clientIP = getClientIP(request);
    const rateCheck = checkRateLimit(`share:${clientIP}`, { max_requests: 30, window_ms: 60_000 });
    if (!rateCheck.allowed) {
      return errorResponse('共有リンクの作成が制限されています。しばらくお待ちください。', 429);
    }

    const { analysis_id } = body;
    if (!analysis_id || typeof analysis_id !== 'string') {
      return errorResponse('analysis_idが指定されていません', 400);
    }

    const analysis = getAnalysis(analysis_id);
    if (!analysis) {
      return errorResponse('指定された分析結果が見つかりません', 404);
    }

    const shareId = createShareId(analysis_id);
    const origin = request.headers.get('origin')
      || request.headers.get('x-forwarded-host')
      || request.nextUrl.origin;
    const shareUrl = `${origin}/share/${shareId}`;

    logEvent('share_url_generated', { analysis_id, share_id: shareId });

    return jsonResponse({ share_id: shareId, share_url: shareUrl }, 201);
  } catch (error) {
    console.error('[/api/share] POST error:', error);
    return errorResponse(
      error instanceof Error ? error.message : '共有リンクの作成中にエラーが発生しました',
      500,
    );
  }
}

/**
 * GET /api/share?id=<shareId>
 * Retrieves the analysis data associated with a share ID.
 */
export async function GET(request: NextRequest) {
  try {
    const shareId = request.nextUrl.searchParams.get('id');
    if (!shareId) {
      return errorResponse('共有IDが指定されていません', 400);
    }

    const analysis = getShareAnalysis(shareId);
    if (!analysis) {
      return errorResponse('指定された共有リンクが見つかりません', 404);
    }

    logEvent('share_page_viewed', { share_id: shareId });
    return jsonResponse(analysis);
  } catch (error) {
    console.error('[/api/share] GET error:', error);
    return errorResponse(
      error instanceof Error ? error.message : '共有データの取得中にエラーが発生しました',
      500,
    );
  }
}
