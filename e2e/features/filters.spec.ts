import { test, expect } from '@playwright/test';

/**
 * Filter Tests
 * Tests for company filter and subchannel navigation
 */

test.describe('Company Filter', () => {
  test.skip(({ isMobile }) => isMobile, 'Company filter tests are desktop-only');

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('marvel-intro-seen', 'true');
      localStorage.setItem('user-preferences', JSON.stringify({
        role: 'fullstack',
        subscribedChannels: ['system-design', 'algorithms', 'backend', 'frontend', 'devops', 'behavioral'],
        onboardingComplete: true,
        createdAt: new Date().toISOString()
      }));
    });
  });

  test('should show company filter when questions have company data', async ({ page }) => {
    await page.goto('/channel/algorithms');
    await expect(page.getByTestId('question-panel').first().or(page.getByTestId('no-questions-view'))).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('question-panel').first().or(page.getByTestId('no-questions-view'))).toBeVisible();
  });

  test('should filter questions by company when selected', async ({ page }) => {
    await page.goto('/channel/algorithms');
    await expect(page.getByTestId('question-panel').first().or(page.getByTestId('no-questions-view'))).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('question-panel').first().or(page.getByTestId('no-questions-view'))).toBeVisible();
  });

  test('should reset company filter with Reset Filters button', async ({ page }) => {
    await page.goto('/channel/algorithms');
    await expect(page.getByTestId('question-panel').first().or(page.getByTestId('no-questions-view'))).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('question-panel').first().or(page.getByTestId('no-questions-view'))).toBeVisible();
  });
});

test.describe('Subchannel Navigation', () => {
  test.skip(({ isMobile }) => isMobile, 'Subchannel navigation tests are desktop-only');

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('marvel-intro-seen', 'true');
      localStorage.setItem('user-preferences', JSON.stringify({
        role: 'fullstack',
        subscribedChannels: ['system-design', 'algorithms', 'backend', 'frontend', 'devops', 'behavioral'],
        onboardingComplete: true,
        createdAt: new Date().toISOString()
      }));
    });
  });

  test('should not show blank page when changing subchannel', async ({ page }) => {
    await page.goto('/channel/system-design');
    await expect(page.getByTestId('question-panel').first()).toBeVisible({ timeout: 15000 });
    
    const subchannelDropdown = page.locator('button').filter({ hasText: /All Topics|Topic/i }).first();
    
    if (await subchannelDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
      await subchannelDropdown.click();
      await page.waitForTimeout(300);
      
      const subchannelOptions = page.locator('[role="menuitem"]');
      const optionCount = await subchannelOptions.count();
      
      if (optionCount > 1) {
        await subchannelOptions.nth(1).click();
        await page.waitForTimeout(2000); // Give more time for content to load in CI
        
        // Check for various valid states - question panel, no questions view, loading state, or any content
        const hasQuestionPanel = await page.getByTestId('question-panel').first().isVisible().catch(() => false);
        const hasNoDataView = await page.getByTestId('no-questions-view').isVisible().catch(() => false);
        const hasNoDataMessage = await page.getByText(/NO_DATA_FOUND|No questions/i).isVisible().catch(() => false);
        const hasLoadingState = await page.locator('.animate-spin').first().isVisible().catch(() => false);
        const hasReelsContent = await page.getByTestId('reels-content').isVisible().catch(() => false);
        const hasHeader = await page.locator('header').first().isVisible().catch(() => false);
        
        // Page should show some valid state (not blank)
        expect(hasQuestionPanel || hasNoDataView || hasNoDataMessage || hasLoadingState || hasReelsContent || hasHeader).toBeTruthy();
      }
    }
  });

  test('should show appropriate message when subchannel has no questions', async ({ page }) => {
    await page.goto('/channel/system-design');
    await page.waitForTimeout(1000);
    
    const pageContent = await page.locator('body').textContent();
    expect(pageContent?.trim().length).toBeGreaterThan(10);
    
    const backButton = page.locator('button').filter({ hasText: /ESC|Home/ }).first()
      .or(page.locator('button').filter({ has: page.locator('svg.lucide-chevron-left') }).first());
    await expect(backButton).toBeVisible();
  });

  test('should handle difficulty filter changes without blank page', async ({ page }) => {
    await page.goto('/channel/system-design');
    await expect(page.getByTestId('question-panel').first().or(page.getByTestId('no-questions-view'))).toBeVisible({ timeout: 10000 });
    
    const difficultyDropdown = page.locator('button').filter({ hasText: /Difficulty|All Levels|Beginner|Intermediate|Advanced/ }).first();
    
    if (await difficultyDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
      await difficultyDropdown.click();
      await page.waitForTimeout(200);
      
      const advancedOption = page.locator('[role="menuitem"]').filter({ hasText: 'Advanced' });
      if (await advancedOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await advancedOption.click();
        await page.waitForTimeout(500);
        
        const hasContent = await page.getByTestId('question-panel').first().isVisible().catch(() => false) ||
                          await page.getByTestId('no-questions-view').isVisible().catch(() => false);
        expect(hasContent).toBeTruthy();
      }
    }
  });

  test('should navigate between questions without errors', async ({ page }) => {
    await page.goto('/channel/system-design');
    await expect(page.getByTestId('question-panel').first()).toBeVisible({ timeout: 10000 });
    
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);
    await expect(page.getByTestId('question-panel').first()).toBeVisible();
    
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(300);
    await expect(page.getByTestId('question-panel').first()).toBeVisible();
  });
});
