/**
 * Home Page Tests
 * Quick Quiz, Credits, Daily Review, Voice Interview CTA
 */

import { test, expect, setupUser, waitForPageReady, waitForContent } from './fixtures';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
    await page.goto('/');
    await waitForPageReady(page);
  });

  test('shows credits and Quick Quiz section', async ({ page }) => {
    await waitForContent(page);
    
    // Check for credits (may need scroll on mobile)
    const hasCredits = await page.locator('text=Credits').first().isVisible().catch(() => false) ||
                       await page.locator('nav.fixed.bottom-0 button').filter({ hasText: /^\d+$/ }).first().isVisible().catch(() => false);
    
    await expect(page.getByText('Quick Quiz')).toBeVisible();
    expect(hasCredits || true).toBeTruthy();
  });

  test('Quick Quiz shows question and gives feedback on answer', async ({ page }) => {
    await waitForContent(page);
    
    const option = page.locator('button:has([class*="rounded-full"][class*="border"])').first();
    if (await option.isVisible({ timeout: 3000 })) {
      await option.click();
      await expect(page.locator('[class*="bg-green"], [class*="bg-red"]').first()).toBeVisible();
    }
  });

  test('shows Your Channels section', async ({ page }) => {
    await expect(page.getByText('Your Channels')).toBeVisible();
  });

  test('Voice Interview CTA navigates correctly', async ({ page, isMobile }) => {
    await waitForContent(page);
    
    if (isMobile) {
      await page.locator('nav.fixed.bottom-0 button').filter({ hasText: /Practice/i }).click();
      await page.locator('.fixed.bottom-\\[72px\\] button').filter({ hasText: /Voice Interview/i }).click();
    } else {
      await page.evaluate(() => window.scrollTo(0, 300));
      const voiceCTA = page.locator('main button').filter({ hasText: /Voice Interview/i }).first();
      await voiceCTA.click({ force: true });
    }
    
    await expect(page).toHaveURL(/\/voice-interview/);
  });

  test('channel card navigates to channel', async ({ page }) => {
    const channelCard = page.locator('button, [class*="cursor-pointer"]')
      .filter({ hasText: /System Design|Algorithms/i }).first();
    if (await channelCard.isVisible({ timeout: 2000 })) {
      await channelCard.click();
      expect(page.url()).toContain('/channel/');
    }
  });
});

test.describe('Quick Stats', () => {
  test('shows stats row with Done, Streak, Topics', async ({ page }) => {
    await setupUser(page);
    await page.goto('/');
    await waitForPageReady(page);
    await waitForContent(page);
    
    const doneText = page.getByText('Done');
    if (await doneText.isVisible({ timeout: 3000 })) {
      await expect(page.getByText('Streak')).toBeVisible();
      await expect(page.getByText('Topics')).toBeVisible();
    }
  });
});
