import { test, expect } from '@playwright/test';

test('Mobile bottom nav visibility', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  const bottomNav = page.locator('nav[aria-label="Mobile navigation"]');
  await expect(bottomNav).toBeVisible();
});
