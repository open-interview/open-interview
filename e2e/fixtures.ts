/**
 * Shared Test Fixtures
 * Common setup, utilities, and test data
 */

import { test as base, expect, Page } from '@playwright/test';

// Default user preferences for authenticated state
export const DEFAULT_USER = {
  role: 'fullstack',
  subscribedChannels: ['system-design', 'algorithms', 'frontend', 'backend', 'devops'],
  onboardingComplete: true,
  createdAt: new Date().toISOString(),
};

// Default credits state
export const DEFAULT_CREDITS = {
  balance: 500,
  totalEarned: 500,
  totalSpent: 0,
  usedCoupons: [],
  initialized: true,
};

// Setup authenticated user state
export async function setupUser(page: Page, options?: Partial<typeof DEFAULT_USER>) {
  const prefs = { ...DEFAULT_USER, ...options };
  await page.addInitScript((prefs) => {
    localStorage.setItem('marvel-intro-seen', 'true');
    localStorage.setItem('user-preferences', JSON.stringify(prefs));
    localStorage.setItem('user-credits', JSON.stringify({
      balance: 500,
      totalEarned: 500,
      totalSpent: 0,
      usedCoupons: [],
      initialized: true,
    }));
  }, prefs);
}

// Setup fresh user (no onboarding)
export async function setupFreshUser(page: Page) {
  await page.addInitScript(() => {
    localStorage.removeItem('user-preferences');
    localStorage.removeItem('user-credits');
    localStorage.setItem('marvel-intro-seen', 'true');
  });
}

// Wait for page to be ready - optimized version
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  // Wait for React hydration by checking for interactive elements
  await page.waitForFunction(() => document.querySelector('button, a, input') !== null, { timeout: 5000 }).catch(() => {});
}

// Wait for content to render with loading state check
export async function waitForContent(page: Page, minLength = 100) {
  // First wait for loading states to disappear (with short timeout)
  await page.waitForFunction(
    () => !document.body.textContent?.includes('Loading...') || document.body.textContent.length > 200,
    { timeout: 5000 }
  ).catch(() => {});
  
  // Then wait for minimum content
  await page.waitForFunction(
    (min) => (document.body.textContent?.length ?? 0) > min,
    minLength,
    { timeout: 5000 }
  ).catch(() => {});
}

// Wait for async data to load (for pages that fetch from API/JSON)
export async function waitForDataLoad(page: Page) {
  // Short wait for network to settle - don't use networkidle as it can hang
  await page.waitForTimeout(500);
  await page.waitForFunction(
    () => !document.body.textContent?.includes('Loading...'),
    { timeout: 5000 }
  ).catch(() => {});
}

// Check for no horizontal overflow
export async function checkNoOverflow(page: Page) {
  const hasOverflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 5);
  expect(hasOverflow).toBe(false);
}

// Check for console errors
export function setupErrorCapture(page: Page) {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  return errors;
}

// Hide mascot overlay that can intercept clicks
export async function hideMascot(page: Page) {
  await page.evaluate(() => {
    const mascot = document.querySelector('[data-testid="pixel-mascot"]');
    if (mascot) (mascot as HTMLElement).style.display = 'none';
  });
}

// Extended test with isMobile fixture based on viewport
export const test = base.extend<{
  authenticatedPage: Page;
  isMobile: boolean;
}>({
  authenticatedPage: async ({ page }, use) => {
    await setupUser(page);
    await use(page);
  },
  isMobile: [async ({}, use, testInfo) => {
    const isMobile = testInfo.project.name === 'mobile-chrome' || 
                     testInfo.project.name.includes('mobile') ||
                     (testInfo.project.use?.viewport?.width ?? 1280) < 1024;
    await use(isMobile);
  }, { scope: 'test' }],
});

export { expect };
