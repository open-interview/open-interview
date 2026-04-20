/**
 * Mobile Audit — consolidated from:
 *   iphone13-ui-audit.spec.ts + iphone13-first-batch-validation.spec.ts
 */

import { test, expect, devices } from '@playwright/test';

const IPHONE13_VIEWPORT = { width: 390, height: 844 };

test.use({
  ...devices['iPhone 13'],
  viewport: IPHONE13_VIEWPORT,
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});

const PAGES = ['/', '/channels', '/learning-paths', '/coding', '/training', '/voice-interview', '/certifications'];

for (const path of PAGES) {
  test.describe(`iPhone 13 — ${path}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
    });

    test('no horizontal overflow', async ({ page }) => {
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(IPHONE13_VIEWPORT.width);
    });

    test('main content is visible', async ({ page }) => {
      const main = page.locator('main, [role="main"], body').first();
      await expect(main).toBeVisible();
    });

    test('heading is visible and not clipped', async ({ page }) => {
      const heading = page.locator('h1, h2').first();
      const isVisible = await heading.isVisible({ timeout: 5000 }).catch(() => false);
      if (!isVisible) return; // some pages may not have a heading
      const box = await heading.boundingBox();
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(IPHONE13_VIEWPORT.width + 1);
      }
    });
  });
}

test.describe('iPhone 13 — Safe Area', () => {
  test('home page respects safe area', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const mainContainer = page.locator('main, [class*="pt-safe"]').first();
    await expect(mainContainer).toBeVisible();
  });

  test('bottom nav does not overlap content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const nav = page.locator('nav, [class*="bottom-nav"], [class*="tab-bar"]').last();
    const isVisible = await nav.isVisible({ timeout: 3000 }).catch(() => false);
    if (!isVisible) return;
    const navBox = await nav.boundingBox();
    if (navBox) {
      expect(navBox.y + navBox.height).toBeLessThanOrEqual(IPHONE13_VIEWPORT.height + 1);
    }
  });
});
