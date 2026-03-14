// Main Analysis Pipeline - Orchestrates the 4-step process
// Step 1: Company Research → Step 2: Page Reading → Step 3-4: Diagnosis + Brief
//
// Storage delegated to persistence.ts (Supabase + in-memory fallback).

import { nanoid } from 'nanoid';
import { researchCompany } from './company-research';
import { readPage } from './page-reader';
import { analyzeWithClaude } from './prompt-builder';
import {
  saveAnalysis,
  loadAnalysis,
  loadAnalysisByUrl,
  saveShare,
  loadShare,
  generateShareId,
  incrementShareViews,
} from './persistence';
import type { AnalyzeResponse, AnalysisProgress } from './types';

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

// Re-export persistence functions with backward-compatible sync wrappers
// for existing callers that expect synchronous API.
// New code should use persistence.ts directly.

export async function storeAnalysis(response: AnalyzeResponse): Promise<void> {
  await saveAnalysis(response);
}

export async function getAnalysis(id: string): Promise<AnalyzeResponse | undefined> {
  const result = await loadAnalysis(id);
  return result ?? undefined;
}

export async function getCachedAnalysisByUrl(url: string): Promise<AnalyzeResponse | undefined> {
  const result = await loadAnalysisByUrl(url);
  return result ?? undefined;
}

export async function createShareId(analysisId: string): Promise<string> {
  const shareId = generateShareId();
  await saveShare(shareId, analysisId);
  return shareId;
}

export async function getShareAnalysis(shareId: string): Promise<AnalyzeResponse | undefined> {
  const result = await loadShare(shareId);
  if (!result) return undefined;
  // Increment view count in background
  incrementShareViews(shareId).catch(() => {});
  return result.analysis;
}
