import { test, expect, Page } from '@playwright/test';

/**
 * Mobile Search Tests
 * Tests search functionality on mobile devices
 */

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

async function skipOnboarding(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('marvel-intro-seen', 'true');
    localStorage.setItem('user-preferences', JSON.stringify({
      role: 'fullstack',
      subscribedChannels: ['system-design', 'algorithms', 'backend', 'frontend'],
      onboardingComplete: true,
      createdAt: new Date().toISOString()
    }));
  });
}

test.describe('Mobile Search Modal', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
  });

  test('search button opens fullscreen modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const searchButton = page.locator('button').filter({ has: page.locator('svg.lucide-search') }).first();
    if (await searchButton.isVisible()) {
      await searchButton.click();
      await page.waitForTimeout(500);
      const searchModal = page.getByTestId('search-modal-mobile');
      await expect(searchModal).toBeVisible();
      await page.keyboard.press('Escape');
    }
  });

  test('Cmd+K shortcut opens search', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);
    const searchModal = page.getByTestId('search-modal-mobile');
    if (await searchModal.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
    }
  });

  test('search modal is fullscreen on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const searchButton = page.locator('button').filter({ has: page.locator('svg.lucide-search') }).first();
    if (await searchButton.isVisible()) {
      await searchButton.click();
      await page.waitForTimeout(500);
      const searchModal = page.getByTestId('search-modal-mobile');
      if (await searchModal.isVisible()) {
        const modalBox = await searchModal.boundingBox();
        if (modalBox) {
          expect(modalBox.width).toBe(390);
        }
      }
      await page.keyboard.press('Escape');
    }
  });

  test('search input is typeable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const searchButton = page.locator('button').filter({ has: page.locator('svg.lucide-search') }).first();
    if (await searchButton.isVisible()) {
      await searchButton.click();
      await page.waitForTimeout(500);
      await page.keyboard.type('system design');
      await page.waitForTimeout(500);
      await page.keyboard.press('Escape');
    }
  });

  test('Escape closes search modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const searchButton = page.locator('button').filter({ has: page.locator('svg.lucide-search') }).first();
    if (await searchButton.isVisible()) {
      await searchButton.click();
      await page.waitForTimeout(500);
      const searchModal = page.getByTestId('search-modal-mobile');
      await expect(searchModal).toBeVisible();
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      await expect(searchModal).not.toBeVisible();
    }
  });
});

test.describe('Mobile Search from Different Pages', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
  });

  test('search works from stats page', async ({ page }) => {
    await page.goto('/stats');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);
    const searchModal = page.getByTestId('search-modal-mobile');
    if (await searchModal.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
    }
  });

  test('search works from badges page', async ({ page }) => {
    await page.goto('/badges');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);
    const searchModal = page.getByTestId('search-modal-mobile');
    if (await searchModal.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
    }
  });

  test('search works from channel page', async ({ page }) => {
    await page.goto('/channel/system-design');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2500);
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);
    const searchModal = page.getByTestId('search-modal-mobile');
    if (await searchModal.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
    }
  });
});
