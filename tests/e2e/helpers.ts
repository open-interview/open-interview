/**
 * Shared test helpers for Open Interview E2E tests.
 *
 * Key helper: skipOnboarding() — sets localStorage so the
 * SubscriptionGate doesn't block every page navigation.
 */

import { Page, expect } from '@playwright/test';

export const BASE_URL = 'http://localhost:5000';

/**
 * Bypass the onboarding modal by injecting completed preferences into
 * localStorage before the page loads. Must be called before page.goto().
 */
export async function skipOnboarding(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const prefs = {
      role: 'fullstack',
      subscribedChannels: ['javascript', 'system-design', 'frontend', 'backend'],
      onboardingComplete: true,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('user-preferences', JSON.stringify(prefs));
  });
}

/**
 * Wait for the main content area to be visible (not showing a loading spinner).
 */
export async function waitForContent(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
}

/**
 * Assert a page loaded without a full-screen error or 404.
 */
export async function assertPageLoaded(page: Page, path: string): Promise<void> {
  await expect(page).not.toHaveURL(/\/not-found/);
  const errorTexts = ['Page not found', '404', 'Something went wrong', 'Unexpected error'];
  for (const text of errorTexts) {
    const el = page.getByText(text, { exact: false });
    const count = await el.count();
    if (count > 0) {
      throw new Error(`Page ${path} shows error text: "${text}"`);
    }
  }
}

/**
 * Navigate to a route and skip onboarding. Returns after content is visible.
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await skipOnboarding(page);
  await page.goto(`${BASE_URL}${path}`);
  await waitForContent(page);
}

/**
 * Check that an element's computed font size is at least minPx pixels.
 */
export async function assertMinFontSize(
  page: Page,
  selector: string,
  minPx: number,
): Promise<void> {
  const fontSize = await page.$eval(selector, el => {
    return parseFloat(window.getComputedStyle(el).fontSize);
  });
  if (fontSize < minPx) {
    throw new Error(
      `Element "${selector}" has font-size ${fontSize}px, expected >= ${minPx}px`,
    );
  }
}

/**
 * Get the contrast ratio between two hex colors.
 * Returns a value where >= 4.5 passes WCAG AA for normal text.
 */
export function contrastRatio(hex1: string, hex2: string): number {
  function luminance(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  }
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
