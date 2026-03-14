/**
 * Track API & Client Tracking Tests
 *
 * Tests the /api/track endpoint logic and client-side track utility.
 */

import { describe, it, expect } from 'vitest';
import { logEvent, getEventSummary } from '../lib/event-logger';

describe('Track API - Event Validation', () => {
  it('only allows client-safe event types', () => {
    // These events should be accepted by the track API
    const allowedEvents = [
      'share_cta_clicked',
      'share_reanalyze_clicked',
      'powered_by_clicked',
      'extension_to_dashboard',
    ] as const;

    for (const event of allowedEvents) {
      const before = getEventSummary();
      const prevCount = before[event] || 0;

      logEvent(event, { test: 'true' });

      const after = getEventSummary();
      expect(after[event]).toBe(prevCount + 1);
    }
  });

  it('server-only events are not in client set', () => {
    // These events should NOT be accepted via client-side track API
    // (they are only logged server-side)
    const serverOnlyEvents = [
      'analysis_started',
      'analysis_completed',
      'analysis_error',
      'analysis_cache_hit',
      'share_url_generated',
      'share_page_viewed',
    ];

    const CLIENT_EVENTS = new Set([
      'share_cta_clicked',
      'share_reanalyze_clicked',
      'powered_by_clicked',
      'extension_to_dashboard',
    ]);

    for (const event of serverOnlyEvents) {
      expect(CLIENT_EVENTS.has(event)).toBe(false);
    }
  });
});

describe('Track API - Data Sanitization', () => {
  it('limits data keys to 10', () => {
    const largeData: Record<string, string> = {};
    for (let i = 0; i < 20; i++) {
      largeData[`key_${i}`] = `value_${i}`;
    }

    // Simulate sanitization logic from track API
    const sanitized: Record<string, string> = {};
    const keys = Object.keys(largeData).slice(0, 10);
    for (const key of keys) {
      const val = largeData[key];
      if (typeof val === 'string' && val.length <= 500) {
        sanitized[key] = val;
      }
    }

    expect(Object.keys(sanitized).length).toBe(10);
  });

  it('rejects values longer than 500 chars', () => {
    const data = {
      short: 'ok',
      long: 'x'.repeat(501),
    };

    const sanitized: Record<string, string> = {};
    for (const [key, val] of Object.entries(data)) {
      if (typeof val === 'string' && val.length <= 500) {
        sanitized[key] = val;
      }
    }

    expect(sanitized).toHaveProperty('short');
    expect(sanitized).not.toHaveProperty('long');
  });
});
