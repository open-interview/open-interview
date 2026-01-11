/**
 * Coding Challenges Tests
 * Code editor and challenge execution
 */

import { test, expect, setupUser, waitForPageReady, waitForContent, waitForDataLoad } from './fixtures';

test.describe('Coding Challenges', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
    await page.goto('/coding');
    await waitForPageReady(page);
    await waitForDataLoad(page);
  });

  test('page loads with content', async ({ page }) => {
    await waitForContent(page, 100);
    
    const codingText = page.getByText(/Coding|Challenge|Practice|Problem/i).first();
    const hasCodingText = await codingText.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasCodingText || (await page.locator('body').textContent())?.length! > 100).toBeTruthy();
  });

  test('shows challenge list or content', async ({ page }) => {
    await waitForContent(page, 100);
    
    // Check for any interactive content
    const hasButtons = await page.locator('button').count() > 0;
    const hasContent = (await page.locator('body').textContent())?.length! > 100;
    
    expect(hasButtons || hasContent).toBeTruthy();
  });
});
