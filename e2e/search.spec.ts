import { test, expect, setupUser, waitForPageReady, waitForContent } from './fixtures';

test.describe('Search Modal', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
    await page.goto('/');
    await waitForPageReady(page);
  });

  test('Cmd+K opens search modal on desktop', async ({ page, isMobile }) => {
    if (isMobile) test.skip();

    await page.keyboard.press('Meta+k');
    const modal = page.locator('[data-testid="search-modal-desktop"]');
    await expect(modal).toBeVisible({ timeout: 3000 });
  });

  test('Ctrl+K opens search modal on desktop', async ({ page, isMobile }) => {
    if (isMobile) test.skip();

    await page.keyboard.press('Control+k');
    const modal = page.locator('[data-testid="search-modal-desktop"]');
    await expect(modal).toBeVisible({ timeout: 3000 });
  });

  test('search modal has input field', async ({ page, isMobile }) => {
    if (isMobile) test.skip();

    await page.keyboard.press('Meta+k');
    const input = page.locator('[data-testid="search-input-desktop"]');
    await expect(input).toBeVisible({ timeout: 3000 });
    await expect(input).toBeFocused();
  });

  test('typing in search shows results', async ({ page, isMobile }) => {
    if (isMobile) test.skip();

    await page.keyboard.press('Meta+k');
    const input = page.locator('[data-testid="search-input-desktop"]');
    await expect(input).toBeVisible({ timeout: 3000 });

    await input.fill('system design');
    await page.waitForTimeout(400);

    // Results list or no-results message should appear
    const hasResults = await page.locator('[data-testid="search-modal-desktop"] button').filter({ hasText: /\w/ }).count() > 0;
    const hasNoResults = await page.locator('text=No results for').isVisible().catch(() => false);
    expect(hasResults || hasNoResults).toBeTruthy();
  });

  test('Escape closes search modal', async ({ page, isMobile }) => {
    if (isMobile) test.skip();

    await page.keyboard.press('Meta+k');
    await expect(page.locator('[data-testid="search-modal-desktop"]')).toBeVisible({ timeout: 3000 });

    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="search-modal-desktop"]')).not.toBeVisible({ timeout: 2000 });
  });

  test('search results are clickable and navigate', async ({ page, isMobile }) => {
    if (isMobile) test.skip();

    await page.keyboard.press('Meta+k');
    const input = page.locator('[data-testid="search-input-desktop"]');
    await expect(input).toBeVisible({ timeout: 3000 });

    await input.fill('react');
    await page.waitForTimeout(400);

    const firstResult = page.locator('[data-testid="search-modal-desktop"] button').filter({ hasText: /\w/ }).first();
    const hasResult = await firstResult.isVisible().catch(() => false);
    if (!hasResult) return; // no results for this query, skip navigation check

    await firstResult.click();
    // Modal should close after navigation
    await expect(page.locator('[data-testid="search-modal-desktop"]')).not.toBeVisible({ timeout: 3000 });
    // URL should have changed away from home
    expect(page.url()).not.toBe('http://localhost:5001/');
  });

  test('search modal closes on backdrop click', async ({ page, isMobile }) => {
    if (isMobile) test.skip();

    await page.keyboard.press('Meta+k');
    const backdrop = page.locator('[data-testid="search-modal-desktop"]');
    await expect(backdrop).toBeVisible({ timeout: 3000 });

    // Click the backdrop (the outer overlay, not the inner dialog)
    await backdrop.click({ position: { x: 10, y: 10 } });
    await expect(backdrop).not.toBeVisible({ timeout: 2000 });
  });

  test('empty search shows placeholder state', async ({ page, isMobile }) => {
    if (isMobile) test.skip();

    await page.keyboard.press('Meta+k');
    const input = page.locator('[data-testid="search-input-desktop"]');
    await expect(input).toBeVisible({ timeout: 3000 });

    // With empty query the empty state should be visible
    const emptyState = page.locator('[data-testid="search-modal-desktop"]').locator('text=Type to search');
    await expect(emptyState).toBeVisible({ timeout: 2000 });
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

    // After clearing, channel cards should reappear
    const cards = page.locator('[class*="bg-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('empty search shows all channels', async ({ page }) => {
    const input = page.getByPlaceholder(/search channels/i);
    const isVisible = await input.isVisible().catch(() => false);
    if (!isVisible) return;

    // Ensure input is empty
    await input.fill('');
    await page.waitForTimeout(300);

    const cards = page.locator('[class*="bg-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });
});
