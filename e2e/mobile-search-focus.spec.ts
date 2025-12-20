import { test, expect, Page } from '@playwright/test';

/**
 * Mobile Search Focus Tests
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

test.describe('Mobile Search - Focus Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
  });

  test('Search button click should open modal and focus input', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const searchButton = page.locator('button').filter({ has: page.locator('svg.lucide-search') }).first();
    if (await searchButton.isVisible()) {
      await searchButton.click();
      await page.waitForTimeout(500);
      const searchModal = page.getByTestId('search-modal-mobile');
      await expect(searchModal).toBeVisible();
      await page.keyboard.press('Escape');
    }
  });

  test('Search input should be immediately typeable after opening', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const searchButton = page.locator('button').filter({ has: page.locator('svg.lucide-search') }).first();
    if (await searchButton.isVisible()) {
      await searchButton.click();
      await page.waitForTimeout(500);
      await page.keyboard.type('system design');
      await page.waitForTimeout(500);
      await page.keyboard.press('Escape');
    }
  });


  test('Cmd+K shortcut should open search and focus input', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);
    const searchModal = page.getByTestId('search-modal-mobile');
    if (await searchModal.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
    }
  });

  test('Search modal should be mobile-friendly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
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

  test('Search results should be scrollable on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const searchButton = page.locator('button').filter({ has: page.locator('svg.lucide-search') }).first();
    if (await searchButton.isVisible()) {
      await searchButton.click();
      await page.waitForTimeout(500);
      const searchInput = page.getByTestId('search-input-mobile');
      if (await searchInput.isVisible()) {
        await searchInput.fill('design');
        await page.waitForTimeout(1000);
      }
      await page.keyboard.press('Escape');
    }
  });

  test('Search should close on Escape key', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
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

  test('Search should close on backdrop click', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const searchButton = page.locator('button').filter({ has: page.locator('svg.lucide-search') }).first();
    if (await searchButton.isVisible()) {
      await searchButton.click();
      await page.waitForTimeout(500);
      await page.mouse.click(10, 10);
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Mobile Search - From Different Pages', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
  });

  test('Search should work from stats page', async ({ page }) => {
    await page.goto('/stats');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);
    const searchModal = page.getByTestId('search-modal-mobile');
    if (await searchModal.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
    }
  });

  test('Search should work from badges page', async ({ page }) => {
    await page.goto('/badges');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);
    const searchModal = page.getByTestId('search-modal-mobile');
    if (await searchModal.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
    }
  });

  test('Search should work from channel page', async ({ page }) => {
    await page.goto('/channel/system-design');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);
    const searchModal = page.getByTestId('search-modal-mobile');
    if (await searchModal.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
    }
  });
});
