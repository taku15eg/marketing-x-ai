// Main Analysis Pipeline - Orchestrates the 4-step process
// Step 1: Company Research → Step 2: Page Reading → Step 3-4: Diagnosis + Brief

import { nanoid } from 'nanoid';
import { researchCompany } from './company-research';
import { readPage } from './page-reader';
import { analyzeWithClaude } from './prompt-builder';
import type { AnalysisResult, AnalyzeResponse, AnalysisProgress } from './types';

export type ProgressCallback = (progress: AnalysisProgress) => void;

export async function runAnalysis(
  url: string,
  onProgress?: ProgressCallback
): Promise<AnalyzeResponse> {
  const id = nanoid(21);
  const startTime = Date.now();

  try {
    // Step 1: Company Research
    onProgress?.({
      current_step: 'company_research',
      step_number: 1,
      total_steps: 4,
      message: '企業情報を調査中...',
    });

    const company = await researchCompany(url);

    // Step 2: Page Reading (DOM + Screenshot)
    onProgress?.({
      current_step: 'page_reading',
      step_number: 2,
      total_steps: 4,
      message: 'ページを読み取り中...',
    });

    const { dom, screenshot_base64 } = await readPage(url);

    // Step 3: Diagnosis
    onProgress?.({
      current_step: 'diagnosis',
      step_number: 3,
      total_steps: 4,
      message: '課題を診断中...',
    });

    // Step 4: Brief Generation (combined with Step 3 in single Claude call)
    onProgress?.({
      current_step: 'brief_generation',
      step_number: 4,
      total_steps: 4,
      message: '改善提案を作成中...',
    });

    const result = await analyzeWithClaude({
      company,
      dom,
      screenshot_base64,
      url,
    });

    // Update metadata
    result.metadata.analysis_duration_ms = Date.now() - startTime;
    result.metadata.vision_used = screenshot_base64 !== null;

    return {
      id,
      url,
      status: 'completed',
      result,
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    return {
      id,
      url,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      created_at: new Date().toISOString(),
    };
  }
}

// In-memory store for MVP (replace with Supabase in Phase 1)
// TTL: 24 hours for analysis results, 7 days for share links
const ANALYSIS_TTL_MS = 24 * 60 * 60 * 1000;
const SHARE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_STORE_SIZE = 1000;

const analysisStore = new Map<string, AnalyzeResponse & { _stored_at: number }>();
const shareStore = new Map<string, { analysis_id: string; created_at: string; _stored_at: number }>();

function evictExpired() {
  const now = Date.now();
  for (const [key, val] of analysisStore) {
    if (now - val._stored_at > ANALYSIS_TTL_MS) analysisStore.delete(key);
  }
  for (const [key, val] of shareStore) {
    if (now - val._stored_at > SHARE_TTL_MS) shareStore.delete(key);
  }
}

export function storeAnalysis(response: AnalyzeResponse): void {
  // Evict expired entries and cap store size
  evictExpired();
  if (analysisStore.size >= MAX_STORE_SIZE) {
    const oldestKey = analysisStore.keys().next().value;
    if (oldestKey) analysisStore.delete(oldestKey);
  }
  analysisStore.set(response.id, { ...response, _stored_at: Date.now() });
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
