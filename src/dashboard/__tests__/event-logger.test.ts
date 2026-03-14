/**
 * Event Logger Unit Tests — β Event Tracking
 */

import { describe, it, expect } from 'vitest';
import { logEvent, getEventSummary, getReferralStats, getEvents, getBetaMetrics } from '../lib/event-logger';
import type { EventType } from '../lib/event-logger';

describe('Event Logger', () => {
  it('logEvent records events that appear in summary', () => {
    const before = getEventSummary();
    const prevCount = before['analysis_started'] || 0;

    logEvent('analysis_started', { url: 'https://example.com' });

    const after = getEventSummary();
    expect(after['analysis_started']).toBe(prevCount + 1);
  });

  it('logEvent records events with different types', () => {
    const before = getEventSummary();
    const prevCompleted = before['analysis_completed'] || 0;
    const prevFailed = before['analysis_failed'] || 0;

    logEvent('analysis_completed', { url: 'https://a.com', referral_source: 'direct' });
    logEvent('analysis_failed', { url: 'https://b.com', error: 'timeout' });

    const after = getEventSummary();
    expect(after['analysis_completed']).toBe(prevCompleted + 1);
    expect(after['analysis_failed']).toBe(prevFailed + 1);
  });

  it('getEventSummary returns counts for all logged event types', () => {
    logEvent('share_created', { analysis_id: 'abc' });
    logEvent('share_opened', { share_id: 'xyz' });

    const summary = getEventSummary();
    expect(summary['share_created']).toBeGreaterThanOrEqual(1);
    expect(summary['share_opened']).toBeGreaterThanOrEqual(1);
  });

  it('logEvent accepts empty data object', () => {
    const before = getEventSummary();
    const prevCache = before['analysis_cache_hit'] || 0;

    logEvent('analysis_cache_hit');

    const after = getEventSummary();
    expect(after['analysis_cache_hit']).toBe(prevCache + 1);
  });

  it('records β-specific events: tab_viewed, brief_viewed', () => {
    const before = getEventSummary();
    const prevTab = before['tab_viewed'] || 0;
    const prevBrief = before['brief_viewed'] || 0;

    logEvent('tab_viewed', { tab: 'lp_analysis', analysis_id: 'test-1' });
    logEvent('brief_viewed', { issue_priority: 1, issue_title: 'FV改善' });

    const after = getEventSummary();
    expect(after['tab_viewed']).toBe(prevTab + 1);
    expect(after['brief_viewed']).toBe(prevBrief + 1);
  });

  it('records extension events', () => {
    const before = getEventSummary();
    const prevExtStart = before['extension_analysis_started'] || 0;
    const prevExtDash = before['extension_sent_to_dashboard'] || 0;

    logEvent('extension_analysis_started', { url: 'https://ext.com' });
    logEvent('extension_sent_to_dashboard', { analysis_id: 'ext-1' });

    const after = getEventSummary();
    expect(after['extension_analysis_started']).toBe(prevExtStart + 1);
    expect(after['extension_sent_to_dashboard']).toBe(prevExtDash + 1);
  });

  it('records shared_visitor_reanalyzed event', () => {
    const before = getEventSummary();
    const prev = before['shared_visitor_reanalyzed'] || 0;

    logEvent('shared_visitor_reanalyzed', { url: 'https://viral.com' });

    const after = getEventSummary();
    expect(after['shared_visitor_reanalyzed']).toBe(prev + 1);
  });
});

describe('getEvents', () => {
  it('returns a copy of all events', () => {
    const eventsBefore = getEvents().length;
    logEvent('analysis_started', { url: 'https://test.com' });
    const eventsAfter = getEvents();
    expect(eventsAfter.length).toBe(eventsBefore + 1);

    // Verify it's a copy (mutation doesn't affect internal state)
    eventsAfter.pop();
    expect(getEvents().length).toBe(eventsBefore + 1);
  });

  it('events have correct structure', () => {
    logEvent('share_created', { analysis_id: 'struct-test' });
    const events = getEvents();
    const last = events[events.length - 1];
    expect(last.type).toBe('share_created');
    expect(last.timestamp).toBeTruthy();
    expect(last.data.analysis_id).toBe('struct-test');
  });
});

describe('Referral Stats', () => {
  it('getReferralStats returns valid structure', () => {
    const stats = getReferralStats();
    expect(stats).toHaveProperty('total_shares');
    expect(stats).toHaveProperty('analyses_from_referral');
    expect(stats).toHaveProperty('conversion_rate');
    expect(typeof stats.total_shares).toBe('number');
    expect(typeof stats.analyses_from_referral).toBe('number');
    expect(typeof stats.conversion_rate).toBe('number');
  });

  it('tracks share-to-referral conversion', () => {
    const before = getReferralStats();

    // Simulate viral flow: user shares → new user analyzes from share link
    logEvent('share_created', { analysis_id: 'ref-test-1' });
    logEvent('shared_visitor_reanalyzed', { url: 'https://new.com' });

    const after = getReferralStats();
    expect(after.total_shares).toBe(before.total_shares + 1);
    expect(after.analyses_from_referral).toBe(before.analyses_from_referral + 1);
  });

  it('conversion_rate is 0 when no shares exist initially', () => {
    const stats = getReferralStats();
    if (stats.total_shares === 0) {
      expect(stats.conversion_rate).toBe(0);
    } else {
      expect(stats.conversion_rate).toBe(stats.analyses_from_referral / stats.total_shares);
    }
  });
});

describe('getBetaMetrics', () => {
  it('returns funnel metrics', () => {
    // Seed some events
    logEvent('analysis_started', { url: 'https://funnel.com' });
    logEvent('analysis_completed', { url: 'https://funnel.com' });
    logEvent('share_created', { analysis_id: 'funnel-1' });
    logEvent('share_opened', { share_id: 'funnel-share-1' });
    logEvent('shared_visitor_reanalyzed', { url: 'https://viral.com' });

    const metrics = getBetaMetrics();
    expect(metrics.funnel.started).toBeGreaterThanOrEqual(1);
    expect(metrics.funnel.completed).toBeGreaterThanOrEqual(1);
    expect(metrics.funnel.shared).toBeGreaterThanOrEqual(1);
    expect(metrics.funnel.share_opened).toBeGreaterThanOrEqual(1);
    expect(metrics.funnel.reanalyzed).toBeGreaterThanOrEqual(1);
    expect(metrics.summary).toBeDefined();
    expect(metrics.referral).toBeDefined();
  });
});

describe('Event type safety', () => {
  it('all β-required event types are defined', () => {
    const requiredEvents: EventType[] = [
      'analysis_started',
      'analysis_completed',
      'analysis_failed',
      'share_created',
      'share_opened',
      'shared_visitor_reanalyzed',
      'tab_viewed',
      'brief_viewed',
      'extension_analysis_started',
      'extension_sent_to_dashboard',
    ];

    // This test verifies at compile time that all required events are valid EventType values
    for (const event of requiredEvents) {
      logEvent(event, { test: true });
    }

    const summary = getEventSummary();
    for (const event of requiredEvents) {
      expect(summary[event]).toBeGreaterThanOrEqual(1);
    }
  });
});
