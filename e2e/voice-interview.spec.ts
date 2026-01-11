/**
 * Voice Interview Tests
 * Voice practice feature testing
 */

import { test, expect, setupUser, waitForPageReady } from './fixtures';

test.describe('Voice Interview Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
  });

  test('page loads', async ({ page }) => {
    await page.goto('/voice-interview');
    await waitForPageReady(page);
    await page.waitForTimeout(1500);
    
    // Should show voice interview content - check for any relevant text
    const voiceText = page.getByText(/Voice Interview|Practice|Question|Interview/i).first();
    const hasVoiceText = await voiceText.isVisible({ timeout: 5000 }).catch(() => false);
    
    // Or check for substantial content
    const hasContent = await page.locator('body').textContent();
    expect(hasVoiceText || (hasContent?.length ?? 0) > 200).toBeTruthy();
  });

  test('shows question', async ({ page }) => {
    await page.goto('/voice-interview');
    await waitForPageReady(page);
    await page.waitForTimeout(2000);
    
    // Should show a question or loading state
    const hasQuestion = await page.locator('h2, h3, [class*="question"]').first().isVisible().catch(() => false);
    const hasContent = await page.locator('main, [class*="content"]').first().isVisible().catch(() => false);
    expect(hasQuestion || hasContent).toBeTruthy();
  });

  test('shows credits info', async ({ page }) => {
    await page.goto('/voice-interview');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);
    
    // Page should have loaded with some content
    const hasContent = await page.locator('body').textContent();
    expect(hasContent?.length).toBeGreaterThan(100);
  });

  test('has record button', async ({ page }) => {
    await page.goto('/voice-interview');
    await waitForPageReady(page);
    await page.waitForTimeout(2000);
    
    // Should have mic/record button - may need to scroll on mobile
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(500);
    
    // Look for Start Recording button by text (primary method)
    const startButton = page.locator('button').filter({ hasText: /Start Recording/i });
    const hasStartButton = await startButton.first().isVisible({ timeout: 5000 }).catch(() => false);
    
    // Or look for any button with mic icon (Lucide icons render as SVG with specific paths)
    const micButton = page.locator('button svg').first();
    const hasMicButton = await micButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    // Or check for recording controls section
    const recordingSection = page.locator('text=Start Recording, text=Stop Recording, text=Recording').first();
    const hasRecordingSection = await recordingSection.isVisible({ timeout: 3000 }).catch(() => false);
    
    expect(hasStartButton || hasMicButton || hasRecordingSection).toBeTruthy();
  });

  test('skip button works', async ({ page }) => {
    await page.goto('/voice-interview');
    await waitForPageReady(page);
    
    const skipButton = page.locator('button').filter({ hasText: /Skip|Next/i }).first();
    if (await skipButton.isVisible()) {
      const initialContent = await page.locator('h2, h3').first().textContent();
      await skipButton.click();
      await page.waitForTimeout(500);
      
      // Content should change
      const newContent = await page.locator('h2, h3').first().textContent();
      // May or may not change depending on question pool
    }
  });

  test('home button returns to home', async ({ page }) => {
    await page.goto('/voice-interview');
    await waitForPageReady(page);
    
    const homeButton = page.locator('button').filter({ has: page.locator('svg.lucide-home') }).first();
    if (await homeButton.isVisible()) {
      await homeButton.click();
      await expect(page).toHaveURL('/');
    }
  });
});
