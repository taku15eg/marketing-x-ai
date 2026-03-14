import { NextRequest, NextResponse } from 'next/server';
import { logEvent } from '../../../lib/event-logger';
import { CORS_HEADERS } from '../../../lib/cors';
import type { EventType } from '../../../lib/event-logger';

const ALLOWED_CLIENT_EVENTS: Set<EventType> = new Set([
  'tab_viewed',
  'brief_viewed',
  'shared_visitor_reanalyzed',
  'extension_analysis_started',
  'extension_sent_to_dashboard',
]);

/**
 * OPTIONS handler for CORS preflight requests.
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
 * Accepts client-side events for β tracking.
 * Only whitelisted event types are accepted.
 */
export async function POST(request: NextRequest) {
  try {
    let body: { type?: string; data?: Record<string, string | number | boolean> };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const { type, data = {} } = body;

    if (!type || !ALLOWED_CLIENT_EVENTS.has(type as EventType)) {
      return NextResponse.json(
        { error: 'Invalid or disallowed event type' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    logEvent(type as EventType, data);

    return NextResponse.json(
      { ok: true },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
