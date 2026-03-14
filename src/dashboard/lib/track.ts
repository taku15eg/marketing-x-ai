/**
 * Client-side event tracking utility.
 * Sends events to /api/track via beacon or fetch.
 * Fire-and-forget: never blocks UI or throws.
 */

type TrackableEvent =
  | 'share_cta_clicked'
  | 'share_reanalyze_clicked'
  | 'powered_by_clicked'
  | 'extension_to_dashboard';

export function trackEvent(event: TrackableEvent, data?: Record<string, string>): void {
  try {
    const payload = JSON.stringify({ event, data });

    // Prefer sendBeacon for navigation-safe tracking
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/track', blob);
      return;
    }

    // Fallback to fetch
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Silently ignore tracking failures
    });
  } catch {
    // Never throw from tracking code
  }
}
