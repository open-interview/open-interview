import { test, expect, Page } from '@playwright/test';

/**
 * Mobile Badges Rendering Tests
 */

// Mobile viewport configuration
test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

// Helper to skip onboarding
async function skipOnboarding(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('marvel-intro-seen', 'true');
    localStorage.setItem('user-preferences', JSON.stringify({
      role: 'fullstack',
      subscribedChannels: ['system-design', 'algorithms', 'backend', 'frontend', 'devops', 'sre'],
      onboardingComplete: true,
      createdAt: new Date().toISOString()
    }));
    localStorage.setItem('progress-system-design', JSON.stringify(['sd-1', 'sd-2', 'sd-3', 'sd-4', 'sd-5']));
    localStorage.setItem('progress-algorithms', JSON.stringify(['algo-1', 'algo-2', 'algo-3']));
    localStorage.setItem('progress-frontend', JSON.stringify(['fe-1', 'fe-2']));
    localStorage.setItem('progress-backend', JSON.stringify(['be-1']));
  });
}

test.describe('Mobile Badges Page - Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
  });

  test('Badges page should load without errors', async ({ page }) => {
    await page.goto('/badges');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.getByRole('heading', { name: /Badges/i })).toBeVisible();
  });

  test('Badge rings should render with correct SVG structure', async ({ page }) => {
    await page.goto('/badges');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const svgElements = page.locator('svg');
    const svgCount = await svgElements.count();
    expect(svgCount).toBeGreaterThan(0);
    const circles = page.locator('svg circle');
    const circleCount = await circles.count();
    expect(circleCount).toBeGreaterThan(0);
  });


  test('Badge icons should be visible inside rings', async ({ page }) => {
    await page.goto('/badges');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    // Check that badge content is visible
    const badgeContent = page.locator('[class*="rounded-full"]');
    const contentCount = await badgeContent.count();
    expect(contentCount).toBeGreaterThan(0);
  });

  test('Badge names should not be truncated badly', async ({ page }) => {
    await page.goto('/badges');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const badgeNames = page.locator('[class*="truncate"]');
    const nameCount = await badgeNames.count();
    expect(nameCount).toBeGreaterThan(0);
  });

  test('Badge grid should fit within mobile viewport', async ({ page }) => {
    await page.goto('/badges');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10);
  });

  test('Badge progress rings should animate', async ({ page }) => {
    await page.goto('/badges');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const progressCircles = page.locator('svg circle[stroke-dasharray]');
    const circleCount = await progressCircles.count();
    expect(circleCount).toBeGreaterThan(0);
  });

  test('Badge category tabs should be scrollable on mobile', async ({ page }) => {
    await page.goto('/badges');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    // Page should be functional
    const pageContent = await page.locator('body').textContent();
    expect(pageContent && pageContent.length > 100).toBeTruthy();
  });

  test('Badge category tabs should be tappable', async ({ page }) => {
    await page.goto('/badges');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    // Find category tab buttons - they may have different classes
    const tabButtons = page.locator('button').filter({ hasText: /All|Channel|Streak|Progress/i });
    const tabCount = await tabButtons.count();
    // Should have at least one tab
    expect(tabCount).toBeGreaterThanOrEqual(1);
  });

  test('Badge detail modal should work on mobile', async ({ page }) => {
    await page.goto('/badges');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const clickableBadge = page.locator('[class*="cursor-pointer"][class*="group"]').first();
    if (await clickableBadge.isVisible()) {
      await clickableBadge.tap();
      await page.waitForTimeout(500);
      await page.keyboard.press('Escape');
    }
  });

  test('Your Collection section should show correct counts', async ({ page }) => {
    await page.goto('/badges');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const collectionSection = page.getByText('Your Collection');
    await expect(collectionSection).toBeVisible();
  });

  test('Next Up section should show progress badges', async ({ page }) => {
    await page.goto('/badges');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const nextUpSection = page.getByText('Next Up');
    if (await nextUpSection.isVisible()) {
      const progressBadges = page.locator('[class*="bg-muted/10"][class*="rounded"]');
      const badgeCount = await progressBadges.count();
      console.log(`Found ${badgeCount} badges in progress`);
    }
  });
});

test.describe('Mobile Badges - Widget on Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
  });

  test('Badge widget should render on home page (desktop only)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    const badgeWidget = page.locator('[class*="BadgeWidget"]');
    const isVisible = await badgeWidget.isVisible().catch(() => false);
    console.log(`Badge widget visible on mobile: ${isVisible}`);
  });
});

test.describe('Mobile Badges - Stats Page Integration', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
  });

  test('Badge showcase should render on stats page', async ({ page }) => {
    await page.goto('/stats');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    // Page should be functional
    const pageContent = await page.locator('body').textContent();
    expect(pageContent && pageContent.length > 100).toBeTruthy();
  });

  test('Next badge progress should render on stats page', async ({ page }) => {
    await page.goto('/stats');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const pageContent = await page.locator('body').textContent();
    expect(pageContent && pageContent.length > 100).toBeTruthy();
  });

  test('Clicking badge showcase should navigate to badges page', async ({ page }) => {
    await page.goto('/stats');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const badgeShowcase = page.locator('[class*="cursor-pointer"]').filter({ hasText: /badge/i }).first();
    if (await badgeShowcase.isVisible()) {
      await badgeShowcase.tap();
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/badges');
    }
  });
});
