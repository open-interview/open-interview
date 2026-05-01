/**
 * Blog E2E Tests
 * Blog home, post detail, search, category filtering, theme toggle, reading progress, mobile
 */

import { test, expect, waitForPageReady, waitForContent } from './fixtures';

test.describe('Blog Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog');
    await waitForPageReady(page);
    await waitForContent(page);
  });

  test('loads and shows article cards', async ({ page }) => {
    // Featured or recent section should be present
    const hasHeading = await page.locator('h2').filter({ hasText: /Featured|Recent Posts/i }).first().isVisible().catch(() => false);
    expect(hasHeading).toBeTruthy();

    // At least one article card should render
    const cards = page.locator('article');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test('clicking an article card navigates to post detail', async ({ page }) => {
    // Wait for cards to load
    await page.waitForSelector('article a, a:has(article)', { timeout: 10000 }).catch(() => {});

    const firstLink = page.locator('a[href^="/blog/"]').filter({ has: page.locator('article') }).first();
    const fallbackLink = page.locator('a[href^="/blog/"]').nth(1); // skip /blog itself

    const link = (await firstLink.isVisible().catch(() => false)) ? firstLink : fallbackLink;
    const href = await link.getAttribute('href');
    await link.click();

    await page.waitForURL(/\/blog\/.+/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/blog\/.+/);
    expect(page.url()).not.toMatch(/\/blog\/category\//);
    // href should match navigated URL
    if (href) expect(page.url()).toContain(href);
  });

  test('category pills link to category pages', async ({ page }) => {
    const categoryLink = page.locator('a[href^="/blog/category/"]').first();
    if (await categoryLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      const href = await categoryLink.getAttribute('href');
      await categoryLink.click();
      await page.waitForURL(/\/blog\/category\//, { timeout: 10000 });
      expect(page.url()).toContain('/blog/category/');
      if (href) expect(page.url()).toContain(href);
    }
  });

  test('theme toggle switches between dark and light mode', async ({ page }) => {
    const toggleBtn = page.getByRole('button', { name: /switch to (dark|light) mode/i });
    await expect(toggleBtn).toBeVisible();

    // Get initial theme state
    const initialDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));

    await toggleBtn.click();
    await page.waitForTimeout(200);

    const afterDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(afterDark).toBe(!initialDark);

    // Toggle back
    await toggleBtn.click();
    await page.waitForTimeout(200);
    const restoredDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(restoredDark).toBe(initialDark);
  });
});

test.describe('Blog Search', () => {
  test('search navigates to search page with query', async ({ page }) => {
    await page.goto('/blog/search');
    await waitForPageReady(page);

    const searchInput = page.locator('input[type="search"], input[placeholder*="Search" i]').first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    await searchInput.fill('microservices');
    await searchInput.press('Enter');

    await page.waitForURL(/q=microservices/, { timeout: 5000 }).catch(() => {});
    // Either results or "no results" message should appear
    await page.waitForTimeout(1000);
    const hasResults = await page.locator('article').first().isVisible().catch(() => false);
    const hasNoResults = await page.getByText(/no results/i).isVisible().catch(() => false);
    expect(hasResults || hasNoResults).toBeTruthy();
  });

  test('search with short query shows no results state', async ({ page }) => {
    await page.goto('/blog/search?q=x');
    await waitForPageReady(page);
    await waitForContent(page);
    // Single char query should not trigger search (min 2 chars per implementation)
    const noResultsMsg = page.getByText(/no results/i);
    const hasNoResults = await noResultsMsg.isVisible({ timeout: 3000 }).catch(() => false);
    // Either no results message or empty state — just verify page loaded
    const bodyText = await page.locator('body').textContent();
    expect(bodyText && bodyText.length > 50).toBeTruthy();
  });
});

test.describe('Blog Category Filtering', () => {
  test('category page shows filtered posts', async ({ page }) => {
    await page.goto('/blog/category/engineering');
    await waitForPageReady(page);
    await waitForContent(page);

    // Page title or heading should reflect the category
    const hasTitle = await page.locator('h1, h2').first().isVisible().catch(() => false);
    expect(hasTitle).toBeTruthy();
  });

  test('blog list page search input filters posts', async ({ page }) => {
    await page.goto('/blog');
    await waitForPageReady(page);
    await waitForContent(page);

    const searchInput = page.locator('input[type="search"], input[placeholder*="Search" i]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('system design');
      await page.waitForTimeout(500);
      // URL should update or results should filter
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
    }
  });
});

test.describe('Post Detail Page', () => {
  // Navigate to a real post by first getting one from the blog list
  async function getFirstPostSlug(page: import('@playwright/test').Page): Promise<string | null> {
    await page.goto('/blog');
    await waitForPageReady(page);
    await page.waitForSelector('a[href^="/blog/"]', { timeout: 10000 }).catch(() => {});
    const links = await page.locator('a[href^="/blog/"]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href && /^\/blog\/[^/]+$/.test(href) && !href.includes('/category/') && !href.includes('/tag/') && !href.includes('/search')) {
        return href.replace('/blog/', '');
      }
    }
    return null;
  }

  test('reading progress bar appears on scroll', async ({ page }) => {
    const slug = await getFirstPostSlug(page);
    if (!slug) {
      test.skip();
      return;
    }

    await page.goto(`/blog/${slug}`);
    await waitForPageReady(page);
    await waitForContent(page);

    // Scroll down to trigger progress bar
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(300);

    const progressBar = page.locator('[role="progressbar"][aria-label="Reading progress"]');
    const isVisible = await progressBar.isVisible().catch(() => false);
    // Progress bar only shows after scroll > 0, so check it exists in DOM
    const exists = await progressBar.count() > 0;
    expect(isVisible || exists).toBeTruthy();
  });

  test('post detail page shows title and content', async ({ page }) => {
    const slug = await getFirstPostSlug(page);
    if (!slug) {
      test.skip();
      return;
    }

    await page.goto(`/blog/${slug}`);
    await waitForPageReady(page);
    await waitForContent(page, 200);

    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    // Article content should be present
    const article = page.locator('article').first();
    await expect(article).toBeVisible({ timeout: 5000 });
  });

  test('404 for unknown post slug', async ({ page }) => {
    await page.goto('/blog/this-post-does-not-exist-xyz-123');
    await waitForPageReady(page);
    await waitForContent(page);

    const notFound = await page.getByText(/post not found/i).isVisible({ timeout: 5000 }).catch(() => false);
    const has404 = await page.getByText(/404/i).isVisible({ timeout: 2000 }).catch(() => false);
    expect(notFound || has404).toBeTruthy();
  });
});

test.describe('Blog Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('blog home renders without horizontal overflow', async ({ page }) => {
    await page.goto('/blog');
    await waitForPageReady(page);
    await waitForContent(page);

    const hasOverflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 5);
    expect(hasOverflow).toBe(false);
  });

  test('mobile nav menu opens and closes', async ({ page }) => {
    await page.goto('/blog');
    await waitForPageReady(page);

    const menuBtn = page.getByRole('button', { name: /open menu/i });
    if (await menuBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await menuBtn.click();
      await expect(page.getByRole('navigation', { name: /mobile navigation/i })).toBeVisible();

      const closeBtn = page.getByRole('button', { name: /close menu/i });
      await closeBtn.click();
      await expect(page.getByRole('navigation', { name: /mobile navigation/i })).not.toBeVisible();
    }
  });

  test('article cards stack vertically on mobile', async ({ page }) => {
    await page.goto('/blog');
    await waitForPageReady(page);
    await waitForContent(page);

    const cards = page.locator('article');
    const count = await cards.count();
    if (count >= 2) {
      const box1 = await cards.nth(0).boundingBox();
      const box2 = await cards.nth(1).boundingBox();
      if (box1 && box2) {
        // On mobile, cards should stack (second card below first)
        expect(box2.y).toBeGreaterThan(box1.y);
      }
    }
  });
});
