// Client-side event tracking utility for β validation
// Fire-and-forget: never blocks UI or throws errors to user
// Dedup: uses sessionStorage to prevent duplicate events per session

import type { EventType } from './event-logger';

/**
 * Track an event from the client side.
 * Sends to /api/track endpoint. Fire-and-forget.
 * Dedup key prevents the same event from firing twice in the same session.
 */
export function trackEvent(
  type: EventType,
  data: Record<string, string | number | boolean> = {},
  dedupKey?: string
): void {
  try {
    // Dedup check
    if (dedupKey) {
      const storageKey = `pg_track_${dedupKey}`;
      if (typeof sessionStorage !== 'undefined') {
        if (sessionStorage.getItem(storageKey)) return;
        sessionStorage.setItem(storageKey, '1');
      }
    }

    // Fire-and-forget POST
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data }),
      keepalive: true,
    }).catch(() => {
      // Silently ignore - tracking must never break UX
    });
  } catch {
    // Silently ignore
  }
}
