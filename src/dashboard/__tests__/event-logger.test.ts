/**
 * Event Logger Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Re-import fresh module for each test by using dynamic import
// Since the module uses module-level state, we test the exported functions directly
import { logEvent, getEventSummary, getReferralStats } from '../lib/event-logger';

describe('Event Logger', () => {
  // Note: events accumulate across tests since it's module-level state.
  // Tests are written to be order-independent by checking relative values.

  it('logEvent records events that appear in summary', () => {
    const before = getEventSummary();
    const prevCount = before.analysis_started || 0;

    logEvent('analysis_started', { url: 'https://example.com' });

    const after = getEventSummary();
    expect(after.analysis_started).toBe(prevCount + 1);
  });

  it('logEvent records events with different types', () => {
    const before = getEventSummary();
    const prevCompleted = before.analysis_completed || 0;
    const prevError = before.analysis_error || 0;

    logEvent('analysis_completed', { url: 'https://a.com', referral_source: 'direct' });
    logEvent('analysis_error', { url: 'https://b.com', error: 'timeout' });

    const after = getEventSummary();
    expect(after.analysis_completed).toBe(prevCompleted + 1);
    expect(after.analysis_error).toBe(prevError + 1);
  });

  it('getEventSummary returns counts for all logged event types', () => {
    logEvent('share_url_created', { analysis_id: 'abc' });
    logEvent('share_page_viewed', { share_id: 'xyz' });

    const summary = getEventSummary();
    expect(summary.share_url_created).toBeGreaterThanOrEqual(1);
    expect(summary.share_page_viewed).toBeGreaterThanOrEqual(1);
  });

  it('logEvent accepts empty data object', () => {
    const before = getEventSummary();
    const prevCache = before.analysis_cache_hit || 0;

    logEvent('analysis_cache_hit');

    const after = getEventSummary();
    expect(after.analysis_cache_hit).toBe(prevCache + 1);
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
    logEvent('share_url_created', { analysis_id: 'ref-test-1' });
    logEvent('analysis_completed', { url: 'https://new.com', referral_source: 'share' });

    const after = getReferralStats();
    expect(after.total_shares).toBe(before.total_shares + 1);
    expect(after.analyses_from_referral).toBe(before.analyses_from_referral + 1);
  });

  it('does not count direct analyses as referrals', () => {
    const before = getReferralStats();

    logEvent('analysis_completed', { url: 'https://direct.com', referral_source: 'direct' });

    const after = getReferralStats();
    expect(after.analyses_from_referral).toBe(before.analyses_from_referral);
  });

  it('conversion_rate is 0 when no shares exist initially', () => {
    // This tests the formula: conversion_rate = referrals / shares
    const stats = getReferralStats();
    if (stats.total_shares === 0) {
      expect(stats.conversion_rate).toBe(0);
    } else {
      expect(stats.conversion_rate).toBe(stats.analyses_from_referral / stats.total_shares);
    }
  });
});
