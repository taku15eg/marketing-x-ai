// In-memory store for MVP (replace with Supabase in Phase 1)
// Manages analysis results, share links, and URL-based caching.

import { nanoid } from 'nanoid';
import type { AnalyzeResponse } from './types';

const ANALYSIS_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const SHARE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const URL_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_STORE_SIZE = 1000;

interface StoredAnalysis extends AnalyzeResponse {
  _stored_at: number;
}

interface ShareEntry {
  analysis_id: string;
  created_at: string;
  _stored_at: number;
}

interface UrlCacheEntry {
  analysis_id: string;
  _stored_at: number;
}

const analysisStore = new Map<string, StoredAnalysis>();
const shareStore = new Map<string, ShareEntry>();
const urlCacheStore = new Map<string, UrlCacheEntry>();

function evictExpired(): void {
  const now = Date.now();
  for (const [key, val] of analysisStore) {
    if (now - val._stored_at > ANALYSIS_TTL_MS) analysisStore.delete(key);
  }
  for (const [key, val] of shareStore) {
    if (now - val._stored_at > SHARE_TTL_MS) shareStore.delete(key);
  }
  for (const [key, val] of urlCacheStore) {
    if (now - val._stored_at > URL_CACHE_TTL_MS) urlCacheStore.delete(key);
  }
}

/**
 * Normalize URL for cache key: strip trailing slash, fragment, sort query params
 */
export function normalizeUrlForCache(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    const params = [...parsed.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));
    parsed.search = params.length ? '?' + params.map(([k, v]) => `${k}=${v}`).join('&') : '';
    let normalized = parsed.toString();
    if (normalized.endsWith('/') && parsed.pathname !== '/') {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return url;
  }
}

/**
 * Check if a recent analysis for the same URL exists (within 1h).
 * Returns the cached AnalyzeResponse or undefined.
 */
export function getCachedAnalysisByUrl(url: string): AnalyzeResponse | undefined {
  const cacheKey = normalizeUrlForCache(url);
  const cached = urlCacheStore.get(cacheKey);
  if (!cached) return undefined;
  if (Date.now() - cached._stored_at > URL_CACHE_TTL_MS) {
    urlCacheStore.delete(cacheKey);
    return undefined;
  }
  return getAnalysis(cached.analysis_id);
}

export function storeAnalysis(response: AnalyzeResponse): void {
  evictExpired();
  if (analysisStore.size >= MAX_STORE_SIZE) {
    const oldestKey = analysisStore.keys().next().value;
    if (oldestKey) analysisStore.delete(oldestKey);
  }
  analysisStore.set(response.id, { ...response, _stored_at: Date.now() });

  if (response.url && response.status === 'completed') {
    const cacheKey = normalizeUrlForCache(response.url);
    urlCacheStore.set(cacheKey, { analysis_id: response.id, _stored_at: Date.now() });
  }
}

export function getAnalysis(id: string): AnalyzeResponse | undefined {
  const entry = analysisStore.get(id);
  if (!entry) return undefined;
  if (Date.now() - entry._stored_at > ANALYSIS_TTL_MS) {
    analysisStore.delete(id);
    return undefined;
  }
  const { _stored_at: _, ...response } = entry;
  return response;
}

export function createShareId(analysisId: string): string {
  evictExpired();
  const shareId = nanoid(21);
  shareStore.set(shareId, {
    analysis_id: analysisId,
    created_at: new Date().toISOString(),
    _stored_at: Date.now(),
  });
  return shareId;
}

export function getShareAnalysis(shareId: string): AnalyzeResponse | undefined {
  const share = shareStore.get(shareId);
  if (!share) return undefined;
  if (Date.now() - share._stored_at > SHARE_TTL_MS) {
    shareStore.delete(shareId);
    return undefined;
  }
  return getAnalysis(share.analysis_id);
}
