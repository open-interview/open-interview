import { test, expect } from '@playwright/test';

test('Home to Channels navigation', async ({ page }) => {
  await page.goto('/');
  // Navigate via the mobile/primary navigation card
  await page.click('text=Explore');
  await expect(page).toHaveURL(/\/channels/);
});

test('Unknown route goes to NotFound', async ({ page }) => {
  await page.goto('/random-non-existent-path');
  // Should land on NotFound content or route
  await expect(page).toHaveURL(/not-found|404/);
});
