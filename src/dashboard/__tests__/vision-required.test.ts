/**
 * Vision Analysis Required - Unit Tests
 *
 * Verifies that Vision analysis failure is properly handled:
 * - confidence is forced to 'low' when vision is unavailable
 * - vision_status is correctly set
 * - prompt includes DOM-only warning when no screenshot
 * - UI shows warning banner when vision is not used
 * - retry logic is present in screenshot capture
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Vision Required - Type Definitions', () => {
  const typesSource = fs.readFileSync(
    path.resolve(__dirname, '../lib/types.ts'),
    'utf-8'
  );

  it('defines VisionStatus type with all states', () => {
    expect(typesSource).toContain("'used'");
    expect(typesSource).toContain("'failed'");
    expect(typesSource).toContain("'no_api_key'");
  });

  it('includes vision_status in AnalysisMetadata', () => {
    expect(typesSource).toContain('vision_status: VisionStatus');
  });
});

describe('Vision Required - Screenshot Retry Logic', () => {
  const pageReaderSource = fs.readFileSync(
    path.resolve(__dirname, '../lib/page-reader.ts'),
    'utf-8'
  );

  it('implements retry logic with maxAttempts parameter', () => {
    expect(pageReaderSource).toContain('captureScreenshotWithRetry');
    expect(pageReaderSource).toContain('maxAttempts');
  });

  it('retries with 2 second delay between attempts', () => {
    expect(pageReaderSource).toContain('setTimeout(r, 2000)');
  });

  it('returns vision_status: no_api_key when SCREENSHOT_API_KEY is missing', () => {
    expect(pageReaderSource).toContain("vision_status: 'no_api_key'");
  });

  it('returns vision_status: failed after all retries exhausted', () => {
    expect(pageReaderSource).toContain("vision_status: 'failed'");
  });

  it('returns vision_status: used on success', () => {
    expect(pageReaderSource).toContain("vision_status: 'used'");
  });

  it('exports ScreenshotResult type', () => {
    expect(pageReaderSource).toContain('export interface ScreenshotResult');
    expect(pageReaderSource).toContain('vision_status: VisionStatus');
  });

  it('returns vision_status from readPage', () => {
    expect(pageReaderSource).toContain('vision_status: screenshot.vision_status');
  });
});

describe('Vision Required - Confidence Enforcement', () => {
  const analyzerSource = fs.readFileSync(
    path.resolve(__dirname, '../lib/analyzer.ts'),
    'utf-8'
  );

  it('forces confidence to low when vision is not used', () => {
    expect(analyzerSource).toContain("vision_status !== 'used'");
    expect(analyzerSource).toContain("result.page_reading.confidence = 'low'");
  });

  it('sets vision_status in result metadata', () => {
    expect(analyzerSource).toContain('result.metadata.vision_status = vision_status');
  });
});

describe('Vision Required - Prompt Adjustment for DOM-only', () => {
  const promptSource = fs.readFileSync(
    path.resolve(__dirname, '../lib/prompt-builder.ts'),
    'utf-8'
  );

  it('includes DOM-only warning when no screenshot', () => {
    expect(promptSource).toContain('スクリーンショットが取得できませんでした');
  });

  it('instructs Claude to set confidence to low in DOM-only mode', () => {
    expect(promptSource).toContain('confidenceは必ず"low"に設定');
  });

  it('instructs Claude to note screenshot unavailability in insights', () => {
    expect(promptSource).toContain('スクリーンショット未取得のため視覚分析なし');
  });

  it('still includes screenshot instruction when available', () => {
    expect(promptSource).toContain('ファーストビューのスクリーンショット');
  });

  it('sets default vision_status in parsed response metadata', () => {
    expect(promptSource).toContain("vision_status: 'failed'");
  });
});

describe('Vision Required - UI Warning Banner', () => {
  const uiSource = fs.readFileSync(
    path.resolve(__dirname, '../components/AnalysisResult.tsx'),
    'utf-8'
  );

  it('shows low confidence mode banner when vision is not used', () => {
    expect(uiSource).toContain('低信頼モード');
    expect(uiSource).toContain('Vision分析なし');
  });

  it('explains why results may be less accurate', () => {
    expect(uiSource).toContain('日本のLPは画像ベースの構成が多く');
    expect(uiSource).toContain('結果の精度が通常より低い可能性があります');
  });

  it('uses role="alert" for accessibility', () => {
    expect(uiSource).toContain('role="alert"');
  });

  it('shows Vision未使用 badge in metadata footer when vision is not used', () => {
    expect(uiSource).toContain('Vision未使用（低信頼）');
  });

  it('shows Vision API使用 badge when vision is used', () => {
    expect(uiSource).toContain('Vision API使用');
  });

  it('conditionally renders based on vision_used metadata', () => {
    expect(uiSource).toContain('visionUnavailable');
    expect(uiSource).toContain('result.metadata.vision_used');
  });
});

describe('Vision Required - Chrome Extension Retry', () => {
  const swSource = fs.readFileSync(
    path.resolve(__dirname, '../../extension/background/service-worker.js'),
    'utf-8'
  );

  it('retries screenshot capture in Chrome extension', () => {
    expect(swSource).toContain('attempt <= 2');
    expect(swSource).toContain('setTimeout');
  });

  it('logs which attempt failed', () => {
    expect(swSource).toContain('Screenshot attempt');
  });
});

describe('Vision Required - Chrome Extension UI Warning', () => {
  const appSource = fs.readFileSync(
    path.resolve(__dirname, '../../extension/sidepanel/app.js'),
    'utf-8'
  );
  const cssSource = fs.readFileSync(
    path.resolve(__dirname, '../../extension/sidepanel/styles.css'),
    'utf-8'
  );

  it('shows low-confidence warning banner when vision is not used', () => {
    expect(appSource).toContain('vision-warning');
    expect(appSource).toContain('低信頼モード');
    expect(appSource).toContain('Vision分析なし');
  });

  it('checks vision_used from metadata', () => {
    expect(appSource).toContain('metadata.vision_used');
  });

  it('shows Vision未使用 badge when vision is not used', () => {
    expect(appSource).toContain('Vision未使用（低信頼）');
  });

  it('uses role="alert" for accessibility', () => {
    expect(appSource).toContain('role="alert"');
  });

  it('has CSS styles for vision warning', () => {
    expect(cssSource).toContain('.vision-warning');
    expect(cssSource).toContain('.vision-warning-title');
    expect(cssSource).toContain('.vision-warning-text');
  });
});

describe('Vision Required - Parallel Fetch Optimization', () => {
  const pageReaderSource = fs.readFileSync(
    path.resolve(__dirname, '../lib/page-reader.ts'),
    'utf-8'
  );

  it('runs HTML fetch and screenshot capture in parallel', () => {
    expect(pageReaderSource).toContain('Promise.all');
    expect(pageReaderSource).toContain('fetchWithSSRFProtection');
    expect(pageReaderSource).toContain('captureScreenshotWithRetry');
  });
});

describe('Vision Required - Cache Skips Low-Confidence Results', () => {
  const analyzerSource = fs.readFileSync(
    path.resolve(__dirname, '../lib/analyzer.ts'),
    'utf-8'
  );

  it('only caches results where vision was successfully used', () => {
    expect(analyzerSource).toContain('visionUsed');
    expect(analyzerSource).toContain("response.status === 'completed' && visionUsed");
  });
});
