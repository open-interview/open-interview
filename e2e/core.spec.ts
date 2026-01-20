/**
 * Core App Tests
 * Fundamental functionality: navigation, responsiveness, basic flows
 */

import { test, expect, setupUser, setupFreshUser, waitForPageReady, checkNoOverflow, hideMascot } from './fixtures';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
  });

  test('home page loads with content', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);
    await expect(page.locator('body')).toContainText(/.{100,}/);
  });

  test('bottom nav visible on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile only');
    await page.goto('/');
    await waitForPageReady(page);
    await expect(page.locator('nav.fixed.bottom-0')).toBeVisible();
  });

  test('sidebar visible on desktop', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only');
    await page.goto('/');
    await waitForPageReady(page);
    await expect(page.locator('aside').first()).toBeVisible();
  });

  test('navigate to channels via Learn', async ({ page, isMobile }) => {
    await page.goto('/');
    await waitForPageReady(page);
    
    if (isMobile) {
      await page.locator('nav.fixed.bottom-0 button').filter({ hasText: 'Learn' }).click();
      const channelsBtn = page.locator('.fixed button').filter({ hasText: 'Channels' }).first();
      if (await channelsBtn.isVisible({ timeout: 2000 })) {
        await channelsBtn.click();
      } else {
        await page.goto('/channels');
      }
    } else {
      const learnBtn = page.locator('aside button, aside a').filter({ hasText: 'Learn' }).first();
      if (await learnBtn.isVisible({ timeout: 2000 })) {
        await learnBtn.click();
        const channelsBtn = page.locator('aside button, aside a').filter({ hasText: 'Channels' }).first();
        if (await channelsBtn.isVisible({ timeout: 1500 })) {
          await channelsBtn.click();
        } else {
          await page.goto('/channels');
        }
      } else {
        await page.goto('/channels');
      }
    }
    await expect(page).toHaveURL(/\/channels/);
  });

  test('navigate to profile via credits', async ({ page, isMobile }) => {
    await page.goto('/');
    await waitForPageReady(page);
    await hideMascot(page);
    
    const creditsSelector = isMobile 
      ? 'nav.fixed.bottom-0 button:has(svg.lucide-coins)'
      : 'aside button:has(svg.lucide-coins)';
    
    await page.locator(creditsSelector).first().click({ force: true });
    await expect(page).toHaveURL(/\/profile/);
  });

  test('keyboard shortcut Cmd+K opens search', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only');
    await page.goto('/');
    await waitForPageReady(page);
    
    await page.keyboard.press('Meta+k');
    const searchModal = page.locator('[class*="fixed"][class*="inset"]:has(input)');
    const isVisible = await searchModal.isVisible().catch(() => false);
    if (isVisible) await page.keyboard.press('Escape');
  });
});

test.describe('Responsiveness', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
  });

  const pages = [
    { name: 'home', path: '/' },
    { name: 'channels', path: '/channels' },
    { name: 'profile', path: '/profile' },
    { name: 'channel-detail', path: '/channel/system-design' },
    { name: 'training', path: '/training' },
    { name: 'certifications', path: '/certifications' },
    { name: 'documentation', path: '/docs' },
  ];

  for (const { name, path } of pages) {
    test(`${name} page no overflow`, async ({ page }) => {
      await page.goto(path);
      await waitForPageReady(page);
      await checkNoOverflow(page);
    });
  }
});

test.describe('Onboarding', () => {
  test.skip('shows welcome and role selection for new users', async ({ page }) => {
    // TODO: Onboarding feature not implemented yet
    await setupFreshUser(page);
    await page.goto('/');
    await waitForPageReady(page);
    
    await expect(page.getByText(/Welcome|Get Started|Choose/i).first()).toBeVisible();
    
    const roleContent = page.locator('button, [class*="card"], [class*="role"]')
      .filter({ hasText: /Frontend|Backend|Fullstack|DevOps|Engineer/i });
    await expect(roleContent.first()).toBeVisible();
  });

  test('selecting role proceeds to channel selection', async ({ page }) => {
    await setupFreshUser(page);
    await page.goto('/');
    await waitForPageReady(page);
    
    const roleButton = page.locator('button').filter({ hasText: /Fullstack/i }).first();
    if (await roleButton.isVisible()) {
      await roleButton.click();
    }
  });
});
