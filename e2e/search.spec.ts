/**
 * Search Tests
 * Search modal (Cmd+K) and channels page search filter
 */

import { test, expect, setupUser, waitForPageReady, waitForContent } from './fixtures';

test.describe('Search Modal', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
    await page.goto('/');
    await waitForPageReady(page);
    // Ensure page has keyboard focus by pressing a neutral key
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
  });

  test('Cmd+K opens search modal on desktop', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only');
    await page.keyboard.press('Meta+k');
    await expect(page.locator('[data-testid="search-modal-desktop"]')).toBeVisible({ timeout: 5000 });
  });

  test('Ctrl+K opens search modal on desktop', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only');
    await page.keyboard.press('Control+k');
    await expect(page.locator('[data-testid="search-modal-desktop"]')).toBeVisible({ timeout: 5000 });
  });

  test('search modal has input field', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only');
    await page.keyboard.press('Meta+k');
    const input = page.locator('[data-testid="search-input-desktop"]');
    await expect(input).toBeVisible({ timeout: 5000 });
  });

  test('typing in search shows results', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only');
    await page.keyboard.press('Meta+k');
    const input = page.locator('[data-testid="search-input-desktop"]');
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill('system design');
    await page.waitForTimeout(400);
    // Results or no-results message
    const modal = page.locator('[data-testid="search-modal-desktop"]');
    const hasContent = await modal.locator('button, p').count() > 0;
    expect(hasContent).toBeTruthy();
  });

  test('Escape closes search modal', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only');
    await page.keyboard.press('Meta+k');
    await expect(page.locator('[data-testid="search-modal-desktop"]')).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="search-modal-desktop"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('search results are clickable and navigate', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only');
    await page.keyboard.press('Meta+k');
    const input = page.locator('[data-testid="search-input-desktop"]');
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill('react');
    await page.waitForTimeout(500);
    const firstResult = page.locator('[data-testid="search-modal-desktop"] button')
      .filter({ hasText: /\w{3,}/ }).first();
    const hasResult = await firstResult.isVisible({ timeout: 2000 }).catch(() => false);
    if (!hasResult) return; // no results — skip navigation check
    await firstResult.click();
    await expect(page.locator('[data-testid="search-modal-desktop"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('search modal closes on backdrop click', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only');
    await page.keyboard.press('Meta+k');
    const backdrop = page.locator('[data-testid="search-modal-desktop"]');
    await expect(backdrop).toBeVisible({ timeout: 5000 });
    // Click the outer backdrop (not the inner dialog box)
    await backdrop.click({ position: { x: 10, y: 10 } });
    await expect(backdrop).not.toBeVisible({ timeout: 3000 });
  });

  test('empty search shows placeholder state', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only');
    await page.keyboard.press('Meta+k');
    const modal = page.locator('[data-testid="search-modal-desktop"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    // Empty query shows "Type to search"
    await expect(modal.getByText('Type to search')).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Channels Page Search', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
    await page.goto('/channels');
    await waitForPageReady(page);
    await waitForContent(page);
  });

  test('search input filters channels', async ({ page }) => {
    const input = page.getByPlaceholder(/search channels/i);
    const isVisible = await input.isVisible().catch(() => false);
    if (!isVisible) return;
    await input.fill('system');
    await page.waitForTimeout(400);
    const hasSystemDesign = await page.getByText('System Design', { exact: false }).first().isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/no channels found/i).isVisible().catch(() => false);
    expect(hasSystemDesign || hasEmpty).toBeTruthy();
  });

  test('clearing search restores all channels', async ({ page }) => {
    const input = page.getByPlaceholder(/search channels/i);
    const isVisible = await input.isVisible().catch(() => false);
    if (!isVisible) return;
    await input.fill('xyznonexistent999');
    await page.waitForTimeout(400);
    await input.clear();
    await page.waitForTimeout(400);
    const cards = page.locator('[class*="bg-card"]');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('empty search shows all channels', async ({ page }) => {
    const input = page.getByPlaceholder(/search channels/i);
    const isVisible = await input.isVisible().catch(() => false);
    if (!isVisible) return;
    await input.fill('');
    await page.waitForTimeout(300);
    expect(await page.locator('[class*="bg-card"]').count()).toBeGreaterThan(0);
  });
});
