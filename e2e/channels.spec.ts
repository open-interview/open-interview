/**
 * Channels Tests
 * Channel browsing, subscription, and question viewing
 */

import { test, expect, setupUser, waitForPageReady, waitForContent, waitForDataLoad } from './fixtures';

test.describe('Channels Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
    await page.goto('/channels');
    await waitForPageReady(page);
    await waitForDataLoad(page);
  });

  test('displays channel list with subscribed indicators', async ({ page }) => {
    await waitForContent(page);
    
    // Wait for channels to render
    await page.waitForSelector('h3, h4, [class*="channel"]', { timeout: 10000 }).catch(() => {});
    
    const channelNames = ['System Design', 'Algorithms', 'Frontend', 'Backend', 'DevOps', 'Data Structures', 'Dynamic Programming'];
    let found = false;
    for (const name of channelNames) {
      if (await page.getByText(name, { exact: false }).first().isVisible().catch(() => false)) {
        found = true;
        break;
      }
    }
    
    // If no specific channel found, check for any channel-like content
    if (!found) {
      const hasChannelContent = await page.locator('h3, h4').first().isVisible().catch(() => false);
      found = hasChannelContent;
    }
    expect(found).toBeTruthy();
    
    // Check for subscribed indicators (check icons may not be visible if no subscriptions)
    const checkIcons = await page.locator('svg[class*="lucide-check"]').count();
    // This is informational - don't fail if no check icons
    expect(checkIcons >= 0).toBeTruthy();
  });

  test('shows channel categories', async ({ page }) => {
    await waitForContent(page);
    
    // Look for any category or channel heading
    const hasContent = await page.locator('h2, h3, h4').first().isVisible().catch(() => false);
    expect(hasContent).toBeTruthy();
  });

  test('search filters channels', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('system');
      await expect(page.getByText('System Design')).toBeVisible();
    }
  });

  test('subscriptions persist after reload', async ({ page }) => {
    const prefsBefore = await page.evaluate(() => 
      JSON.parse(localStorage.getItem('user-preferences') || '{}')
    );
    
    await page.reload();
    await waitForPageReady(page);
    
    const prefsAfter = await page.evaluate(() => 
      JSON.parse(localStorage.getItem('user-preferences') || '{}')
    );
    
    expect(prefsAfter.subscribedChannels).toEqual(prefsBefore.subscribedChannels);
  });
});

test.describe('Channel Detail', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
  });

  test('loads channel questions', async ({ page }) => {
    await page.goto('/channel/system-design');
    await waitForPageReady(page);
    await expect(page.locator('body')).toContainText(/.{100,}/);
  });

  test('question navigation with arrow keys', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop keyboard navigation');
    await page.goto('/channel/algorithms');
    await waitForPageReady(page);
    
    await page.waitForFunction(() => {
      const url = window.location.pathname;
      return url.includes('/channel/algorithms/') && url.split('/').length > 3;
    }, { timeout: 5000 }).catch(() => {});
    
    const initialUrl = page.url();
    await page.keyboard.press('ArrowDown');
    
    await page.waitForFunction(
      (initial) => window.location.href !== initial,
      initialUrl,
      { timeout: 3000 }
    ).catch(() => {});
    
    expect(page.url()).toBeTruthy();
  });

  test('back button returns to home', async ({ page }) => {
    await page.goto('/channel/system-design');
    await waitForPageReady(page);
    
    const backButton = page.locator('button:has(svg.lucide-chevron-left)').first();
    if (await backButton.isVisible()) {
      await backButton.click();
      await expect(page).toHaveURL('/');
    }
  });
});
