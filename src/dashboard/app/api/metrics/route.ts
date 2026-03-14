import { NextResponse } from 'next/server';
import { getBetaMetrics, getEvents } from '../../../lib/event-logger';

/**
 * GET /api/metrics
 *
 * Returns β validation metrics for the team.
 * Query params:
 *   ?raw=1  — include raw event log (for debugging)
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const includeRaw = url.searchParams.get('raw') === '1';

  const metrics = getBetaMetrics();

  const response: Record<string, unknown> = {
    ...metrics,
    generated_at: new Date().toISOString(),
  };

  if (includeRaw) {
    response.events = getEvents();
  }

  return NextResponse.json(response, { status: 200 });
}
