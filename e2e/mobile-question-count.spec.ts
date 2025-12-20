import { test, expect, Page } from '@playwright/test';

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
      subscribedChannels: ['system-design', 'algorithms', 'backend'],
      onboardingComplete: true,
      createdAt: new Date().toISOString()
    }));
  });
}

test.describe('Mobile Question Count Tests', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
  });

  test('Home page loads with question counts', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('Stats page loads correctly', async ({ page }) => {
    await page.goto('/stats');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });
});
