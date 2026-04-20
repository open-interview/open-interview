/**
 * Mock Tests / Quiz Tests
 * Test session functionality
 */

import { test, expect, setupUser, waitForPageReady, waitForContent } from './fixtures';

test.describe('Tests Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
    await page.goto('/tests');
    await waitForPageReady(page);
  });

  test('page loads with available tests', async ({ page }) => {
    await waitForContent(page);
    await expect(page.locator('body')).toContainText(/.{100,}/);
  });

  test('can start a test', async ({ page }) => {
    const startButton = page.locator('button').filter({ hasText: /Start|Begin|Take/i }).first();
    if (await startButton.isVisible({ timeout: 2000 })) {
      await startButton.click();
      
      const hasQuestion = await page.locator('h2, h3, p').filter({ hasText: /\?/i }).first().isVisible().catch(() => false);
      expect(page.url().includes('/test') || hasQuestion).toBeTruthy();
    }
  });
});

test.describe('Test Session', () => {
  test('selecting answer shows feedback', async ({ page }) => {
    await setupUser(page);
    await page.goto('/tests');
    await waitForPageReady(page);
    
    const startButton = page.locator('button').filter({ hasText: /Start|Begin/i }).first();
    if (await startButton.isVisible({ timeout: 2000 })) {
      await startButton.click();
      
      const option = page.locator('button:has([class*="rounded-full"])').first();
      if (await option.isVisible({ timeout: 2000 })) {
        await option.click();
        
        const feedback = page.locator('[class*="bg-green"], [class*="bg-red"], button:has-text("Next")');
        const hasFeedback = await feedback.first().isVisible().catch(() => false);
        expect(hasFeedback).toBeTruthy();
      }
    }
  });
});
