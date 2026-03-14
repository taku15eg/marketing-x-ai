/**
 * Viral Flow & Tracking Tests
 *
 * Tests the viral loop: share → view → re-analyze → share
 * Tests PoweredByBadge tracking, share page CTAs, and event types.
 */

import { describe, it, expect } from 'vitest';
import { logEvent, getEventSummary, getReferralStats } from '../lib/event-logger';

describe('Viral Flow Event Types', () => {
  it('logs share_reanalyze_clicked event', () => {
    const before = getEventSummary();
    const prevCount = before.share_reanalyze_clicked || 0;

    logEvent('share_reanalyze_clicked', { share_id: 'test-123', url: 'https://example.com' });

    const after = getEventSummary();
    expect(after.share_reanalyze_clicked).toBe(prevCount + 1);
  });

  it('logs powered_by_clicked event with source', () => {
    const before = getEventSummary();
    const prevCount = before.powered_by_clicked || 0;

    logEvent('powered_by_clicked', { source: 'share_page' });

    const after = getEventSummary();
    expect(after.powered_by_clicked).toBe(prevCount + 1);
  });

  it('logs extension_to_dashboard event', () => {
    const before = getEventSummary();
    const prevCount = before.extension_to_dashboard || 0;

    logEvent('extension_to_dashboard', { analysis_id: 'ext-456' });

    const after = getEventSummary();
    expect(after.extension_to_dashboard).toBe(prevCount + 1);
  });

  it('tracks full viral loop: share → view → CTA click → re-analyze', () => {
    const before = getReferralStats();

    // Step 1: User generates share URL
    logEvent('share_url_generated', { analysis_id: 'viral-loop-test' });

    // Step 2: Recipient views shared page
    logEvent('share_page_viewed', { share_id: 'viral-loop-share' });

    // Step 3: Recipient clicks CTA
    logEvent('share_cta_clicked', { location: 'header' });

    // Step 4: Recipient completes analysis (from referral)
    logEvent('analysis_completed', { url: 'https://new-user.com', referral_source: 'share' });

    const after = getReferralStats();
    expect(after.total_shares).toBe(before.total_shares + 1);
    expect(after.analyses_from_referral).toBe(before.analyses_from_referral + 1);
  });

  it('tracks re-analyze flow: share_reanalyze_clicked → analysis', () => {
    const before = getEventSummary();
    const prevReanalyze = before.share_reanalyze_clicked || 0;

    logEvent('share_reanalyze_clicked', { url: 'https://target.com' });
    logEvent('analysis_started', { url: 'https://target.com', referral_source: 'share_reanalyze' });

    const after = getEventSummary();
    expect(after.share_reanalyze_clicked).toBe(prevReanalyze + 1);
  });
});

describe('PoweredByBadge Tracking', () => {
  it('distinguishes powered_by clicks by source', () => {
    logEvent('powered_by_clicked', { source: 'share_page' });
    logEvent('powered_by_clicked', { source: 'analysis_result' });
    logEvent('powered_by_clicked', { source: 'brief' });

    const summary = getEventSummary();
    expect(summary.powered_by_clicked).toBeGreaterThanOrEqual(3);
  });
});
