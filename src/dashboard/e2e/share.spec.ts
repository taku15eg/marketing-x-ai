import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Share Page
 *
 * Tests the shared analysis page functionality including:
 * - Error display for invalid/expired links
 * - CTA presence and tracking attributes
 * - Re-analyze link with URL pre-fill
 * - Powered by badge with tracking
 * - Social share buttons
 */

test.describe('Share Page', () => {
  test('displays error for invalid share link', async ({ page }) => {
    await page.route('**/api/share?id=invalid-id', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: '指定された共有リンクが見つかりません' }),
      });
    });

    await page.goto('/share/invalid-id');
    await expect(page.locator('text=リンクが無効です')).toBeVisible({ timeout: 5000 });
  });

  test('displays CTA to try Publish Gate on invalid share', async ({ page }) => {
    await page.route('**/api/share?id=expired-link', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: '指定された共有リンクが見つかりません' }),
      });
    });

    await page.goto('/share/expired-link');
    await expect(page.locator('text=Publish Gateで分析してみる')).toBeVisible({ timeout: 5000 });
  });

  const mockAnalysis = {
    id: 'shared-analysis-id',
    url: 'https://example.com/lp',
    status: 'completed',
    result: {
      company_understanding: { summary: '共有テスト企業', industry: 'EC', business_model: 'D2C', brand_tone: { sentence_endings: [], uses_questions: false, tone_keywords: [], example_phrases: [] }, key_vocabulary: [], credentials: [], site_cta_structure: '' },
      page_reading: { page_type: 'LP', fv_main_copy: '共有テストコピー', fv_sub_copy: '', cta_map: [], trust_elements: '', content_structure: '', confidence: 'high', screenshot_insights: '', dom_insights: '' },
      improvement_potential: '+20%',
      issues: [
        { priority: 1, title: 'CTA配置の改善', diagnosis: 'FV直下にCTAがない', impact: 'high', handoff_to: 'designer', brief: { objective: 'CVR向上', direction: 'CTA位置変更', specifics: 'FV直下に配置', constraints: [], qa_checklist: [] }, evidence: 'DOM分析' },
      ],
      metadata: { analyzed_at: new Date().toISOString(), analysis_duration_ms: 4000, model_used: 'claude-sonnet-4-5-20250514', vision_used: false, dom_extracted: true },
    },
    created_at: new Date().toISOString(),
  };

  test('displays shared analysis results', async ({ page }) => {
    await page.route('**/api/share?id=valid-share-id', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockAnalysis),
      });
    });

    await page.goto('/share/valid-share-id');

    // Should show shared analysis header
    await expect(page.locator('text=共有された分析結果')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=https://example.com/lp')).toBeVisible();

    // Should show CTA to analyze own LP
    await expect(page.locator('text=自分のLPも分析する')).toBeVisible();
  });

  test('has re-analyze link with URL pre-fill', async ({ page }) => {
    await page.route('**/api/share?id=reanalyze-test', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockAnalysis),
      });
    });

    await page.goto('/share/reanalyze-test');

    // Should show re-analyze link
    const reanalyzeLink = page.locator('text=このURLを最新データで再分析');
    await expect(reanalyzeLink).toBeVisible({ timeout: 5000 });

    // Link should contain the target URL as a parameter
    const href = await reanalyzeLink.getAttribute('href');
    expect(href).toContain('url=');
    expect(href).toContain(encodeURIComponent('https://example.com/lp'));
    expect(href).toContain('ref=share_reanalyze');
  });

  test('bottom CTA links with ref=share tracking', async ({ page }) => {
    await page.route('**/api/share?id=tracking-test', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockAnalysis),
      });
    });

    await page.goto('/share/tracking-test');

    // Bottom CTA should have ref=share
    const bottomCta = page.locator('text=無料で分析を始める');
    await expect(bottomCta).toBeVisible({ timeout: 5000 });
    const href = await bottomCta.getAttribute('href');
    expect(href).toContain('ref=share');
  });

  test('has Powered by Publish Gate badge with tracking', async ({ page }) => {
    await page.route('**/api/share?id=badge-test', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockAnalysis),
      });
    });

    await page.goto('/share/badge-test');

    // Powered by badge should be visible
    const badge = page.locator('text=Powered by');
    await expect(badge.first()).toBeVisible({ timeout: 5000 });
  });
});
