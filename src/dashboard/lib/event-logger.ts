// Lightweight event logging for growth metrics
// Dual-layer: in-memory ring buffer (always) + Supabase insert (when configured).
//
// Key metrics for β validation (from 09_beta_plan.md):
// - H1: analysis_completed count, analysis_viewed_30s count
// - H2: share_url_generated count per user
// - H3: analysis_from_referral count (viral coefficient K)

import { getSupabase } from './supabase';

export type EventType =
  | 'analysis_started'
  | 'analysis_completed'
  | 'analysis_error'
  | 'analysis_cache_hit'
  | 'share_url_generated'
  | 'share_page_viewed'
  | 'share_cta_clicked';

interface EventEntry {
  type: EventType;
  timestamp: string;
  data: Record<string, string | number | boolean>;
}

const MAX_EVENTS = 5000;
const events: EventEntry[] = [];

export function logEvent(type: EventType, data: Record<string, string | number | boolean> = {}): void {
  const timestamp = new Date().toISOString();

  // Always write to in-memory ring buffer
  if (events.length >= MAX_EVENTS) {
    events.shift(); // ring buffer: drop oldest
  }
  events.push({ type, timestamp, data });

  // Persist to Supabase in background (fire-and-forget)
  const sb = getSupabase();
  if (sb) {
    Promise.resolve(
      sb.from('events').insert({ type, data, created_at: timestamp })
    ).catch(() => {}); // Non-critical: never block on event logging
  }
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
