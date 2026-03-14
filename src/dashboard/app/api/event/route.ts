import { NextRequest, NextResponse } from 'next/server';
import { logEvent, type EventType } from '../../../lib/event-logger';

const ALLOWED_EVENTS: EventType[] = ['share_cta_clicked'];

/**
 * POST /api/event
 *
 * Lightweight client-side event beacon.
 * Only accepts whitelisted event types to prevent abuse.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type || !ALLOWED_EVENTS.includes(type)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    logEvent(type, data || {});

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
