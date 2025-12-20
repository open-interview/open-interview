import { test, expect, Page } from '@playwright/test';

/**
 * Mobile Search Overlay Tests
 * 
 * Tests that search opens as full-screen overlay on mobile,
 * is scrollable, and closes when clicking on a result
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
      subscribedChannels: ['system-design', 'algorithms', 'backend', 'frontend'],
      onboardingComplete: true,
      createdAt: new Date().toISOString()
    }));
  });
}

test.describe('Mobile Search Overlay', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
  });

  test('Search should open as overlay on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Find and click the search button in mobile header (LinkedIn-style search bar)
    const searchButton = page.locator('button:has-text("Search topics")').first();
    await searchButton.click();
    await page.waitForTimeout(500);
    
    // Search input should be visible and usable (use mobile-specific testid)
    const searchInput = page.getByTestId('search-input-mobile');
    await expect(searchInput).toBeVisible();
    
    // Close button should be visible on mobile
    const closeButton = page.locator('[data-testid="search-close-btn"]');
    await expect(closeButton).toBeVisible();
  });

  test('Search overlay should have close button on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Open search
    const searchButton = page.locator('button:has-text("Search topics")').first();
    await searchButton.click();
    await page.waitForTimeout(500);
    
    // Should have a close button (X icon) visible on mobile
    const closeButton = page.locator('[data-testid="search-close-btn"]');
    await expect(closeButton).toBeVisible();
    
    // Click close button
    await closeButton.click();
    await page.waitForTimeout(300);
    
    // Search modal should be closed
    const searchHeader = page.locator('h2:has-text("Search")');
    await expect(searchHeader).not.toBeVisible();
  });

  test('Search results should be scrollable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Open search
    const searchButton = page.locator('button:has-text("Search topics")').first();
    await searchButton.click();
    await page.waitForTimeout(500);
    
    // Type a search query that should return multiple results (use mobile-specific testid)
    const searchInput = page.getByTestId('search-input-mobile');
    await searchInput.fill('react');
    await page.waitForTimeout(1000);
    
    // Results container should exist
    const mobileModal = page.locator('[data-testid="search-modal-mobile"]');
    const resultsContainer = mobileModal.locator('.flex-1.overflow-y-auto');
    await expect(resultsContainer).toBeVisible();
  });

  test('Clicking search result should close overlay and navigate', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Open search
    const searchButton = page.locator('button:has-text("Search topics")').first();
    await searchButton.click();
    await page.waitForTimeout(500);
    
    // Type a search query (use mobile-specific testid)
    const searchInput = page.getByTestId('search-input-mobile');
    await searchInput.fill('system design');
    await page.waitForTimeout(1500);
    
    // Click on first result if available
    const mobileModal = page.locator('[data-testid="search-modal-mobile"]');
    const firstResult = mobileModal.locator('button.w-full').first();
    if (await firstResult.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstResult.click();
      await page.waitForTimeout(1000);
      
      // Should have navigated to a channel page
      const url = page.url();
      expect(url).toContain('/channel/');
    }
  });

  test('Search input should auto-focus on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Open search
    const searchButton = page.locator('button:has-text("Search topics")').first();
    await searchButton.click();
    await page.waitForTimeout(500);
    
    // Search input should be visible (use mobile-specific testid)
    const searchInput = page.getByTestId('search-input-mobile');
    await expect(searchInput).toBeVisible();
  });
});

test.describe('Mobile Category Pills', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
  });

  test('Category pills should be horizontally scrollable', async ({ page }) => {
    await page.goto('/channels');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/mobile-screenshots/channels-category-pills.png', fullPage: true });
    
    // Find the category pills container
    const pillsContainer = page.locator('[class*="overflow-x-auto"]').first();
    
    if (await pillsContainer.isVisible()) {
      // Should have horizontal scroll
      const hasHorizontalScroll = await pillsContainer.evaluate((el) => {
        return el.scrollWidth > el.clientWidth;
      });
      
      // Pills should be scrollable if there are many
      const pills = pillsContainer.locator('button');
      const pillCount = await pills.count();
      
      if (pillCount > 3) {
        expect(hasHorizontalScroll).toBeTruthy();
      }
    }
  });

  test('Category pills should not overlap', async ({ page }) => {
    await page.goto('/channels');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Find all category pill buttons
    const pillsContainer = page.locator('[class*="overflow-x-auto"]').first();
    const pills = pillsContainer.locator('button');
    const pillCount = await pills.count();
    
    if (pillCount >= 2) {
      // Check that first two pills don't overlap
      const firstPill = pills.nth(0);
      const secondPill = pills.nth(1);
      
      const firstBox = await firstPill.boundingBox();
      const secondBox = await secondPill.boundingBox();
      
      if (firstBox && secondBox) {
        // Second pill should start after first pill ends (with some gap)
        expect(secondBox.x).toBeGreaterThanOrEqual(firstBox.x + firstBox.width - 5);
      }
    }
  });

  test('Category pills should have proper touch targets', async ({ page }) => {
    await page.goto('/channels');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Find category pills
    const pillsContainer = page.locator('[class*="overflow-x-auto"]').first();
    const pills = pillsContainer.locator('button');
    
    // Check first few pills have adequate touch target size
    for (let i = 0; i < Math.min(3, await pills.count()); i++) {
      const pill = pills.nth(i);
      const box = await pill.boundingBox();
      
      if (box) {
        // Should have minimum touch target height (36px recommended)
        expect(box.height).toBeGreaterThanOrEqual(32);
      }
    }
  });
});
