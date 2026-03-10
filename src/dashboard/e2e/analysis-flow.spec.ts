import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Analysis Flow
 *
 * Tests the full analysis flow from URL submission
 * through loading states to results display.
 */

test.describe('Analysis Flow', () => {
  test('shows loading progress after URL submission', async ({ page }) => {
    await page.goto('/');

    // Mock the analyze API to delay response
    await page.route('**/api/analyze', async (route) => {
      // Delay to observe loading state
      await new Promise((r) => setTimeout(r, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-id-123',
          url: 'https://example.com',
          status: 'completed',
          result: {
            company_understanding: { summary: 'Test', industry: 'Tech', business_model: 'B2B', brand_tone: { sentence_endings: [], uses_questions: false, tone_keywords: [], example_phrases: [] }, key_vocabulary: [], credentials: [], site_cta_structure: '' },
            page_reading: { page_type: 'LP', fv_main_copy: 'Test Copy', fv_sub_copy: '', cta_map: [], trust_elements: '', content_structure: '', confidence: 'high', screenshot_insights: '', dom_insights: '' },
            improvement_potential: '+15%',
            issues: [{ priority: 1, title: 'FVのメインコピーが弱い', diagnosis: 'CTAが見えにくい', impact: 'high', handoff_to: 'designer', brief: { objective: 'CTA改善', direction: '目立つ位置に', specifics: 'ボタンサイズ拡大', constraints: [], qa_checklist: [] }, evidence: 'DOM分析' }],
            metadata: { analyzed_at: new Date().toISOString(), analysis_duration_ms: 5000, model_used: 'claude-sonnet-4-5-20250514', vision_used: false, dom_extracted: true },
          },
          created_at: new Date().toISOString(),
        }),
      });
    });

    const input = page.locator('input[aria-label="分析するURLを入力"]');
    await input.fill('https://example.com');
    await page.locator('button[type="submit"]').click();

    // Should show loading state
    await expect(page.locator('text=企業情報を調査中')).toBeVisible({ timeout: 3000 });
  });

  test('navigates to analysis page on success', async ({ page }) => {
    await page.route('**/api/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'nav-test-id',
          url: 'https://example.com',
          status: 'completed',
          result: {
            company_understanding: { summary: 'Test', industry: 'Tech', business_model: 'B2B', brand_tone: { sentence_endings: [], uses_questions: false, tone_keywords: [], example_phrases: [] }, key_vocabulary: [], credentials: [], site_cta_structure: '' },
            page_reading: { page_type: 'LP', fv_main_copy: 'Test', fv_sub_copy: '', cta_map: [], trust_elements: '', content_structure: '', confidence: 'high', screenshot_insights: '', dom_insights: '' },
            improvement_potential: '+10%',
            issues: [],
            metadata: { analyzed_at: new Date().toISOString(), analysis_duration_ms: 3000, model_used: 'claude-sonnet-4-5-20250514', vision_used: false, dom_extracted: true },
          },
          created_at: new Date().toISOString(),
        }),
      });
    });

    await page.goto('/');
    const input = page.locator('input[aria-label="分析するURLを入力"]');
    await input.fill('https://example.com');
    await page.locator('button[type="submit"]').click();

    // Should navigate to /analysis/:id
    await page.waitForURL('**/analysis/nav-test-id', { timeout: 10000 });
    expect(page.url()).toContain('/analysis/nav-test-id');
  });

  test('displays error message on API failure', async ({ page }) => {
    await page.route('**/api/analyze', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'プライベートIPアドレスへのアクセスは許可されていません' }),
      });
    });

    await page.goto('/');
    const input = page.locator('input[aria-label="分析するURLを入力"]');
    await input.fill('https://example.com');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('text=プライベートIPアドレス')).toBeVisible({ timeout: 5000 });
  });

  test('displays error for rate-limited requests', async ({ page }) => {
    await page.route('**/api/analyze', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: '月間の無料分析回数（5回）に達しました。',
          reset_at: new Date(Date.now() + 86400000).toISOString(),
        }),
      });
    });

    await page.goto('/');
    const input = page.locator('input[aria-label="分析するURLを入力"]');
    await input.fill('https://example.com');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('text=月間の無料分析回数')).toBeVisible({ timeout: 5000 });
  });

  test('retry button clears error and shows input again', async ({ page }) => {
    await page.route('**/api/analyze', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'サーバーエラー' }),
      });
    });

    await page.goto('/');
    const input = page.locator('input[aria-label="分析するURLを入力"]');
    await input.fill('https://example.com');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('text=サーバーエラー')).toBeVisible({ timeout: 5000 });

    await page.locator('text=再試行').click();
    await expect(page.locator('input[aria-label="分析するURLを入力"]')).toBeVisible();
  });
});
