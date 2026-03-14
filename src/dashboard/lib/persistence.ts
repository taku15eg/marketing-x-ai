// Persistence layer for analyses and shares.
// Uses Supabase when configured, falls back to in-memory store for local dev.
//
// Public API:
//   saveAnalysis(response)    → void
//   loadAnalysis(id)          → AnalyzeResponse | null
//   loadAnalysisByUrl(url)    → AnalyzeResponse | null  (cache: 1h)
//   saveShare(shareId, analysisId) → void
//   loadShare(shareId)        → { analysis: AnalyzeResponse; share_id: string; view_count: number } | null
//   incrementShareViews(shareId) → void

import { nanoid } from 'nanoid';
import { getSupabase } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AnalyzeResponse } from './types';

// =============================================================
// Supabase helpers
// =============================================================

async function saveAnalysisSupabase(sb: SupabaseClient, response: AnalyzeResponse): Promise<void> {
  await sb.from('analyses').upsert({
    id: response.id,
    url: response.url,
    status: response.status,
    result: response.result ?? null,
    error: response.error ?? null,
    created_at: response.created_at,
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  });
}

// =============================================================
// Public interface
// =============================================================

export async function saveAnalysis(response: AnalyzeResponse): Promise<void> {
  const sb = getSupabase();
  if (sb) {
    await saveAnalysisSupabase(sb, response);
  }
  // Always write to memory cache as hot layer
  saveAnalysisMemory(response);
}

export async function loadAnalysis(id: string): Promise<AnalyzeResponse | null> {
  // Try memory first (hot cache)
  const mem = loadAnalysisMemory(id);
  if (mem) return mem;

  // Fall through to Supabase
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('analyses')
    .select('*')
    .eq('id', id)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) return null;

  const response = rowToAnalyzeResponse(data);
  // Backfill memory cache
  saveAnalysisMemory(response);
  return response;
}

export async function loadAnalysisByUrl(url: string): Promise<AnalyzeResponse | null> {
  const cacheKey = normalizeUrlForCache(url);

  // Check memory URL cache
  const memCached = loadUrlCacheMemory(cacheKey);
  if (memCached) return memCached;

  // Supabase: find most recent completed analysis for this URL within 1h
  const sb = getSupabase();
  if (!sb) return null;

  const oneHourAgo = new Date(Date.now() - URL_CACHE_TTL_MS).toISOString();
  const { data, error } = await sb
    .from('analyses')
    .select('*')
    .eq('url', cacheKey)
    .eq('status', 'completed')
    .gt('created_at', oneHourAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  const response = rowToAnalyzeResponse(data);
  saveAnalysisMemory(response);
  return response;
}

export async function saveShare(shareId: string, analysisId: string): Promise<void> {
  const sb = getSupabase();
  if (sb) {
    await sb.from('shares').insert({
      id: shareId,
      analysis_id: analysisId,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + SHARE_TTL_MS).toISOString(),
    });
  }
  // Memory fallback
  saveShareMemory(shareId, analysisId);
}

export interface ShareResult {
  analysis: AnalyzeResponse;
  share_id: string;
  view_count: number;
}

export async function loadShare(shareId: string): Promise<ShareResult | null> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from('shares')
      .select('*, analyses(*)')
      .eq('id', shareId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!error && data && data.analyses) {
      const analysis = rowToAnalyzeResponse(data.analyses);
      return {
        analysis,
        share_id: data.id,
        view_count: data.view_count || 0,
      };
    }
  }

  // Fallback to memory
  const memShare = loadShareMemory(shareId);
  if (!memShare) return null;
  const analysis = await loadAnalysis(memShare.analysis_id);
  if (!analysis) return null;
  return { analysis, share_id: shareId, view_count: 0 };
}

export async function incrementShareViews(shareId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  try {
    // Simple increment via raw SQL or update
    const { data } = await sb
      .from('shares')
      .select('view_count')
      .eq('id', shareId)
      .single();

    if (data) {
      await sb
        .from('shares')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', shareId);
    }
  } catch {
    // Non-critical: silently fail view count increment
  }
}

/**
 * Generate a share ID (nanoid 21 chars per CLAUDE.md security requirement).
 */
export function generateShareId(): string {
  return nanoid(21);
}

// =============================================================
// In-memory stores (hot cache + fallback for local dev)
// =============================================================

const ANALYSIS_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const SHARE_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
const URL_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_STORE_SIZE = 1000;

interface StoredAnalysis {
  response: AnalyzeResponse;
  stored_at: number;
}

interface StoredShare {
  analysis_id: string;
  created_at: string;
  stored_at: number;
}

const analysisStore = new Map<string, StoredAnalysis>();
const shareStore = new Map<string, StoredShare>();
const urlCacheStore = new Map<string, { analysis_id: string; stored_at: number }>();

function evictExpired() {
  const now = Date.now();
  for (const [key, val] of analysisStore) {
    if (now - val.stored_at > ANALYSIS_TTL_MS) analysisStore.delete(key);
  }
  for (const [key, val] of shareStore) {
    if (now - val.stored_at > SHARE_TTL_MS) shareStore.delete(key);
  }
  for (const [key, val] of urlCacheStore) {
    if (now - val.stored_at > URL_CACHE_TTL_MS) urlCacheStore.delete(key);
  }
}

function saveAnalysisMemory(response: AnalyzeResponse): void {
  evictExpired();
  if (analysisStore.size >= MAX_STORE_SIZE) {
    const oldestKey = analysisStore.keys().next().value;
    if (oldestKey) analysisStore.delete(oldestKey);
  }
  analysisStore.set(response.id, { response, stored_at: Date.now() });

  if (response.url && response.status === 'completed') {
    const cacheKey = normalizeUrlForCache(response.url);
    urlCacheStore.set(cacheKey, { analysis_id: response.id, stored_at: Date.now() });
  }
}

function loadAnalysisMemory(id: string): AnalyzeResponse | null {
  const entry = analysisStore.get(id);
  if (!entry) return null;
  if (Date.now() - entry.stored_at > ANALYSIS_TTL_MS) {
    analysisStore.delete(id);
    return null;
  }
  return entry.response;
}

function loadUrlCacheMemory(cacheKey: string): AnalyzeResponse | null {
  const cached = urlCacheStore.get(cacheKey);
  if (!cached) return null;
  if (Date.now() - cached.stored_at > URL_CACHE_TTL_MS) {
    urlCacheStore.delete(cacheKey);
    return null;
  }
  return loadAnalysisMemory(cached.analysis_id);
}

function saveShareMemory(shareId: string, analysisId: string): void {
  evictExpired();
  shareStore.set(shareId, {
    analysis_id: analysisId,
    created_at: new Date().toISOString(),
    stored_at: Date.now(),
  });
}

function loadShareMemory(shareId: string): StoredShare | null {
  const share = shareStore.get(shareId);
  if (!share) return null;
  if (Date.now() - share.stored_at > SHARE_TTL_MS) {
    shareStore.delete(shareId);
    return null;
  }
  return share;
}

// =============================================================
// Helpers
// =============================================================

function normalizeUrlForCache(url: string): string {
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

function rowToAnalyzeResponse(row: Record<string, unknown>): AnalyzeResponse {
  return {
    id: row.id as string,
    url: row.url as string,
    status: row.status as AnalyzeResponse['status'],
    result: row.result as AnalyzeResponse['result'],
    error: row.error as string | undefined,
    created_at: row.created_at as string,
  };
}

// =============================================================
// Exports for testing
// =============================================================
export const _testing = {
  analysisStore,
  shareStore,
  urlCacheStore,
  clearAll() {
    analysisStore.clear();
    shareStore.clear();
    urlCacheStore.clear();
  },
  normalizeUrlForCache,
  ANALYSIS_TTL_MS,
  SHARE_TTL_MS,
  URL_CACHE_TTL_MS,
};
