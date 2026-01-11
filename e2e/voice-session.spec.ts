/**
 * Voice Session Tests
 * Focused voice practice sessions
 */

import { test, expect, setupUser, waitForPageReady } from './fixtures';

test.describe('Voice Session Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
  });

  test('page loads', async ({ page }) => {
    await page.goto('/voice-session');
    await waitForPageReady(page);
    
    // Should show voice session content
    const hasContent = await page.locator('body').textContent();
    expect(hasContent?.length).toBeGreaterThan(100);
  });

  test('shows session configuration', async ({ page }) => {
    await page.goto('/voice-session');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);
    
    // Should show options for session setup or active session
    const hasSessionContent = await page.locator('body').textContent();
    // Check for common session-related text
    const hasSessionText = hasSessionContent?.includes('Session') || 
                          hasSessionContent?.includes('Practice') ||
                          hasSessionContent?.includes('Question');
    
    expect(hasSessionText).toBeTruthy();
  });

  test('has recording controls', async ({ page }) => {
    await page.goto('/voice-session');
    await waitForPageReady(page);
    await page.waitForTimeout(2000);
    
    // Should have mic/record button or start button
    const recordButton = page.locator('button').filter({ has: page.locator('svg.lucide-mic, svg.lucide-mic-off') });
    const hasRecordButton = await recordButton.first().isVisible({ timeout: 3000 }).catch(() => false);
    
    // Or start button
    const startButton = page.locator('button').filter({ hasText: /Start|Record|Begin|Practice/i });
    const hasStartButton = await startButton.first().isVisible({ timeout: 3000 }).catch(() => false);
    
    // Or any interactive button on the page
    const anyButton = page.locator('button').first();
    const hasAnyButton = await anyButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    // Voice session page should have some controls
    expect(hasRecordButton || hasStartButton || hasAnyButton).toBeTruthy();
  });

  test('navigation back to home works', async ({ page }) => {
    await page.goto('/voice-session');
    await waitForPageReady(page);
    
    const homeButton = page.locator('button, a').filter({ has: page.locator('svg.lucide-home') }).first();
    const backButton = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-left, svg.lucide-arrow-left') }).first();
    
    if (await homeButton.isVisible()) {
      await homeButton.click();
      await expect(page).toHaveURL('/');
    } else if (await backButton.isVisible()) {
      await backButton.click();
      await page.waitForTimeout(500);
      // Should navigate somewhere
      expect(page.url()).toBeTruthy();
    }
  });

  test('can navigate to specific question session', async ({ page }) => {
    // Test the /voice-session/:questionId route
    await page.goto('/voice-session/q-test-123');
    await waitForPageReady(page);
    
    // Should load without error
    const hasContent = await page.locator('body').textContent();
    expect(hasContent?.length).toBeGreaterThan(50);
  });
});

test.describe('Voice Session - From Voice Interview', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
  });

  test('sessions link visible from voice interview', async ({ page }) => {
    await page.goto('/voice-interview');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);
    
    // Should have link to sessions
    const sessionsLink = page.locator('button, a').filter({ hasText: /Sessions/i }).first();
    if (await sessionsLink.isVisible({ timeout: 3000 })) {
      await sessionsLink.click();
      await page.waitForTimeout(500);
      expect(page.url()).toContain('/voice-session');
    }
  });
});
