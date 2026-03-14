import { NextResponse } from 'next/server';
import { getEventSummary, getReferralStats } from '../../../lib/event-logger';

/**
 * GET /api/metrics
 *
 * Internal endpoint for β validation metrics.
 * Returns event counts and referral conversion stats.
 *
 * Note: No authentication for MVP. Add auth before production.
 */
export async function GET() {
  const summary = getEventSummary();
  const referral = getReferralStats();

  // North Star: "β5名中3名が共有URL生成1回以上"
  // H1: analysis_completed count → users complete analysis
  // H2: share_url_generated count → users share results
  // H3: referral conversion → viral coefficient K

  return NextResponse.json({
    events: summary,
    referral,
    kpi: {
      total_analyses: (summary.analysis_completed || 0),
      total_shares: referral.total_shares,
      viral_coefficient: referral.conversion_rate,
      cache_hit_rate: (summary.analysis_cache_hit || 0) > 0
        ? (summary.analysis_cache_hit || 0) /
          ((summary.analysis_started || 0) || 1)
        : 0,
      error_rate: (summary.analysis_error || 0) > 0
        ? (summary.analysis_error || 0) /
          ((summary.analysis_started || 0) || 1)
        : 0,
    },
  });
}
