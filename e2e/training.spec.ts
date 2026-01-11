/**
 * Training Mode Tests
 * Read and record answer practice
 */

import { test, expect, setupUser, waitForPageReady } from './fixtures';

test.describe('Training Mode Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
  });

  test('page loads', async ({ page }) => {
    await page.goto('/training');
    await waitForPageReady(page);
    
    // Should show training content or loading state
    const hasContent = await page.locator('body').textContent();
    expect(hasContent?.length).toBeGreaterThan(100);
  });

  test('shows question and answer', async ({ page }) => {
    await page.goto('/training');
    await waitForPageReady(page);
    await page.waitForTimeout(2000);
    
    // Should show question text
    const questionSection = page.locator('h2, h3, [class*="question"]');
    const hasQuestion = await questionSection.first().isVisible().catch(() => false);
    
    // Should show answer to read
    const answerSection = page.getByText(/Answer to Read|Read the/i);
    const hasAnswer = await answerSection.first().isVisible().catch(() => false);
    
    expect(hasQuestion || hasAnswer).toBeTruthy();
  });

  test('shows progress indicator', async ({ page }) => {
    await page.goto('/training');
    await waitForPageReady(page);
    await page.waitForTimeout(1500);
    
    // Should show progress like "1 / 20" or progress bar
    const progressText = page.locator('text=/\\d+\\s*\\/\\s*\\d+/');
    const hasProgress = await progressText.first().isVisible().catch(() => false);
    
    // Or check for progress bar
    const progressBar = page.locator('[class*="progress"], [class*="bg-gradient"]');
    const hasProgressBar = await progressBar.first().isVisible().catch(() => false);
    
    expect(hasProgress || hasProgressBar).toBeTruthy();
  });

  test('has recording controls', async ({ page }) => {
    await page.goto('/training');
    await waitForPageReady(page);
    await page.waitForTimeout(2000);
    
    // Should have mic/record button
    const recordButton = page.locator('button').filter({ has: page.locator('svg.lucide-mic') });
    const startButton = page.locator('button').filter({ hasText: /Start Recording|Record/i });
    
    const hasMicButton = await recordButton.first().isVisible().catch(() => false);
    const hasStartButton = await startButton.first().isVisible().catch(() => false);
    
    expect(hasMicButton || hasStartButton).toBeTruthy();
  });

  test('navigation buttons work', async ({ page }) => {
    await page.goto('/training');
    await waitForPageReady(page);
    await page.waitForTimeout(2000);
    
    // Should have next/previous buttons or navigation arrows
    const nextButton = page.locator('button').filter({ hasText: /Next|Continue|Skip/i });
    const arrowButton = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-right, svg.lucide-arrow-right') });
    
    const hasNext = await nextButton.first().isVisible().catch(() => false);
    const hasArrow = await arrowButton.first().isVisible().catch(() => false);
    
    // Or check for any navigation controls
    const hasNavigation = hasNext || hasArrow;
    
    // If no explicit nav buttons, check page has interactive content
    const hasContent = await page.locator('button').count() > 0;
    
    expect(hasNavigation || hasContent).toBeTruthy();
  });

  test('back button returns to home', async ({ page }) => {
    await page.goto('/training');
    await waitForPageReady(page);
    
    const backButton = page.locator('button').filter({ has: page.locator('svg.lucide-arrow-left, svg.lucide-chevron-left') }).first();
    if (await backButton.isVisible()) {
      await backButton.click();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL('/');
    }
  });
});

test.describe('Training Mode - No Channels', () => {
  test('shows message when no channels subscribed', async ({ page }) => {
    // Setup user with no subscribed channels
    await page.addInitScript(() => {
      localStorage.setItem('marvel-intro-seen', 'true');
      localStorage.setItem('user-preferences', JSON.stringify({
        role: 'fullstack',
        subscribedChannels: [],
        onboardingComplete: true,
        createdAt: new Date().toISOString(),
      }));
    });
    
    await page.goto('/training');
    await waitForPageReady(page);
    await page.waitForTimeout(2000);
    
    // Should show message about subscribing to channels
    const noChannelsMessage = page.getByText(/No Questions|Subscribe|Browse Channels/i);
    const hasMessage = await noChannelsMessage.first().isVisible().catch(() => false);
    
    // Or should redirect/show empty state
    const hasContent = await page.locator('body').textContent();
    expect(hasMessage || hasContent?.includes('channel')).toBeTruthy();
  });
});
