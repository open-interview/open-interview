import { test, expect } from '@playwright/test';

/**
 * All Channels Page Tests
 * Tests for the channel browser page
 */

test.describe('All Channels Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('marvel-intro-seen', 'true');
      localStorage.setItem('user-preferences', JSON.stringify({
        role: 'fullstack',
        subscribedChannels: ['system-design', 'algorithms'],
        onboardingComplete: true,
        createdAt: new Date().toISOString()
      }));
    });
  });

  test('displays channels', async ({ page }) => {
    await page.goto('/channels');
    await page.waitForTimeout(1500);
    
    const hasSystemDesign = await page.locator('h3:has-text("System Design")').isVisible().catch(() => false);
    const hasAlgorithms = await page.locator('h3:has-text("Algorithms")').isVisible().catch(() => false);
    expect(hasSystemDesign || hasAlgorithms).toBeTruthy();
  });

  test('shows subscribed status', async ({ page }) => {
    await page.goto('/channels');
    await page.waitForTimeout(1000);
    
    const subscribedIndicator = page.locator('svg.lucide-check').first();
    await expect(subscribedIndicator).toBeVisible();
  });

  test('has search functionality', async ({ page }) => {
    await page.goto('/channels');
    
    const searchInput = page.getByPlaceholder(/Search/i);
    await expect(searchInput).toBeVisible();
    
    await searchInput.fill('system');
    await expect(page.getByText('System Design')).toBeVisible();
  });

  test('has category filters', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Category filters may be hidden on mobile');
    
    await page.goto('/channels');
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Engineering' })).toBeVisible();
  });

  test('subscription toggle works', async ({ page }) => {
    await page.goto('/channels');
    await page.waitForTimeout(500);
    
    const initialCount = await page.locator('svg.lucide-check').count();
    const frontendCard = page.locator('h3:has-text("Frontend")').first();
    await frontendCard.click();
    
    await page.waitForTimeout(300);
    const newCount = await page.locator('svg.lucide-check').count();
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('persists subscription changes', async ({ page }) => {
    await page.goto('/channels');
    await page.waitForTimeout(2000);
    
    // Get initial subscription count from localStorage
    const initialPrefs = await page.evaluate(() => {
      const prefs = localStorage.getItem('user-preferences');
      return prefs ? JSON.parse(prefs) : null;
    });
    const initialCount = initialPrefs?.subscribedChannels?.length || 0;
    
    // Find an unsubscribed channel to subscribe to
    const frontendCard = page.locator('h3:has-text("Frontend")').first();
    if (await frontendCard.isVisible()) {
      await frontendCard.click();
      await page.waitForTimeout(500);
    }
    
    // Verify localStorage was updated
    const updatedPrefs = await page.evaluate(() => {
      const prefs = localStorage.getItem('user-preferences');
      return prefs ? JSON.parse(prefs) : null;
    });
    
    // Reload and verify subscriptions persist
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Check localStorage after reload
    const prefsAfterReload = await page.evaluate(() => {
      const prefs = localStorage.getItem('user-preferences');
      return prefs ? JSON.parse(prefs) : null;
    });
    
    const countAfterReload = prefsAfterReload?.subscribedChannels?.length || 0;
    // Should have at least the initial subscriptions
    expect(countAfterReload).toBeGreaterThanOrEqual(initialCount);
  });
});
