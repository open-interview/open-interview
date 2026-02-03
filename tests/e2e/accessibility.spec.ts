import { test, expect } from '@playwright/test';

test('Skip link is present for accessibility', async ({ page }) => {
  await page.goto('/');
  const skip = page.locator('a[href="#main-content"]');
  await expect(skip).toBeVisible();
});
