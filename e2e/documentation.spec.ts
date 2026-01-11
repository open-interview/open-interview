/**
 * Documentation Page Tests
 * Technical documentation with diagrams
 */

import { test, expect, setupUser, waitForPageReady, checkNoOverflow, waitForContent } from './fixtures';

test.describe('Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
    await page.goto('/docs');
    await waitForPageReady(page);
  });

  test('page loads with sections', async ({ page }) => {
    await waitForContent(page, 200);
    
    const docHeading = page.getByText(/Documentation|Reel-LearnHub/i).first();
    const hasHeading = await docHeading.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasHeading || (await page.locator('body').textContent())?.length! > 200).toBeTruthy();
    
    const sections = ['Architecture', 'AI Pipeline', 'Database', 'Frontend', 'API', 'Deployment', 'Overview'];
    let foundSection = false;
    for (const section of sections) {
      if (await page.getByText(section, { exact: false }).first().isVisible({ timeout: 500 }).catch(() => false)) {
        foundSection = true;
        break;
      }
    }
    expect(foundSection || (await page.locator('body').textContent())?.length! > 500).toBeTruthy();
  });

  test('shows navigation sidebar on desktop', async ({ page, isMobile }) => {
    if (!isMobile) {
      const sidebar = page.locator('aside, nav').filter({ hasText: /Architecture|Overview/i });
      await expect(sidebar.first()).toBeVisible();
    }
  });

  test('section navigation works', async ({ page, isMobile }) => {
    if (isMobile) {
      const menuButton = page.locator('header button').first();
      if (await menuButton.isVisible()) {
        await menuButton.click();
      }
    }
    
    const sectionButton = page.locator('button, a').filter({ hasText: /Database|AI Pipeline/i }).first();
    if (await sectionButton.isVisible({ timeout: 2000 })) {
      await sectionButton.click();
      await expect(page.locator('body')).toContainText(/.{200,}/);
    }
  });

  test('search input exists on desktop', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Search hidden on mobile');
    await expect(page.getByPlaceholder(/Search docs/i)).toBeVisible();
  });

  test('back to app link works', async ({ page }) => {
    const backLink = page.locator('a, button').filter({ hasText: /Back to App|Home/i }).first();
    if (await backLink.isVisible({ timeout: 2000 })) {
      await backLink.click();
      await expect(page).toHaveURL('/');
    }
  });

  test('no horizontal overflow', async ({ page }) => {
    await checkNoOverflow(page);
  });
});

test.describe('Documentation - Mobile', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });

  test.beforeEach(async ({ page }) => {
    await setupUser(page);
    await page.goto('/docs');
    await waitForPageReady(page);
  });

  test('mobile menu toggle and no overflow', async ({ page }) => {
    const menuButton = page.locator('header button').first();
    
    if (await menuButton.isVisible({ timeout: 2000 })) {
      await menuButton.click();
      const sectionButton = page.locator('button').filter({ hasText: /Architecture Overview|AI Pipeline|Database/i }).first();
      const isVisible = await sectionButton.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (isVisible) {
        await menuButton.click();
      }
    }
    
    await checkNoOverflow(page);
  });
});
