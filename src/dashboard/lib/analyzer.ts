// Main Analysis Pipeline - Orchestrates the 4-step process
// Step 1: Company Research → Step 2: Page Reading → Step 3-4: Diagnosis + Brief

import { nanoid } from 'nanoid';
import { researchCompany } from './company-research';
import { readPage } from './page-reader';
import { analyzeWithClaude } from './prompt-builder';
import type { AnalysisResult, AnalyzeResponse, AnalysisProgress } from './types';

// Re-export store functions for backward compatibility
export {
  storeAnalysis,
  getAnalysis,
  getCachedAnalysisByUrl,
  createShareId,
  getShareAnalysis,
  normalizeUrlForCache,
} from './store';

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
