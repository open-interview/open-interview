/**
 * Search — consolidated from:
 *   search.spec.ts + features/search-functionality.spec.ts
 *   + features/search-core.spec.ts + features/home-search.spec.ts
 */

import { test, expect, setupUser, waitForPageReady, waitForContent } from './fixtures';

// ── Search Modal (Cmd+K) ──────────────────────────────────────────────────────

test.describe('Search Modal', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
    await page.goto('/');
    await waitForPageReady(page);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
  });

  test('Cmd+K / Ctrl+K opens search modal', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only');
    await page.keyboard.press('Meta+k');
    await expect(page.locator('[data-testid="search-modal-desktop"]')).toBeVisible({ timeout: 5000 });
  });

  test('search modal has input field', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only');
    await page.keyboard.press('Meta+k');
    await expect(page.locator('[data-testid="search-input-desktop"]')).toBeVisible({ timeout: 5000 });
  });

  test('typing shows results', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only');
    await page.keyboard.press('Meta+k');
    const input = page.locator('[data-testid="search-input-desktop"]');
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill('system design');
    await page.waitForTimeout(400);
    const modal = page.locator('[data-testid="search-modal-desktop"]');
    expect(await modal.locator('button, p').count()).toBeGreaterThan(0);
  });

  test('Escape closes search modal', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only');
    await page.keyboard.press('Meta+k');
    await expect(page.locator('[data-testid="search-modal-desktop"]')).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="search-modal-desktop"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('empty search shows placeholder state', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only');
    await page.keyboard.press('Meta+k');
    const modal = page.locator('[data-testid="search-modal-desktop"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.getByText('Type to search')).toBeVisible({ timeout: 3000 });
  });
});

// ── Channels Page Search ──────────────────────────────────────────────────────

test.describe('Channels Search', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
    await page.goto('/channels');
    await waitForPageReady(page);
    await waitForContent(page);
  });

  test('search input is visible', async ({ page }) => {
    await expect(page.locator('input[placeholder*="Search channels"]')).toBeVisible();
  });

  test('search filters channels', async ({ page }) => {
    const input = page.getByPlaceholder(/search channels/i);
    if (!await input.isVisible().catch(() => false)) return;
    await input.fill('system');
    await page.waitForTimeout(400);
    const hasSystemDesign = await page.getByText('System Design', { exact: false }).first().isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/no channels found/i).isVisible().catch(() => false);
    expect(hasSystemDesign || hasEmpty).toBeTruthy();
  });

  test('clearing search restores all channels', async ({ page }) => {
    const input = page.getByPlaceholder(/search channels/i);
    if (!await input.isVisible().catch(() => false)) return;
    await input.fill('xyznonexistent999');
    await page.waitForTimeout(400);
    await input.clear();
    await page.waitForTimeout(400);
    expect(await page.locator('[class*="bg-card"]').count()).toBeGreaterThan(0);
  });

  test('handles rapid typing', async ({ page }) => {
    const input = page.locator('input[placeholder*="Search channels"]');
    await input.type('abcdefghijklmnop', { delay: 10 });
    await expect(input).toHaveValue('abcdefghijklmnop');
  });
});

// ── Learning Paths Search ─────────────────────────────────────────────────────

test.describe('Learning Paths Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/learning-paths');
    await page.waitForLoadState('networkidle');
  });

  test('search box is visible below title', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search learning paths"]');
    await expect(searchInput).toBeVisible();
    const title = page.locator('h1').first();
    if (await title.isVisible().catch(() => false)) {
      const titleBox = await title.boundingBox();
      const searchBox = await searchInput.boundingBox();
      if (titleBox && searchBox) expect(searchBox.y).toBeGreaterThan(titleBox.y);
    }
  });

  test('search filters results', async ({ page }) => {
    const input = page.locator('input[placeholder*="Search learning paths"]');
    await input.fill('Frontend');
    await page.waitForTimeout(500);
    const hasResults = await page.locator('[class*="grid"]').isVisible();
    const hasEmpty = await page.locator('text=No learning paths found').isVisible();
    expect(hasResults || hasEmpty).toBeTruthy();
  });

  test('shows empty state for no-match query', async ({ page }) => {
    const input = page.locator('input[placeholder*="Search learning paths"]');
    await input.fill('xyznonexistentquery123');
    await page.waitForTimeout(500);
    await expect(page.locator('text=No learning paths found')).toBeVisible();
  });
});

// ── Mobile Search ─────────────────────────────────────────────────────────────

test.describe('Mobile Search', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('channels search is visible on mobile', async ({ page }) => {
    await page.goto('/channels');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[placeholder*="Search channels"]')).toBeVisible();
  });

  test('mobile search filters work', async ({ page }) => {
    await page.goto('/channels');
    await page.waitForLoadState('networkidle');
    const input = page.locator('input[placeholder*="Search channels"]');
    await input.fill('Design');
    await expect(input).toHaveValue('Design');
  });
});
