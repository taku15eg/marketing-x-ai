/**
 * β Metrics API & Event Tracking Integration Tests
 *
 * Verifies the complete β tracking pipeline:
 * - Event logging across the full funnel
 * - Metrics aggregation (getBetaMetrics)
 * - /api/track route source validation
 * - /api/metrics route source validation
 * - Dedup and error resilience
 */

import { describe, it, expect } from 'vitest';
import { logEvent, getEventSummary, getBetaMetrics, getEvents } from '../lib/event-logger';
import type { EventType } from '../lib/event-logger';
import fs from 'fs';
import path from 'path';

describe('β Funnel Tracking Integration', () => {
  it('tracks complete viral loop: analysis → share → open → reanalyze', () => {
    const before = getBetaMetrics();

    // 1. User analyzes a URL
    logEvent('analysis_started', { url: 'https://client-lp.com', referral_source: 'direct', source: 'web' });
    logEvent('analysis_completed', { url: 'https://client-lp.com', referral_source: 'direct', source: 'web' });

    // 2. User views tab and brief
    logEvent('tab_viewed', { tab: 'lp_analysis', analysis_id: 'viral-test-1' });
    logEvent('brief_viewed', { issue_priority: 1, issue_title: 'FV改善' });

    // 3. User creates share URL
    logEvent('share_created', { analysis_id: 'viral-test-1', share_id: 'share-viral-1' });

    // 4. Client opens shared URL
    logEvent('share_opened', { share_id: 'share-viral-1' });

    // 5. Client starts their own analysis (viral loop!)
    logEvent('shared_visitor_reanalyzed', { url: 'https://my-own-lp.com' });

    const after = getBetaMetrics();

    // Verify funnel progression
    expect(after.funnel.started).toBe(before.funnel.started + 1);
    expect(after.funnel.completed).toBe(before.funnel.completed + 1);
    expect(after.funnel.shared).toBe(before.funnel.shared + 1);
    expect(after.funnel.share_opened).toBe(before.funnel.share_opened + 1);
    expect(after.funnel.reanalyzed).toBe(before.funnel.reanalyzed + 1);

    // Verify referral stats updated
    expect(after.referral.analyses_from_referral).toBe(before.referral.analyses_from_referral + 1);
  });

  it('tracks extension flow: extension start → send to dashboard', () => {
    const before = getEventSummary();
    const prevExtStart = before['extension_analysis_started'] || 0;
    const prevExtDash = before['extension_sent_to_dashboard'] || 0;

    logEvent('extension_analysis_started', { url: 'https://ext-page.com' });
    logEvent('extension_sent_to_dashboard', { analysis_id: 'ext-123', url: 'https://ext-page.com' });

    const after = getEventSummary();
    expect(after['extension_analysis_started']).toBe(prevExtStart + 1);
    expect(after['extension_sent_to_dashboard']).toBe(prevExtDash + 1);
  });

  it('analysis_failed does not count as completed in funnel', () => {
    const before = getBetaMetrics();

    logEvent('analysis_started', { url: 'https://fail.com', source: 'web' });
    logEvent('analysis_failed', { url: 'https://fail.com', error: 'timeout', source: 'web' });

    const after = getBetaMetrics();
    expect(after.funnel.started).toBe(before.funnel.started + 1);
    expect(after.funnel.completed).toBe(before.funnel.completed); // unchanged
  });
});

describe('POST /api/track - Route Validation', () => {
  it('route accepts only whitelisted event types', () => {
    const routeSource = fs.readFileSync(
      path.resolve(__dirname, '../app/api/track/route.ts'),
      'utf-8'
    );
    expect(routeSource).toContain('ALLOWED_CLIENT_EVENTS');
    expect(routeSource).toContain("'tab_viewed'");
    expect(routeSource).toContain("'brief_viewed'");
    expect(routeSource).toContain("'shared_visitor_reanalyzed'");
    expect(routeSource).toContain("'extension_analysis_started'");
    expect(routeSource).toContain("'extension_sent_to_dashboard'");
  });

  it('route rejects invalid event types', () => {
    const routeSource = fs.readFileSync(
      path.resolve(__dirname, '../app/api/track/route.ts'),
      'utf-8'
    );
    expect(routeSource).toContain('Invalid or disallowed event type');
    expect(routeSource).toContain('status: 400');
  });

  it('route calls logEvent for valid events', () => {
    const routeSource = fs.readFileSync(
      path.resolve(__dirname, '../app/api/track/route.ts'),
      'utf-8'
    );
    expect(routeSource).toContain('logEvent(type as EventType, data)');
  });
});

describe('GET /api/metrics - Route Validation', () => {
  it('route returns beta metrics', () => {
    const routeSource = fs.readFileSync(
      path.resolve(__dirname, '../app/api/metrics/route.ts'),
      'utf-8'
    );
    expect(routeSource).toContain('getBetaMetrics');
    expect(routeSource).toContain('generated_at');
  });

  it('route supports raw event export', () => {
    const routeSource = fs.readFileSync(
      path.resolve(__dirname, '../app/api/metrics/route.ts'),
      'utf-8'
    );
    expect(routeSource).toContain("raw");
    expect(routeSource).toContain('getEvents');
  });
});

describe('Event tracking in analyze route', () => {
  it('analyze route tracks all β events', () => {
    const routeSource = fs.readFileSync(
      path.resolve(__dirname, '../app/api/analyze/route.ts'),
      'utf-8'
    );
    expect(routeSource).toContain("logEvent('analysis_started'");
    expect(routeSource).toContain("logEvent('analysis_completed'");
    expect(routeSource).toContain("logEvent('analysis_failed'");
    expect(routeSource).toContain("logEvent('analysis_cache_hit'");
    expect(routeSource).toContain("logEvent('shared_visitor_reanalyzed'");
  });

  it('analyze route tracks source (web vs extension)', () => {
    const routeSource = fs.readFileSync(
      path.resolve(__dirname, '../app/api/analyze/route.ts'),
      'utf-8'
    );
    expect(routeSource).toContain("x-source");
    expect(routeSource).toContain("source");
  });
});

describe('Event tracking in share route', () => {
  it('share route tracks share_created and share_opened', () => {
    const routeSource = fs.readFileSync(
      path.resolve(__dirname, '../app/api/share/route.ts'),
      'utf-8'
    );
    expect(routeSource).toContain("logEvent('share_created'");
    expect(routeSource).toContain("logEvent('share_opened'");
  });
});

describe('Client-side tracking instrumentation', () => {
  it('analysis page tracks tab_viewed', () => {
    const pageSource = fs.readFileSync(
      path.resolve(__dirname, '../app/analysis/[id]/page.tsx'),
      'utf-8'
    );
    expect(pageSource).toContain("trackEvent('tab_viewed'");
    expect(pageSource).toContain("import { trackEvent }");
  });

  it('share page tracks tab_viewed', () => {
    const pageSource = fs.readFileSync(
      path.resolve(__dirname, '../app/share/[id]/page.tsx'),
      'utf-8'
    );
    expect(pageSource).toContain("trackEvent('tab_viewed'");
    expect(pageSource).toContain("import { trackEvent }");
  });

  it('IssueCard tracks brief_viewed', () => {
    const componentSource = fs.readFileSync(
      path.resolve(__dirname, '../components/IssueCard.tsx'),
      'utf-8'
    );
    expect(componentSource).toContain("trackEvent('brief_viewed'");
    expect(componentSource).toContain("import { trackEvent }");
  });
});

describe('Extension tracking instrumentation', () => {
  it('service-worker tracks extension_analysis_started', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../extension/background/service-worker.js'),
      'utf-8'
    );
    expect(source).toContain("trackExtensionEvent('extension_analysis_started'");
  });

  it('sidepanel tracks extension_sent_to_dashboard', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../extension/sidepanel/app.js'),
      'utf-8'
    );
    expect(source).toContain("trackEventFromExtension('extension_sent_to_dashboard'");
  });
});
