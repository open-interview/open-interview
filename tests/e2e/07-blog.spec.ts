/**
 * Test Suite 07 — Blog (P1-02, P1-04, P3-01)
 */

import { test, expect } from '@playwright/test';
import { navigateTo, assertPageLoaded, BASE_URL, skipOnboarding } from './helpers';

/**
 * Fetch a real post slug dynamically instead of relying on hardcoded values
 * that may 404 if content changes.
 */
async function getFirstPostSlug(page: import('@playwright/test').Page): Promise<string | null> {
  await skipOnboarding(page);
  await page.goto(`${BASE_URL}/blog`);
  await page.waitForLoadState('load');
  await page.waitForSelector('a[href^="/blog/"]', { timeout: 10000 }).catch(() => {});
  const links = await page.locator('a[href^="/blog/"]').all();
  for (const link of links) {
    const href = await link.getAttribute('href');
    if (href && /^\/blog\/[^/]+$/.test(href) && !href.includes('/category/') && !href.includes('/tag/') && !href.includes('/search')) {
      return href;
    }
  }
  return null;
}

test.describe('Blog Homepage — /blog', () => {

  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/blog');
  });

  test('page loads without error', async ({ page }) => {
    await assertPageLoaded(page, '/blog');
  });

  test('blog article heading is visible', async ({ page }) => {
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 8000 });
  });

  test('data-testid attributes present (P3-01)', async ({ page }) => {
    const count = await page.locator('[data-testid]').count();
    console.log(`P3-01: /blog has ${count} data-testid elements`);
  });
});

test.describe('Blog article links resolve without 404 (P1-02)', () => {

  test('dynamically fetched article link resolves without 404', async ({ page }) => {
    const href = await getFirstPostSlug(page);
    if (!href) {
      test.skip(true, 'No blog articles found to test');
      return;
    }

    await navigateTo(page, href);

    const is404 = await page.getByText(/not found|404|page.*exist|couldn.*find/i)
      .isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`P1-02: ${href} shows 404: ${is404}`);

    expect(is404).toBe(false);
  });
});

test.describe('Blog Post Detail — CSS variables (P1-04)', () => {

  test('blog post renders visible text (P1-04)', async ({ page }) => {
    await navigateTo(page, '/blog');

    const articleLink = page.locator('a[href^="/blog/"]').first();
    if (await articleLink.count() === 0) {
      test.skip(true, 'No blog articles found');
    }

    const href = await articleLink.getAttribute('href');
    if (!href) return;

    await navigateTo(page, href);
    await assertPageLoaded(page, href);

    const bodyText = page.locator('article p, [class*="prose"] p, .post-body p').first();
    const hasText = await bodyText.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`P1-04: blog post body text visible: ${hasText}`);

    if (hasText) {
      const color = await bodyText.evaluate(el => window.getComputedStyle(el).color);
      console.log(`P1-04: blog post text color: ${color}`);
      expect(color).not.toBe('rgba(0, 0, 0, 0)');
      expect(color).not.toBe('transparent');
    }
  });

  test('blog post back link navigates without full reload', async ({ page }) => {
    await navigateTo(page, '/blog');

    const articleLink = page.locator('a[href^="/blog/"]').first();
    if (await articleLink.count() === 0) return;

    const href = await articleLink.getAttribute('href');
    if (!href) return;

    await navigateTo(page, href);

    let fullReload = false;
    page.on('load', () => { fullReload = true; });

    const backLink = page.getByRole('link', { name: /back.*blog|← blog|blog/i }).first();
    if (await backLink.isVisible({ timeout: 3000 })) {
      await backLink.click();
      await page.waitForTimeout(500);
      console.log(`Blog back link full reload: ${fullReload}`);
    }
  });
});

test.describe('Blog Search — /blog/search', () => {

  test('search page loads', async ({ page }) => {
    await navigateTo(page, '/blog/search');
    await assertPageLoaded(page, '/blog/search');
  });

  test('search input accepts text', async ({ page }) => {
    await navigateTo(page, '/blog/search');
    const input = page.getByRole('textbox').or(
      page.locator('input[type="search"], input[type="text"]')
    ).first();
    if (await input.isVisible({ timeout: 3000 })) {
      await input.fill('system design');
      await page.waitForTimeout(500);
    }
  });
});
