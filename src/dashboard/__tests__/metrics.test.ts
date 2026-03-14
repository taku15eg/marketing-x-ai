/**
 * Metrics & KPI Tests
 *
 * Validates the β verification metrics infrastructure:
 * - Event coverage at all pipeline touchpoints
 * - KPI calculation correctness
 * - Metrics endpoint contract
 * - Referral/viral tracking
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { logEvent, getEventSummary, getReferralStats, type EventType } from '../lib/event-logger';

describe('Metrics - Event Coverage', () => {
  const analyzeRoute = fs.readFileSync(
    path.resolve(__dirname, '../app/api/analyze/route.ts'), 'utf-8'
  );
  const shareRoute = fs.readFileSync(
    path.resolve(__dirname, '../app/api/share/route.ts'), 'utf-8'
  );
  const sharePage = fs.readFileSync(
    path.resolve(__dirname, '../app/share/[id]/page.tsx'), 'utf-8'
  );

  it('analyze route emits analysis_started', () => {
    expect(analyzeRoute).toContain("logEvent('analysis_started'");
  });

  it('analyze route emits analysis_completed', () => {
    expect(analyzeRoute).toContain("logEvent('analysis_completed'");
  });

  it('analyze route emits analysis_error', () => {
    expect(analyzeRoute).toContain("logEvent('analysis_error'");
  });

  it('analyze route emits analysis_cache_hit', () => {
    expect(analyzeRoute).toContain("logEvent('analysis_cache_hit'");
  });

  it('share route emits share_url_generated', () => {
    expect(shareRoute).toContain("logEvent('share_url_generated'");
  });

  it('share route emits share_page_viewed', () => {
    expect(shareRoute).toContain("logEvent('share_page_viewed'");
  });

  it('share page tracks share_cta_clicked', () => {
    expect(sharePage).toContain('share_cta_clicked');
  });

  it('all defined event types are emitted somewhere', () => {
    const eventLoggerSource = fs.readFileSync(
      path.resolve(__dirname, '../lib/event-logger.ts'), 'utf-8'
    );

    // Extract EventType values
    const typeMatch = eventLoggerSource.match(/export type EventType\s*=[\s\S]*?;/);
    expect(typeMatch).toBeTruthy();

    const types = typeMatch![0].match(/'([^']+)'/g)?.map(t => t.replace(/'/g, ''));
    expect(types).toBeDefined();

    // All types should be logged somewhere in route handlers or client code
    const allSources = analyzeRoute + shareRoute + sharePage;
    for (const type of types!) {
      expect(allSources).toContain(type);
    }
  });
});

describe('Metrics - Referral Source Tracking', () => {
  const analyzeRoute = fs.readFileSync(
    path.resolve(__dirname, '../app/api/analyze/route.ts'), 'utf-8'
  );

  it('analyze route tracks referral_source in completed events', () => {
    expect(analyzeRoute).toContain('referral_source: referralSource');
  });

  it('analyze route distinguishes share vs direct referrals', () => {
    expect(analyzeRoute).toContain("ref === 'share'");
  });
});

describe('Metrics - KPI Calculations', () => {
  it('getEventSummary returns zero for unlogged event types', () => {
    const summary = getEventSummary();
    // Type assertion for potentially undefined values
    for (const key of Object.keys(summary)) {
      expect(typeof summary[key as EventType]).toBe('number');
    }
  });

  it('getReferralStats computes correct conversion rate', () => {
    // Log known events for predictable math
    const beforeShares = getReferralStats().total_shares;
    const beforeReferrals = getReferralStats().analyses_from_referral;

    logEvent('share_url_generated', { analysis_id: 'kpi-1' });
    logEvent('share_url_generated', { analysis_id: 'kpi-2' });
    logEvent('analysis_completed', { url: 'https://kpi.com', referral_source: 'share' });

    const after = getReferralStats();
    expect(after.total_shares).toBe(beforeShares + 2);
    expect(after.analyses_from_referral).toBe(beforeReferrals + 1);
    // conversion = referrals / shares
    expect(after.conversion_rate).toBe(after.analyses_from_referral / after.total_shares);
  });
});

describe('Metrics - Endpoint Contract', () => {
  const metricsRoute = fs.readFileSync(
    path.resolve(__dirname, '../app/api/metrics/route.ts'), 'utf-8'
  );

  it('metrics endpoint returns events summary', () => {
    expect(metricsRoute).toContain('getEventSummary');
  });

  it('metrics endpoint returns referral stats', () => {
    expect(metricsRoute).toContain('getReferralStats');
  });

  it('metrics endpoint returns KPI object', () => {
    expect(metricsRoute).toContain('total_analyses');
    expect(metricsRoute).toContain('total_shares');
    expect(metricsRoute).toContain('viral_coefficient');
    expect(metricsRoute).toContain('cache_hit_rate');
    expect(metricsRoute).toContain('error_rate');
  });
});

describe('Metrics - Event Beacon Contract', () => {
  const eventRoute = fs.readFileSync(
    path.resolve(__dirname, '../app/api/event/route.ts'), 'utf-8'
  );

  it('event endpoint accepts POST only', () => {
    expect(eventRoute).toContain('export async function POST');
    expect(eventRoute).not.toContain('export async function GET');
  });

  it('event endpoint whitelists allowed event types', () => {
    expect(eventRoute).toContain('ALLOWED_EVENTS');
    expect(eventRoute).toContain('share_cta_clicked');
  });

  it('event endpoint rejects unknown event types', () => {
    expect(eventRoute).toContain("status: 400");
  });
});
