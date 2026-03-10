import { NextRequest, NextResponse } from 'next/server';
import { createShareId, getAnalysis, getShareAnalysis } from '../../../lib/analyzer';

// CORS headers for Chrome extension access
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
 * POST /api/share
 *
 * Creates a share URL for an existing analysis.
 * Accepts { analysis_id: string } and returns { share_id, share_url }.
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
        { error: 'analysis_idが指定されていません' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Verify the analysis exists before creating a share link
    const analysis = getAnalysis(analysis_id);
    if (!analysis) {
      return NextResponse.json(
        { error: '指定された分析結果が見つかりません' },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Create the share ID
    const shareId = createShareId(analysis_id);

    // Build the share URL using the request origin
    const origin = request.headers.get('origin')
      || request.headers.get('x-forwarded-host')
      || request.nextUrl.origin;
    const shareUrl = `${origin}/share/${shareId}`;

    return NextResponse.json(
      {
        share_id: shareId,
        share_url: shareUrl,
      },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('[/api/share] POST error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '共有リンクの作成中にエラーが発生しました',
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * GET /api/share?id=<shareId>
 *
 * Retrieves the analysis data associated with a share ID.
 */
export async function GET(request: NextRequest) {
  try {
    const shareId = request.nextUrl.searchParams.get('id');

    if (!shareId) {
      return NextResponse.json(
        { error: '共有IDが指定されていません' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const analysis = getShareAnalysis(shareId);
    if (!analysis) {
      return NextResponse.json(
        { error: '指定された共有リンクが見つかりません' },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(analysis, {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error('[/api/share] GET error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '共有データの取得中にエラーが発生しました',
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
