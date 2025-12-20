import { test, expect } from '@playwright/test';

// Use mobile viewport for all tests
test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

test.describe('Mobile Search Fullscreen', () => {
  test.beforeEach(async ({ page }) => {
    // Skip onboarding
    await page.addInitScript(() => {
      localStorage.setItem('marvel-intro-seen', 'true');
      localStorage.setItem('user-preferences', JSON.stringify({
        role: 'fullstack',
        subscribedChannels: ['system-design', 'algorithms', 'backend', 'frontend', 'devops', 'sre'],
        onboardingComplete: true,
        createdAt: new Date().toISOString()
      }));
    });
  });

  test('search should open fullscreen on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Find and click the search bar in the header
    const searchButton = page.locator('button:has-text("Search topics")').first();
    await expect(searchButton).toBeVisible({ timeout: 5000 });
    await searchButton.click();

    // Wait for search modal to appear
    await page.waitForTimeout(500);

    // Check that the mobile search modal is visible (not the desktop one)
    const mobileSearchModal = page.locator('[data-testid="search-modal-mobile"]');
    const desktopSearchModal = page.locator('[data-testid="search-modal-desktop"]');
    
    // Mobile modal should be visible
    await expect(mobileSearchModal).toBeVisible({ timeout: 3000 });
    
    // Desktop modal should be hidden (display: none via lg:hidden)
    const desktopVisible = await desktopSearchModal.isVisible().catch(() => false);
    expect(desktopVisible).toBeFalsy();

    // Check that the search header is visible
    const searchHeader = page.locator('h2:has-text("Search")');
    await expect(searchHeader).toBeVisible();

    // Verify the modal covers the viewport by checking its computed styles
    const modalStyles = await mobileSearchModal.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        position: styles.position,
        top: styles.top,
        left: styles.left,
        right: styles.right,
        bottom: styles.bottom,
        display: styles.display,
      };
    });
    
    expect(modalStyles.position).toBe('fixed');
    expect(modalStyles.display).not.toBe('none');
  });

  test('search input should be visible and functional', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Open search
    const searchButton = page.locator('button:has-text("Search topics")').first();
    await searchButton.click();
    await page.waitForTimeout(500);

    // Find search input (mobile version)
    const searchInput = page.locator('[data-testid="search-input-mobile"]').or(
      page.locator('input[placeholder*="Search"]').first()
    );
    await expect(searchInput).toBeVisible();

    // Type a search query
    await searchInput.fill('react');
    await page.waitForTimeout(500);

    // Should show results or empty state
    const hasResults = await page.locator('button:has-text("react")').first().isVisible().catch(() => false);
    const hasEmptyState = await page.locator('text=No results').isVisible().catch(() => false);
    const hasContent = hasResults || hasEmptyState || await page.locator('.py-2 button').first().isVisible().catch(() => false);
    
    expect(hasContent).toBeTruthy();
  });

  test('search close button should work', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Open search
    const searchButton = page.locator('button:has-text("Search topics")').first();
    await searchButton.click();
    await page.waitForTimeout(500);

    // Verify search is open
    const searchHeader = page.locator('h2:has-text("Search")');
    await expect(searchHeader).toBeVisible();

    // Click close button
    const closeButton = page.locator('[data-testid="search-close-btn"]');
    await closeButton.click();
    await page.waitForTimeout(500);

    // Search should be closed
    await expect(searchHeader).not.toBeVisible();
  });

  test('search should not have horizontal overflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Open search
    const searchButton = page.locator('button:has-text("Search topics")').first();
    await searchButton.click();
    await page.waitForTimeout(500);

    // Check for horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10);
  });

  test('search suggestions should be tappable', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Open search
    const searchButton = page.locator('button:has-text("Search topics")').first();
    await searchButton.click();
    await page.waitForTimeout(500);

    // Look for suggestion buttons (react hooks, system design, etc.)
    const suggestionButton = page.locator('button:has-text("react hooks")').first();
    const hasSuggestions = await suggestionButton.isVisible().catch(() => false);
    
    if (hasSuggestions) {
      await suggestionButton.click();
      await page.waitForTimeout(500);

      // Search input should now have the suggestion text
      const searchInput = page.locator('[data-testid="search-input-mobile"]').or(
        page.locator('input[placeholder*="Search"]').first()
      );
      const inputValue = await searchInput.inputValue();
      expect(inputValue).toBe('react hooks');
    }
  });

  test('search results area should exist', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Open search
    const searchButton = page.locator('button:has-text("Search topics")').first();
    await searchButton.click();
    await page.waitForTimeout(500);

    // Type a common search term
    const searchInput = page.locator('[data-testid="search-input-mobile"]').or(
      page.locator('input[placeholder*="Search"]').first()
    );
    await searchInput.fill('design');
    await page.waitForTimeout(1000);

    // Check if results area exists within the mobile search modal
    const mobileModal = page.locator('[data-testid="search-modal-mobile"]');
    const resultsArea = mobileModal.locator('.flex-1.overflow-y-auto');
    await expect(resultsArea).toBeVisible();
  });

  test('mobile search modal should have proper structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Open search
    const searchButton = page.locator('button:has-text("Search topics")').first();
    await searchButton.click();
    await page.waitForTimeout(500);

    // Check for proper mobile structure
    const mobileModal = page.locator('[data-testid="search-modal-mobile"]');
    await expect(mobileModal).toBeVisible();

    // Should have header with title
    const header = mobileModal.locator('h2:has-text("Search")');
    await expect(header).toBeVisible();

    // Should have close button
    const closeBtn = mobileModal.locator('[data-testid="search-close-btn"]');
    await expect(closeBtn).toBeVisible();

    // Should have search input
    const input = mobileModal.locator('input[placeholder*="Search"]');
    await expect(input).toBeVisible();

    // Should have footer
    const footer = mobileModal.locator('text=Tap to search').or(mobileModal.locator('text=results'));
    await expect(footer).toBeVisible();
  });
});
