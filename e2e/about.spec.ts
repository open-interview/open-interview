/**
 * About Page Tests
 * Verifies all content is visible and not cut off
 */

import { test, expect, setupUser, waitForPageReady } from './fixtures';

test.describe('About Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
  });

  test('page loads successfully', async ({ page }) => {
    await page.goto('/about');
    await waitForPageReady(page);
    
    // Check page title is visible
    await expect(page.getByText('Code_Reels')).toBeVisible();
  });

  test('hero section stats are visible', async ({ page }) => {
    await page.goto('/about');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);
    
    // Check stats are visible - look within the stats grid in main content
    const statsSection = page.locator('main .grid.grid-cols-2').first();
    await expect(statsSection).toBeVisible();
    
    // Check at least one stat label is visible within the stats section
    const questionsStat = statsSection.locator('div').filter({ hasText: 'Questions' }).first();
    await expect(questionsStat).toBeVisible();
  });

  test('tab navigation works', async ({ page }) => {
    await page.goto('/about');
    await waitForPageReady(page);
    
    // Check all tabs are visible
    const tabs = ['MISSION', 'FEATURES', 'TECH', 'COMMUNITY', 'DEVELOPER'];
    for (const tab of tabs) {
      await expect(page.getByRole('button', { name: tab })).toBeVisible();
    }
  });

  test('developer tab shows complete profile card', async ({ page }) => {
    await page.goto('/about');
    await waitForPageReady(page);
    
    // Click Developer tab
    await page.getByRole('button', { name: 'DEVELOPER' }).click();
    await page.waitForTimeout(500);
    
    // Check developer name is visible and not cut off
    const devName = page.getByText('Satishkumar Dhule');
    await expect(devName).toBeVisible();
    
    // Check the name is fully visible (not clipped)
    const nameBox = await devName.boundingBox();
    expect(nameBox).not.toBeNull();
    if (nameBox) {
      expect(nameBox.height).toBeGreaterThan(10); // Name should have reasonable height
    }
  });

  test('developer profile gradient banner is visible', async ({ page }) => {
    await page.goto('/about');
    await waitForPageReady(page);
    
    // Click Developer tab
    await page.getByRole('button', { name: 'DEVELOPER' }).click();
    await page.waitForTimeout(500);
    
    // Check the gradient banner using test ID
    const banner = page.getByTestId('developer-banner');
    await expect(banner).toBeVisible();
    
    // Verify the banner has proper height (not cut off) - h-32 = 128px, h-40 = 160px
    const bannerBox = await banner.boundingBox();
    expect(bannerBox).not.toBeNull();
    if (bannerBox) {
      expect(bannerBox.height).toBeGreaterThanOrEqual(100); // Should be at least 100px
    }
  });

  test('developer avatar is fully visible', async ({ page }) => {
    await page.goto('/about');
    await waitForPageReady(page);
    
    // Click Developer tab
    await page.getByRole('button', { name: 'DEVELOPER' }).click();
    await page.waitForTimeout(500);
    
    // Find the avatar container using test ID
    const avatar = page.getByTestId('developer-avatar');
    await expect(avatar).toBeVisible();
    
    // Check avatar is not clipped - w-24 h-24 = 96px on mobile, w-28 h-28 = 112px on desktop
    const avatarBox = await avatar.boundingBox();
    expect(avatarBox).not.toBeNull();
    if (avatarBox) {
      expect(avatarBox.width).toBeGreaterThanOrEqual(80);
      expect(avatarBox.height).toBeGreaterThanOrEqual(80);
    }
  });

  test('portfolio button is visible and clickable', async ({ page }) => {
    await page.goto('/about');
    await waitForPageReady(page);
    
    // Click Developer tab
    await page.getByRole('button', { name: 'DEVELOPER' }).click();
    await page.waitForTimeout(500);
    
    // Check Portfolio button is visible
    const portfolioBtn = page.getByRole('link', { name: /Portfolio/i });
    await expect(portfolioBtn).toBeVisible();
    
    // Verify button is not cut off
    const btnBox = await portfolioBtn.boundingBox();
    expect(btnBox).not.toBeNull();
    if (btnBox) {
      expect(btnBox.height).toBeGreaterThanOrEqual(30);
    }
  });

  test('support section buttons are fully visible', async ({ page }) => {
    await page.goto('/about');
    await waitForPageReady(page);
    
    // Click Developer tab
    await page.getByRole('button', { name: 'DEVELOPER' }).click();
    await page.waitForTimeout(500);
    
    // Scroll to bottom to see Support section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    
    // Check Support the Project section
    await expect(page.getByText('Support the Project')).toBeVisible();
    
    // Check buttons are visible
    const starBtn = page.getByRole('link', { name: /Star on GitHub/i });
    await expect(starBtn).toBeVisible();
    
    const forkBtn = page.getByRole('link', { name: /Fork & Contribute/i });
    await expect(forkBtn).toBeVisible();
  });

  test('developer profile card is not clipped by overflow', async ({ page }) => {
    await page.goto('/about');
    await waitForPageReady(page);
    
    // Click Developer tab
    await page.getByRole('button', { name: 'DEVELOPER' }).click();
    await page.waitForTimeout(500);
    
    // Check that the profile card container doesn't have overflow:hidden cutting content
    const isClipped = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="rounded-2xl"]');
      for (const card of cards) {
        const style = window.getComputedStyle(card);
        const rect = card.getBoundingClientRect();
        
        // Check if any child extends beyond the card but is hidden
        for (const child of card.children) {
          const childRect = child.getBoundingClientRect();
          if (childRect.top < rect.top && style.overflow === 'hidden') {
            return true; // Content is being clipped
          }
        }
      }
      return false;
    });
    
    expect(isClipped).toBe(false);
  });
});
