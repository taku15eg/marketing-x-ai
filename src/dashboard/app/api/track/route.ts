import { NextRequest, NextResponse } from 'next/server';
import { logEvent, type EventType } from '../../../lib/event-logger';
import { checkRateLimit, getClientIP } from '../../../lib/rate-limiter';
import { CORS_HEADERS } from '../../../lib/cors';

/**
 * Allowed event types for client-side tracking.
 * Subset of EventType - only events that originate from user interactions.
 */
const CLIENT_EVENTS: Set<string> = new Set([
  'share_cta_clicked',
  'share_reanalyze_clicked',
  'powered_by_clicked',
  'extension_to_dashboard',
]);

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
 * POST /api/track
 *
 * Lightweight client-side event tracking endpoint.
 * Accepts { event: EventType, data?: Record<string, string> }
 * Rate limited to 60 events/min per IP.
 */
export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const rateCheck = checkRateLimit(`track:${clientIP}`, { max_requests: 60, window_ms: 60_000 });
    if (!rateCheck.allowed) {
      return new NextResponse(null, { status: 429, headers: CORS_HEADERS });
    }

    let body: { event?: string; data?: Record<string, string> };
    try {
      body = await request.json();
    } catch {
      return new NextResponse(null, { status: 400, headers: CORS_HEADERS });
    }

    const { event, data } = body;

    if (!event || typeof event !== 'string' || !CLIENT_EVENTS.has(event)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Sanitize data: only allow string values, limit keys
    const sanitizedData: Record<string, string> = {};
    if (data && typeof data === 'object') {
      const keys = Object.keys(data).slice(0, 10);
      for (const key of keys) {
        const val = data[key];
        if (typeof val === 'string' && val.length <= 500) {
          sanitizedData[key] = val;
        }
      }
    }

    logEvent(event as EventType, sanitizedData);

    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  } catch {
    return new NextResponse(null, { status: 500, headers: CORS_HEADERS });
  }
}
