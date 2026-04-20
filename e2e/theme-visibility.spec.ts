/**
 * Theme Visibility Tests
 * Tests that all text is visible in both light and dark modes
 */

import { test, expect } from '@playwright/test';

test.describe('Theme Visibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Search modal text visible in light mode', async ({ page }) => {
    // Switch to light mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'genz-light');
      document.documentElement.classList.add('genz-light');
      document.documentElement.classList.remove('genz-dark');
    });

    // Open search modal
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);

    // Check that search modal is visible
    const searchModal = page.locator('[data-testid="search-modal-desktop"], [data-testid="search-modal-mobile"]').first();
    await expect(searchModal).toBeVisible();

    // Check "Type to search" text is visible
    const typeToSearch = page.getByText('Type to search');
    await expect(typeToSearch).toBeVisible();

    // Check example buttons are visible and have text
    const reactHooksButton = page.getByRole('button', { name: 'react hooks' });
    await expect(reactHooksButton).toBeVisible();
    
    // Verify button has readable text color (not transparent or same as background)
    const buttonColor = await reactHooksButton.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
      };
    });
    
    // Color should not be transparent or rgb(0,0,0) in light mode
    expect(buttonColor.color).not.toBe('rgba(0, 0, 0, 0)');
    expect(buttonColor.color).not.toBe('transparent');
  });

  test('Search modal text visible in dark mode', async ({ page }) => {
    // Switch to dark mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'genz-dark');
      document.documentElement.classList.add('genz-dark');
      document.documentElement.classList.remove('genz-light');
    });

    // Open search modal
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);

    // Check that search modal is visible
    const searchModal = page.locator('[data-testid="search-modal-desktop"], [data-testid="search-modal-mobile"]').first();
    await expect(searchModal).toBeVisible();

    // Check "Type to search" text is visible
    const typeToSearch = page.getByText('Type to search');
    await expect(typeToSearch).toBeVisible();
  });

  test('Question viewer answer panel visible in light mode', async ({ page }) => {
    // Navigate to a question
    await page.goto('/channel/data-structures');
    await page.waitForTimeout(1000);

    // Click first question
    const firstQuestion = page.locator('[data-testid="question-card"]').first();
    if (await firstQuestion.isVisible()) {
      await firstQuestion.click();
      await page.waitForTimeout(1000);
    }

    // Switch to light mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'genz-light');
      document.documentElement.classList.add('genz-light');
      document.documentElement.classList.remove('genz-dark');
    });
    await page.waitForTimeout(500);

    // Check Quick Answer tab is visible
    const quickAnswerTab = page.getByText('Quick Answer');
    if (await quickAnswerTab.isVisible()) {
      await quickAnswerTab.click();
      await page.waitForTimeout(500);

      // Check that answer text is visible (not black on black)
      const answerPanel = page.locator('.rounded-2xl').filter({ hasText: 'Quick Answer' }).first();
      if (await answerPanel.isVisible()) {
        const panelStyles = await answerPanel.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            backgroundColor: styles.backgroundColor,
            color: styles.color,
          };
        });

        // Background should be light in light mode
        expect(panelStyles.backgroundColor).not.toContain('rgb(0, 0, 0)');
      }
    }
  });

  test('Bookmarks page visible in light mode', async ({ page }) => {
    // Navigate to bookmarks
    await page.goto('/bookmarks');
    await page.waitForTimeout(1000);

    // Switch to light mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'genz-light');
      document.documentElement.classList.add('genz-light');
      document.documentElement.classList.remove('genz-dark');
    });
    await page.waitForTimeout(500);

    // Check page title is visible
    const title = page.getByRole('heading', { name: 'Bookmarks' });
    await expect(title).toBeVisible();

    // Check that title has readable color
    const titleColor = await title.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    
    // Should not be white (rgb(255, 255, 255)) in light mode
    expect(titleColor).not.toBe('rgb(255, 255, 255)');
  });

  test('Learning paths page visible in light mode', async ({ page }) => {
    // Navigate to learning paths
    await page.goto('/learning-paths');
    await page.waitForTimeout(1000);

    // Switch to light mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'genz-light');
      document.documentElement.classList.add('genz-light');
      document.documentElement.classList.remove('genz-dark');
    });
    await page.waitForTimeout(500);

    // Check page title is visible
    const title = page.getByText('Learning').first();
    await expect(title).toBeVisible();

    // Check create button is visible
    const createButton = page.getByText('Create Custom Path');
    await expect(createButton).toBeVisible();
  });
});
