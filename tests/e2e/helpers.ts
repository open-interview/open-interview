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
 * Wait for the page DOM + initial scripts to be ready.
 * Uses 'load' (not 'networkidle') to avoid waiting for lazy JSON fetches
 * that the app loads in the background (channels, questions, etc.).
 */
export async function waitForContent(page: Page): Promise<void> {
  await page.waitForLoadState('load');
}

/**
 * Assert a page loaded without a full-screen error or 404.
 * Only checks for text that would genuinely block the page from rendering.
 */
export async function assertPageLoaded(page: Page, path: string): Promise<void> {
  const url = page.url();
  // Only flag if we actually landed on the not-found route
  if (url.includes('/not-found')) {
    throw new Error(`Page ${path} redirected to /not-found`);
  }
  // Check for hard error states (not soft 404s which are content)
  const crashText = page.getByText('Application Error', { exact: true });
  const hasCrash = await crashText.count() > 0;
  if (hasCrash) {
    throw new Error(`Page ${path} shows "Application Error"`);
  }
}

/**
 * Navigate to a route, skip onboarding, and wait for page load.
 * Uses 'load' state — does NOT wait for background data fetches.
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await skipOnboarding(page);
  await page.goto(`${BASE_URL}${path}`);
  await waitForContent(page);
}

/**
 * Lightweight smoke navigation — just checks the route loads and returns
 * a non-crash response. Does not wait for content to fully render.
 * Use this for the route smoke tests to keep them fast.
 */
export async function smokeNavigate(page: Page, path: string): Promise<void> {
  await skipOnboarding(page);
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
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
 * Assert that the last item in a Locator set does not overlap the mobile
 * bottom nav bar. Scrolls to bottom first. Soft-checks that content is
 * accessible (not hidden behind fixed nav).
 */
export async function assertNoNavOverlap(page: Page, cards: import('@playwright/test').Locator): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);

  const navEl = page.locator('[class*="fixed"][class*="bottom-0"]').first();
  const navBox = await navEl.boundingBox();
  if (!navBox) return; // no mobile nav present at this viewport

  const count = await cards.count();
  if (count === 0) return;

  const lastCardBox = await cards.last().boundingBox();
  if (!lastCardBox) return;

  const overlap = lastCardBox.y + lastCardBox.height - navBox.y;
  expect(
    overlap,
    `Last card overlaps mobile nav by ${overlap}px (card bottom: ${lastCardBox.y + lastCardBox.height}px, nav top: ${navBox.y}px)`,
  ).toBeLessThanOrEqual(0);
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
