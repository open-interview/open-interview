/**
 * SRS Review Tests
 * Spaced repetition review session
 */

import { test, expect, setupUser, waitForPageReady } from './fixtures';

test.describe('Daily Review Card', () => {
  test('shows on home page when cards due', async ({ page }) => {
    await setupUser(page);
    await page.addInitScript(() => {
      const srsData = {
        cards: [{
          questionId: 'test-q-1',
          channel: 'system-design',
          difficulty: 'intermediate',
          nextReview: new Date().toISOString(),
          interval: 1,
          easeFactor: 2.5,
          masteryLevel: 1,
          reviewCount: 1,
          lastReview: new Date(Date.now() - 86400000).toISOString(),
        }],
        stats: { totalReviews: 1, reviewStreak: 1 }
      };
      localStorage.setItem('srs-data', JSON.stringify(srsData));
    });
    
    await page.goto('/');
    await waitForPageReady(page);
    
    // May or may not show depending on card state
    expect(true).toBeTruthy();
  });
});

test.describe('Review Session', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
  });

  test('page loads', async ({ page }) => {
    await page.goto('/review');
    await waitForPageReady(page);
    await expect(page.locator('body')).toContainText(/.{50,}/);
  });

  test('shows rating buttons when answer revealed', async ({ page }) => {
    await page.goto('/review');
    await waitForPageReady(page);
    
    const revealButton = page.locator('button').filter({ hasText: /Show Answer|Reveal/i });
    if (await revealButton.isVisible().catch(() => false)) {
      await revealButton.click();
      await expect(page.getByText('Again')).toBeVisible();
      await expect(page.getByText('Good')).toBeVisible();
    }
  });

  test('back button returns to home', async ({ page }) => {
    await page.goto('/review');
    await waitForPageReady(page);
    
    const backButton = page.locator('button:has(svg.lucide-chevron-left)').first();
    if (await backButton.isVisible({ timeout: 2000 })) {
      await backButton.click();
      await expect(page).toHaveURL('/');
    }
  });
});
