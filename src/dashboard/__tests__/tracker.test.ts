/**
 * Client-side tracker tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackEvent } from '../lib/tracker';

describe('trackEvent', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  let sessionStorageMock: Record<string, string>;

  beforeEach(() => {
    fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchSpy);

    sessionStorageMock = {};
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => sessionStorageMock[key] || null,
      setItem: (key: string, value: string) => { sessionStorageMock[key] = value; },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends POST to /api/track with event data', () => {
    trackEvent('tab_viewed', { tab: 'lp_analysis' });

    expect(fetchSpy).toHaveBeenCalledWith('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'tab_viewed', data: { tab: 'lp_analysis' } }),
      keepalive: true,
    });
  });

  it('deduplicates events with same dedupKey', () => {
    trackEvent('tab_viewed', { tab: 'lp_analysis' }, 'dedup_test_1');
    trackEvent('tab_viewed', { tab: 'lp_analysis' }, 'dedup_test_1');

    // Only 1 fetch call, second is deduplicated
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('does not dedup events with different dedupKeys', () => {
    trackEvent('tab_viewed', { tab: 'lp_analysis' }, 'key_a');
    trackEvent('tab_viewed', { tab: 'lp_analysis' }, 'key_b');

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('sends without dedupKey if none provided', () => {
    trackEvent('brief_viewed', { issue_priority: 1 });
    trackEvent('brief_viewed', { issue_priority: 2 });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('does not throw when fetch fails', () => {
    fetchSpy.mockRejectedValue(new Error('Network error'));

    expect(() => {
      trackEvent('tab_viewed', { tab: 'lp_analysis' });
    }).not.toThrow();
  });

  it('does not throw when sessionStorage is unavailable', () => {
    vi.stubGlobal('sessionStorage', undefined);

    expect(() => {
      trackEvent('tab_viewed', { tab: 'lp_analysis' }, 'some_key');
    }).not.toThrow();

    // Should still send the event even without dedup
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
