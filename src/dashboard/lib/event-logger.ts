// Lightweight event logging for β validation
// Phase 0.5: In-memory ring buffer. Phase 1: Supabase insert.
//
// β判断に必要な指標 (from 09_beta_plan.md):
// - H1: analysis_completed count, tab_viewed (30s+)
// - H2: share_created count per user
// - H3: shared_visitor_reanalyzed count (viral coefficient K)
//
// 命名規則: {object}_{verb} (snake_case)
// - object: analysis, share, tab, brief, extension
// - verb: started, completed, failed, created, opened, viewed

export type EventType =
  // 分析ライフサイクル
  | 'analysis_started'
  | 'analysis_completed'
  | 'analysis_failed'
  | 'analysis_cache_hit'
  // 共有フロー
  | 'share_created'
  | 'share_opened'
  | 'shared_visitor_reanalyzed'
  // コンテンツ閲覧深度
  | 'tab_viewed'
  | 'brief_viewed'
  // Chrome拡張
  | 'extension_analysis_started'
  | 'extension_sent_to_dashboard';

export interface EventEntry {
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
export function getEventSummary(): Record<string, number> {
  const summary: Record<string, number> = {};
  for (const event of events) {
    summary[event.type] = (summary[event.type] || 0) + 1;
  }
  return summary;
}

/**
 * Get all events (for debugging / export).
 * Returns a copy of the event array.
 */
export function getEvents(): EventEntry[] {
  return [...events];
}

/**
 * Get referral conversion stats: how many analyses came from shared URLs.
 * This is the viral coefficient K numerator.
 */
export function getReferralStats(): { total_shares: number; analyses_from_referral: number; conversion_rate: number } {
  const totalShares = events.filter(e => e.type === 'share_created').length;
  const fromReferral = events.filter(e => e.type === 'shared_visitor_reanalyzed').length;
  return {
    total_shares: totalShares,
    analyses_from_referral: fromReferral,
    conversion_rate: totalShares > 0 ? fromReferral / totalShares : 0,
  };
}

/**
 * Get β dashboard metrics in one call.
 */
export function getBetaMetrics(): {
  summary: Record<string, number>;
  referral: ReturnType<typeof getReferralStats>;
  funnel: {
    started: number;
    completed: number;
    shared: number;
    share_opened: number;
    reanalyzed: number;
  };
} {
  const summary = getEventSummary();
  const referral = getReferralStats();
  return {
    summary,
    referral,
    funnel: {
      started: summary['analysis_started'] || 0,
      completed: summary['analysis_completed'] || 0,
      shared: summary['share_created'] || 0,
      share_opened: summary['share_opened'] || 0,
      reanalyzed: summary['shared_visitor_reanalyzed'] || 0,
    },
  };
}
