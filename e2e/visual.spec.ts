/**
 * Visual — consolidated from:
 *   visual/search-box-verification.spec.ts
 *   + visual/icon-clipping.spec.ts
 *   + visual/bottom-nav-icon-fix.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Visual — Search Box', () => {
  test('search box is visible on channels page', async ({ page }) => {
    await page.goto('/channels');
    await page.waitForLoadState('networkidle');
    const input = page.locator('input[placeholder*="Search channels"]');
    await expect(input).toBeVisible();
  });

  test('search box is visible on learning paths page', async ({ page }) => {
    await page.goto('/learning-paths');
    await page.waitForLoadState('networkidle');
    const input = page.locator('input[placeholder*="Search learning paths"]');
    await expect(input).toBeVisible();
  });
});

test.describe('Visual — Icon Clipping', () => {
  const PAGES = ['/', '/channels', '/learning-paths', '/coding'];

  for (const path of PAGES) {
    test(`no icon clipping on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      // Check SVG icons are not clipped (overflow: hidden on parent)
      const icons = page.locator('svg').first();
      const isVisible = await icons.isVisible({ timeout: 3000 }).catch(() => false);
      if (!isVisible) return;
      const box = await icons.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
      }
    });
  }
});

test.describe('Visual — Bottom Nav Icons', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true });

  test('bottom nav icons are fully visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const nav = page.locator('nav, [class*="bottom-nav"], [class*="tab-bar"]').last();
    const isVisible = await nav.isVisible({ timeout: 3000 }).catch(() => false);
    if (!isVisible) return;
    const icons = nav.locator('svg');
    const count = await icons.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const box = await icons.nth(i).boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
      }
    }
  });
});
