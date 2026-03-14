import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Homepage
 *
 * Verifies the main landing page renders correctly
 * and the URL input form works as expected.
 */

test.describe('Homepage', () => {
  test('displays the hero section with correct heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('URLを入れるだけで');
  });

  test('displays the URL input field', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('input[aria-label="分析するURLを入力"]');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', 'https://example.com');
  });

  test('displays the submit button', async ({ page }) => {
    await page.goto('/');
    const button = page.locator('button[type="submit"]');
    await expect(button).toBeVisible();
    await expect(button).toContainText('分析開始');
  });

  test('displays three feature cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=数字が悪い理由が、見える')).toBeVisible();
    await expect(page.locator('text=依頼書まで自動で出る')).toBeVisible();
    await expect(page.locator('text=法令リスクも自動チェック')).toBeVisible();
  });

  test('displays header with Publish Gate branding', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toContainText('Publish Gate');
    await expect(page.locator('header')).toContainText('Phase 0.5 β');
  });

  test('shows validation error for empty URL submission', async ({ page }) => {
    await page.goto('/');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('#url-error')).toContainText('URLを入力してください');
  });

  test('shows validation error for invalid URL', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('input[aria-label="分析するURLを入力"]');
    await input.fill('not-a-valid-url');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('#url-error')).toBeVisible();
  });

  test('clears validation error when user starts typing', async ({ page }) => {
    await page.goto('/');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('#url-error')).toBeVisible();

    const input = page.locator('input[aria-label="分析するURLを入力"]');
    await input.fill('https://example.com');
    await expect(page.locator('#url-error')).not.toBeVisible();
  });

  test('preserves ref parameter from query string', async ({ page }) => {
    // Intercept the API call to check that ref is passed
    let capturedBody: Record<string, unknown> | null = null;
    await page.route('**/api/analyze', async (route) => {
      const request = route.request();
      capturedBody = request.postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'ref-test',
          url: 'https://example.com',
          status: 'completed',
          result: {
            company_understanding: { summary: '', industry: '', business_model: '', brand_tone: { sentence_endings: [], uses_questions: false, tone_keywords: [], example_phrases: [] }, key_vocabulary: [], credentials: [], site_cta_structure: '' },
            page_reading: { page_type: '', fv_main_copy: '', fv_sub_copy: '', cta_map: [], trust_elements: '', content_structure: '', confidence: 'medium', screenshot_insights: '', dom_insights: '' },
            improvement_potential: '', issues: [],
            metadata: { analyzed_at: new Date().toISOString(), analysis_duration_ms: 0, model_used: 'claude-sonnet-4-6', vision_used: false, dom_extracted: true },
          },
          created_at: new Date().toISOString(),
        }),
      });
    });

    await page.goto('/?ref=share');
    const input = page.locator('input[aria-label="分析するURLを入力"]');
    await input.fill('https://example.com');
    await page.locator('button[type="submit"]').click();

    // Wait for the request to be made
    await page.waitForURL('**/analysis/**', { timeout: 5000 });
    expect(capturedBody).toBeDefined();
    expect(capturedBody!.ref).toBe('share');
  });
});
