// Lightweight event logging for growth metrics
// Phase 0.5: In-memory ring buffer. Phase 1: Supabase insert.
//
// Key metrics for β validation (from 09_beta_plan.md):
// - H1: analysis_completed count, analysis_viewed_30s count
// - H2: share_url_generated count per user
// - H3: analysis_from_referral count (viral coefficient K)

export type EventType =
  | 'analysis_started'
  | 'analysis_completed'
  | 'analysis_error'
  | 'analysis_cache_hit'
  | 'share_url_generated'
  | 'share_page_viewed'
  | 'share_cta_clicked'
  | 'share_reanalyze_clicked'
  | 'powered_by_clicked'
  | 'extension_to_dashboard';

interface EventEntry {
  type: EventType;
  timestamp: string;
  data: Record<string, string | number | boolean>;
}

const MAX_EVENTS = 5000;
const events: EventEntry[] = [];

export function logEvent(type: EventType, data: Record<string, string | number | boolean> = {}): void {
  if (events.length >= MAX_EVENTS) {
    events.shift(); // ring buffer: drop oldest
  }
  events.push({
    type,
    timestamp: new Date().toISOString(),
    data,
  });
}

/**
 * Get summary counts for β dashboard / debugging.
 * Returns counts grouped by event type.
 */
export function getEventSummary(): Record<EventType, number> {
  const summary: Partial<Record<EventType, number>> = {};
  for (const event of events) {
    summary[event.type] = (summary[event.type] || 0) + 1;
  }
  return summary as Record<EventType, number>;
}

/**
 * Get referral conversion stats: how many analyses came from shared URLs.
 * This is the viral coefficient K numerator.
 */
export function getReferralStats(): { total_shares: number; analyses_from_referral: number; conversion_rate: number } {
  const totalShares = events.filter(e => e.type === 'share_url_generated').length;
  const fromReferral = events.filter(e => e.type === 'analysis_completed' && e.data.referral_source === 'share').length;
  return {
    total_shares: totalShares,
    analyses_from_referral: fromReferral,
    conversion_rate: totalShares > 0 ? fromReferral / totalShares : 0,
  };
}
