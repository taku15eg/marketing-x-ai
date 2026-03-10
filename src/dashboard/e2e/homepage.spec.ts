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
    await expect(page.locator('h1')).toContainText('URLを入れるだけで、LP改善が見える');
  });

  test('displays the URL input field', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('input[aria-label="分析するURLを入力"]');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', 'https://example.com/lp');
  });

  test('displays the submit button', async ({ page }) => {
    await page.goto('/');
    const button = page.locator('button[type="submit"]');
    await expect(button).toBeVisible();
    await expect(button).toContainText('分析開始');
  });

  test('displays three feature cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=4ステップAI分析')).toBeVisible();
    await expect(page.locator('text=依頼パック自動生成')).toBeVisible();
    await expect(page.locator('text=薬機法・景表法チェック')).toBeVisible();
  });

  test('displays header with Publish Gate branding', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toContainText('Publish Gate');
    await expect(page.locator('header')).toContainText('Phase 0.5 β');
  });

  test('shows validation error for empty URL submission', async ({ page }) => {
    await page.goto('/');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[role="alert"]')).toContainText('URLを入力してください');
  });

  test('shows validation error for invalid URL', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('input[aria-label="分析するURLを入力"]');
    await input.fill('not-a-valid-url');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test('clears validation error when user starts typing', async ({ page }) => {
    await page.goto('/');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[role="alert"]')).toBeVisible();

    const input = page.locator('input[aria-label="分析するURLを入力"]');
    await input.fill('https://example.com');
    await expect(page.locator('[role="alert"]')).not.toBeVisible();
  });
});
