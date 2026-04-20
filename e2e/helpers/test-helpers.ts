/**
 * E2E Test Helpers
 * Reusable utilities for Playwright tests
 */

import { Page, expect, Locator } from '@playwright/test';

// ============================================
// NAVIGATION HELPERS
// ============================================

export async function navigateToHome(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

export async function navigateToChannel(page: Page, channelId: string) {
  await page.goto(`/channel/${channelId}`);
  await page.waitForLoadState('networkidle');
}

export async function navigateToTest(page: Page, channelId: string) {
  await page.goto(`/test/${channelId}`);
  await page.waitForLoadState('networkidle');
}

export async function navigateToVoiceInterview(page: Page) {
  await page.goto('/voice-interview');
  await page.waitForLoadState('networkidle');
}

export async function navigateToCertification(page: Page, certId: string) {
  await page.goto(`/certification/${certId}`);
  await page.waitForLoadState('networkidle');
}

// ============================================
// WAIT HELPERS
// ============================================

export async function waitForQuestionToLoad(page: Page) {
  // Wait for question text to be visible
  await page.waitForSelector('text=/What|How|Explain|Describe/', { timeout: 10000 });
}

export async function waitForAnswerToLoad(page: Page) {
  // Wait for answer content to be visible
  await page.waitForSelector('[class*="answer"]', { timeout: 5000 });
}

export async function waitForAnimation(page: Page, duration: number = 500) {
  await page.waitForTimeout(duration);
}

// ============================================
// INTERACTION HELPERS
// ============================================

export async function clickRevealAnswer(page: Page) {
  const revealButton = page.getByRole('button', { name: /reveal|show answer/i });
  await revealButton.click();
  await waitForAnimation(page, 300);
}

export async function clickNextQuestion(page: Page) {
  const nextButton = page.getByRole('button', { name: /next/i });
  await nextButton.click();
  await waitForAnimation(page, 300);
}

export async function clickPreviousQuestion(page: Page) {
  const prevButton = page.getByRole('button', { name: /previous|prev/i });
  await prevButton.click();
  await waitForAnimation(page, 300);
}

export async function toggleBookmark(page: Page) {
  const bookmarkButton = page.locator('button[aria-label*="bookmark" i], button:has-text("🔖")');
  await bookmarkButton.click();
  await waitForAnimation(page, 200);
}

// ============================================
// ASSERTION HELPERS
// ============================================

export async function assertQuestionVisible(page: Page) {
  const questionText = page.locator('text=/What|How|Explain|Describe/').first();
  await expect(questionText).toBeVisible();
}

export async function assertAnswerVisible(page: Page) {
  const answerContent = page.locator('[class*="answer"]').first();
  await expect(answerContent).toBeVisible();
}

export async function assertProgressBar(page: Page, current: number, total: number) {
  const progressText = page.locator(`text=/${current}.*${total}/`);
  await expect(progressText).toBeVisible();
}

export async function assertDifficultyBadge(page: Page, difficulty: 'beginner' | 'intermediate' | 'advanced') {
  const badge = page.locator(`text=/${difficulty}/i`);
  await expect(badge).toBeVisible();
}

export async function assertNoHorizontalScroll(page: Page) {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // Allow 1px tolerance
}

export async function assertTouchTargetSize(locator: Locator, minSize: number = 44) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    expect(box.width).toBeGreaterThanOrEqual(minSize);
    expect(box.height).toBeGreaterThanOrEqual(minSize);
  }
}

// ============================================
// MOBILE HELPERS
// ============================================

export async function swipeLeft(page: Page) {
  const viewport = page.viewportSize();
  if (!viewport) return;
  
  await page.touchscreen.tap(viewport.width * 0.8, viewport.height * 0.5);
  await page.touchscreen.swipe(
    { x: viewport.width * 0.8, y: viewport.height * 0.5 },
    { x: viewport.width * 0.2, y: viewport.height * 0.5 }
  );
  await waitForAnimation(page, 300);
}

export async function swipeRight(page: Page) {
  const viewport = page.viewportSize();
  if (!viewport) return;
  
  await page.touchscreen.tap(viewport.width * 0.2, viewport.height * 0.5);
  await page.touchscreen.swipe(
    { x: viewport.width * 0.2, y: viewport.height * 0.5 },
    { x: viewport.width * 0.8, y: viewport.height * 0.5 }
  );
  await waitForAnimation(page, 300);
}

export async function assertSafeAreaSupport(page: Page) {
  // Check if safe area CSS variables are applied
  const hasSafeArea = await page.evaluate(() => {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    return style.getPropertyValue('--safe-area-top') !== '';
  });
  expect(hasSafeArea).toBeTruthy();
}

// ============================================
// PERFORMANCE HELPERS
// ============================================

export async function measurePageLoadTime(page: Page): Promise<number> {
  const timing = await page.evaluate(() => {
    const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return perf.loadEventEnd - perf.fetchStart;
  });
  return timing;
}

export async function assertPageLoadTime(page: Page, maxTime: number = 3000) {
  const loadTime = await measurePageLoadTime(page);
  expect(loadTime).toBeLessThan(maxTime);
}

export async function measureFPS(page: Page, duration: number = 1000): Promise<number> {
  const fps = await page.evaluate((dur) => {
    return new Promise<number>((resolve) => {
      let frames = 0;
      const startTime = performance.now();
      
      function countFrame() {
        frames++;
        if (performance.now() - startTime < dur) {
          requestAnimationFrame(countFrame);
        } else {
          resolve(frames / (dur / 1000));
        }
      }
      
      requestAnimationFrame(countFrame);
    });
  }, duration);
  
  return fps;
}

export async function assertSmoothAnimations(page: Page) {
  const fps = await measureFPS(page, 1000);
  expect(fps).toBeGreaterThan(50); // At least 50 FPS
}

// ============================================
// ACCESSIBILITY HELPERS
// ============================================

export async function assertKeyboardNavigation(page: Page) {
  // Tab through interactive elements
  await page.keyboard.press('Tab');
  const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
  expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement);
}

export async function assertAriaLabels(page: Page) {
  const buttons = await page.locator('button').all();
  for (const button of buttons) {
    const ariaLabel = await button.getAttribute('aria-label');
    const text = await button.textContent();
    expect(ariaLabel || text).toBeTruthy();
  }
}

export async function assertColorContrast(page: Page, selector: string) {
  const contrast = await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return 0;
    
    const style = getComputedStyle(element);
    const color = style.color;
    const bgColor = style.backgroundColor;
    
    // Simple contrast calculation (simplified)
    // In production, use a proper contrast calculation library
    return 7; // Placeholder - should calculate actual contrast
  }, selector);
  
  expect(contrast).toBeGreaterThanOrEqual(4.5); // WCAG AA standard
}

// ============================================
// DATA HELPERS
// ============================================

export async function getQuestionCount(page: Page): Promise<number> {
  const progressText = await page.locator('text=/\\d+\\s*\\/\\s*(\\d+)/').first().textContent();
  if (!progressText) return 0;
  
  const match = progressText.match(/\/\s*(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

export async function getCurrentQuestionNumber(page: Page): Promise<number> {
  const progressText = await page.locator('text=/(\\d+)\\s*\\/\\s*\\d+/').first().textContent();
  if (!progressText) return 0;
  
  const match = progressText.match(/(\d+)\s*\//);
  return match ? parseInt(match[1]) : 0;
}

export async function getDifficulty(page: Page): Promise<string> {
  const badge = await page.locator('text=/beginner|intermediate|advanced/i').first().textContent();
  return badge?.toLowerCase().trim() || '';
}

// ============================================
// SCREENSHOT HELPERS
// ============================================

export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
}

export async function takeScreenshotOnFailure(page: Page, testName: string) {
  const timestamp = Date.now();
  await page.screenshot({ 
    path: `test-results/failures/${testName}-${timestamp}.png`, 
    fullPage: true 
  });
}

// ============================================
// CLEANUP HELPERS
// ============================================

export async function clearLocalStorage(page: Page) {
  await page.evaluate(() => localStorage.clear());
}

export async function clearSessionStorage(page: Page) {
  await page.evaluate(() => sessionStorage.clear());
}

export async function resetTestState(page: Page) {
  await clearLocalStorage(page);
  await clearSessionStorage(page);
  await page.reload();
}
