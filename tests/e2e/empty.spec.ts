import { test, expect } from '@playwright/test';

test('Basic landing loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toBeTruthy();
});
