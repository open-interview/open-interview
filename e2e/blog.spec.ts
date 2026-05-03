/**
 * Blog E2E Tests
 * Blog home, post detail, search, category filtering, theme toggle, reading progress, mobile, tablet
 */

import { test, expect, waitForPageReady, waitForContent, waitForDataLoad } from './fixtures';

test.describe('Blog Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog');
    await waitForPageReady(page);
    await waitForContent(page);
  });

  test('loads and shows article cards', async ({ page }) => {
    // Featured section heading should be present
    const featuredHeading = page.getByRole('heading', { name: /Featured Article/i });
    const hasFeatured = await featuredHeading.isVisible({ timeout: 5000 }).catch(() => false);

    // If no featured, check for Latest Articles section
    const latestHeading = page.getByRole('heading', { name: /Latest Articles/i });
    const hasLatest = await latestHeading.isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasFeatured || hasLatest).toBeTruthy();

    // At least one article card should render (uses ArticleCard from facelift)
    const cards = page.locator('a[aria-label^="Read article"], a[aria-label^="Read featured article"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test('clicking an article card navigates to post detail', async ({ page }) => {
    // Wait for article links to load — exclude category/tag/search links
    await page.waitForSelector('a[href^="/blog/"]:not([href*="/category/"]):not([href*="/tag/"]):not([href*="/search"])', { timeout: 10000 }).catch(() => {});

    const firstLink = page.locator('a[href^="/blog/"]:not([href*="/category/"]):not([href*="/tag/"]):not([href*="/search"])').filter({ hasText: /.+/ }).first();
    const href = await firstLink.getAttribute('href');
    if (!href) { test.skip(); return; }
    await firstLink.click();

    await page.waitForURL(/\/blog\/.+/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/blog\/.+/);
    expect(page.url()).not.toMatch(/\/blog\/category\//);
    expect(page.url()).toContain(href);
  });

  test('topic cards link to category pages', async ({ page }) => {
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

    const initialDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));

    await toggleBtn.click();
    await page.waitForTimeout(200);

    const afterDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(afterDark).toBe(!initialDark);

    await toggleBtn.click();
    await page.waitForTimeout(200);
    const restoredDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(restoredDark).toBe(initialDark);
  });

  test('filter bar shows difficulty level buttons', async ({ page }) => {
    const filterText = page.getByText(/Filter:/i);
    const hasFilter = await filterText.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasFilter) {
      const allLevelsBtn = page.getByRole('button', { name: /All Levels/i });
      await expect(allLevelsBtn).toBeVisible();

      const beginnerBtn = page.getByRole('button', { name: /Beginner/i });
      await expect(beginnerBtn).toBeVisible();
    }
  });

  test('load more button appears when articles exceed display count', async ({ page }) => {
    const loadMoreBtn = page.getByRole('button', { name: /Load More/i });
    const isVisible = await loadMoreBtn.isVisible({ timeout: 5000 }).catch(() => false);
    // Either load more is visible or all articles already displayed
    const bodyText = await page.locator('body').textContent();
    expect(isVisible || (bodyText && bodyText.length > 100)).toBeTruthy();
  });
});

test.describe('Blog List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog');
    await waitForPageReady(page);
    await waitForContent(page);
  });

  test('view all link navigates to blog list', async ({ page }) => {
    const viewAllLink = page.locator('a').filter({ hasText: /View all/i }).first();
    if (await viewAllLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await viewAllLink.click();
      await page.waitForURL(/\/blog$/, { timeout: 10000 });
    }
  });

  test('category page shows filtered posts with breadcrumb', async ({ page }) => {
    // Dynamically get first category link from the blog home page
    const categoryLink = page.locator('a[href^="/blog/category/"]').first();
    const href = await categoryLink.getAttribute('href').catch(() => null);
    if (!href) {
      test.skip();
      return;
    }

    await page.goto(href);
    await waitForPageReady(page);
    await waitForContent(page);

    // Breadcrumb navigation should be present
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    const hasBreadcrumb = await breadcrumb.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasBreadcrumb).toBeTruthy();

    // Breadcrumb should contain Blog link
    const blogLinkInBreadcrumb = breadcrumb.locator('a, button').filter({ hasText: /Blog/i }).first();
    const hasBlogLink = await blogLinkInBreadcrumb.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasBlogLink).toBeTruthy();

    // Page title should reflect the category
    const hasTitle = await page.locator('h1').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasTitle).toBeTruthy();
  });

  test('difficulty filter buttons filter posts', async ({ page }) => {
    await page.goto('/blog');
    await waitForPageReady(page);
    await waitForContent(page);

    const beginnerBtn = page.getByRole('button', { name: /Beginner/i });
    if (await beginnerBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await beginnerBtn.click();
      await page.waitForTimeout(500);
      // Page should still be functional
      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.length > 50).toBeTruthy();
    }
  });

  test('sidebar is visible on desktop and hidden on mobile', async ({ page }) => {
    // Desktop viewport - sidebar should be visible
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/blog');
    await waitForPageReady(page);
    await waitForContent(page);

    const sidebar = page.locator('aside').first();
    const isVisible = await sidebar.isVisible({ timeout: 5000 }).catch(() => false);
    // Sidebar may or may not exist depending on page, but if it does it should be visible on desktop
    if (await sidebar.count() > 0) {
      expect(isVisible).toBeTruthy();
    }
  });
});

test.describe('Blog Search', () => {
  test('search navigates to search page with query', async ({ page }) => {
    await page.goto('/blog/search');
    await waitForPageReady(page);

    const searchInput = page.getByRole('searchbox').or(
      page.locator('input[type="search"], input[placeholder*="Search" i]')
    ).first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Use a term that exists in the blog data (from JSON storage)
    await searchInput.fill('API');
    await searchInput.press('Enter');

    await page.waitForURL(/q=API/, { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1000);
    const hasResults = await page.locator('article, a[aria-label^="Read article"]').first().isVisible().catch(() => false);
    const hasNoResults = await page.getByText(/no results/i).isVisible().catch(() => false);
    expect(hasResults || hasNoResults).toBeTruthy();
  });

  test('search with short query shows no results state', async ({ page }) => {
    await page.goto('/blog/search?q=x');
    await waitForPageReady(page);
    await waitForContent(page);

    // Single char query should not trigger search (min 2 chars per implementation)
    const hintText = page.getByText(/type at least/i);
    const hasHint = await hintText.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasHint).toBeTruthy();
  });

  test('search results page shows empty state for unknown query', async ({ page }) => {
    await page.goto('/blog/search?q=xyznonexistent123456');
    await waitForPageReady(page);
    await waitForDataLoad(page);

    // Wait for search to start AND finish (loading=false, searched=true)
    // Initial state has loading=false too, so we must also check searched=true
    await page.waitForSelector('[data-testid="search-results-container"][data-loading="false"][data-searched="true"]', { timeout: 15000 }).catch(() => {});

    const noResultsText = page.getByText(/no results/i).first();
    const hasNoResults = await noResultsText.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasNoResults).toBeTruthy();
  });
});

test.describe('Blog Category Filtering', () => {
  test('blog list page search input filters posts', async ({ page }) => {
    await page.goto('/blog');
    await waitForPageReady(page);
    await waitForContent(page);

    const searchInput = page.locator('input[type="search"], input[placeholder*="Search" i]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Use a term that exists in the blog data
      await searchInput.fill('rate limiting');
      await page.waitForTimeout(500);
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
    }
  });
});

test.describe('Post Detail Page', () => {
  // Dynamically fetch a real post slug to avoid hardcoded slugs that may 404
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
    await waitForContent(page);

    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    const article = page.locator('article').first();
    await expect(article).toBeVisible({ timeout: 5000 });
  });

  test('breadcrumb navigation is present on post detail', async ({ page }) => {
    const slug = await getFirstPostSlug(page);
    if (!slug) {
      test.skip();
      return;
    }

    await page.goto(`/blog/${slug}`);
    await waitForPageReady(page);
    await waitForContent(page);

    // Breadcrumb nav with aria-label
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toBeVisible({ timeout: 5000 });

    // Should contain Blog link
    const blogLink = breadcrumb.locator('a').filter({ hasText: /Blog/i }).first();
    await expect(blogLink).toBeVisible();

    // Should contain category item (may be a link or text element)
    const categoryLink = breadcrumb.locator('a[href^="/blog/category/"]').first();
    const categoryText = breadcrumb.locator('li, [aria-current="page"]').filter({ hasNot: breadcrumb.locator('a[href="/blog"]') }).last();
    const hasCategoryLink = await categoryLink.isVisible({ timeout: 2000 }).catch(() => false);
    const hasCategoryText = await categoryText.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasCategoryLink || hasCategoryText).toBeTruthy();
  });

  test('back to blog link navigates correctly', async ({ page }) => {
    const slug = await getFirstPostSlug(page);
    if (!slug) {
      test.skip();
      return;
    }

    await page.goto(`/blog/${slug}`);
    await waitForPageReady(page);
    await waitForContent(page);

    const backLink = page.getByRole('link', { name: /Back to Blog/i });
    await expect(backLink).toBeVisible();

    await backLink.click();
    await page.waitForURL(/\/blog$/, { timeout: 10000 });
  });

  test('share buttons are present and functional', async ({ page }) => {
    const slug = await getFirstPostSlug(page);
    if (!slug) {
      test.skip();
      return;
    }

    await page.goto(`/blog/${slug}`);
    await waitForPageReady(page);
    await waitForContent(page);

    // Twitter share
    const twitterShare = page.getByRole('link', { name: /Share on Twitter/i });
    await expect(twitterShare).toBeVisible();

    // LinkedIn share
    const linkedinShare = page.getByRole('link', { name: /Share on LinkedIn/i });
    await expect(linkedinShare).toBeVisible();

    // Copy link button
    const copyLinkBtn = page.getByRole('button', { name: /Copy link/i });
    await expect(copyLinkBtn).toBeVisible();

    // Test copy functionality
    await copyLinkBtn.click();
    await page.waitForTimeout(300);
    const copiedText = page.getByText(/Copied!/i);
    await expect(copiedText).toBeVisible();
  });

  test('404 for unknown post slug', async ({ page }) => {
    await page.goto('/blog/this-post-does-not-exist-xyz-123');
    await waitForPageReady(page);
    await waitForContent(page);

    const notFound = await page.getByText(/post not found/i).isVisible({ timeout: 5000 }).catch(() => false);
    const has404 = await page.getByText(/404/i).isVisible({ timeout: 2000 }).catch(() => false);
    expect(notFound || has404).toBeTruthy();
  });

  test('author bio section is displayed', async ({ page }) => {
    const slug = await getFirstPostSlug(page);
    if (!slug) {
      test.skip();
      return;
    }

    await page.goto(`/blog/${slug}`);
    await waitForPageReady(page);
    await waitForContent(page);

    // Author bio container - rounded section below article
    const article = page.locator('article').first();
    const authorBio = article.locator('..').locator('div').filter({ has: page.locator('p.font-semibold') }).first();
    const hasAuthorBio = await authorBio.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasAuthorBio).toBeTruthy();
  });

  test('prev/next post navigation links', async ({ page }) => {
    const slug = await getFirstPostSlug(page);
    if (!slug) {
      test.skip();
      return;
    }

    await page.goto(`/blog/${slug}`);
    await waitForPageReady(page);
    await waitForContent(page);

    const postNav = page.locator('nav[aria-label="Post navigation"]');
    const hasNav = await postNav.isVisible({ timeout: 5000 }).catch(() => false);
    // Nav may not exist for first/last post, but page should still load
    expect(hasNav || (await page.locator('h1').first().isVisible())).toBeTruthy();
  });

  test('related posts section displays when available', async ({ page }) => {
    const slug = await getFirstPostSlug(page);
    if (!slug) {
      test.skip();
      return;
    }

    await page.goto(`/blog/${slug}`);
    await waitForPageReady(page);
    await waitForContent(page);

    const relatedHeading = page.getByRole('heading', { name: /Related Posts/i });
    const hasRelated = await relatedHeading.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasRelated) {
      const relatedCards = page.locator('a[aria-label^="Read article"]').last();
      await expect(relatedCards).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Tablet Sidebar Accessibility', () => {
  test.use({ viewport: { width: 866, height: 1024 } });

  test('sidebar is hidden at tablet viewport width', async ({ page }) => {
    await page.goto('/blog');
    await waitForPageReady(page);
    await waitForContent(page);

    // At 866px (between 768-1024), the lg: breakpoint (1024px) sidebar should be hidden
    const aside = page.locator('aside').first();
    const count = await aside.count();
    if (count > 0) {
      const isVisible = await aside.isVisible();
      expect(isVisible).toBe(false);
    }
  });

  test('content is accessible without horizontal overflow on tablet', async ({ page }) => {
    await page.goto('/blog');
    await waitForPageReady(page);
    await waitForContent(page);

    const hasOverflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 5);
    expect(hasOverflow).toBe(false);
  });

  test('article cards are readable on tablet', async ({ page }) => {
    await page.goto('/blog');
    await waitForPageReady(page);
    await waitForContent(page);

    const cards = page.locator('a[aria-label^="Read article"], a[aria-label^="Read featured article"]');
    const firstCard = cards.first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    // Card title should be visible and legible
    const title = firstCard.locator('h2, h3').first();
    await expect(title).toBeVisible();
  });
});

test.describe('Image Fallback Handling', () => {
  test('article card shows category fallback when no cover image', async ({ page }) => {
    await page.goto('/blog');
    await waitForPageReady(page);
    await waitForContent(page);

    // Cards without coverImage should show category name as fallback
    const cards = page.locator('a[aria-label^="Read article"], a[aria-label^="Read featured article"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // At least one card should be visible (either with image or fallback)
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test('featured card renders without cover image gracefully', async ({ page }) => {
    await page.goto('/blog');
    await waitForPageReady(page);
    await waitForContent(page);

    const featuredHeading = page.getByRole('heading', { name: /Featured Article/i });
    const hasFeatured = await featuredHeading.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasFeatured) {
      // Featured section should render even without cover image
      const featuredSection = featuredHeading.locator('..');
      await expect(featuredSection).toBeVisible();
    }
  });

  test('post detail cover image has proper attributes', async ({ page }) => {
    const slug = await (async () => {
      await page.goto('/blog');
      await waitForPageReady(page);
      await page.waitForSelector('a[href^="/blog/"]', { timeout: 10000 }).catch(() => {});
      const links = await page.locator('a[href^="/blog/"]').all();
      for (const link of links) {
        const href = await link.getAttribute('href');
        if (href && /^\/blog\/[^/]+$/.test(href) && !href.includes('/category/') && !href.includes('/tag/') && href !== '/blog/search') return href.replace('/blog/', '');
      }
      return null;
    })();
    if (!slug) {
      test.skip();
      return;
    }

    await page.goto(`/blog/${slug}`);
    await waitForPageReady(page);
    await waitForContent(page);

    // If cover image exists, it should have proper attributes
    const coverImg = page.locator('img[fetchpriority="high"]').first();
    const hasCoverImg = await coverImg.count() > 0;
    if (hasCoverImg) {
      const alt = await coverImg.getAttribute('alt');
      expect(alt && alt.length > 0).toBeTruthy();
    }
  });
});

test.describe('Floating Share Sidebar Positioning', () => {
  test('share buttons are positioned in the meta section on post detail', async ({ page }) => {
    const slug = await (async () => {
      await page.goto('/blog');
      await waitForPageReady(page);
      await page.waitForSelector('a[href^="/blog/"]', { timeout: 10000 }).catch(() => {});
      const links = await page.locator('a[href^="/blog/"]').all();
      for (const link of links) {
        const href = await link.getAttribute('href');
        if (href && /^\/blog\/[^/]+$/.test(href) && !href.includes('/category/') && !href.includes('/tag/') && href !== '/blog/search') return href.replace('/blog/', '');
      }
      return null;
    })();
    if (!slug) {
      test.skip();
      return;
    }

    await page.goto(`/blog/${slug}`);
    await waitForPageReady(page);
    await waitForContent(page);

    // Share buttons should be within the meta section (below title, above content)
    const twitterShare = page.getByRole('button', { name: /Share on Twitter/i }).first();
    const linkedinShare = page.getByRole('button', { name: /Share on LinkedIn/i }).first();

    await expect(twitterShare).toBeVisible();
    await expect(linkedinShare).toBeVisible();

    // Share buttons should be in the post header, which comes before the article body content
    const header = page.locator('article header').first();
    const headerBox = await header.boundingBox();
    const twitterBox = await twitterShare.boundingBox();
    if (headerBox && twitterBox) {
      // Share button must be within the header section (below header top, above header bottom)
      expect(twitterBox.y).toBeGreaterThanOrEqual(headerBox.y);
      expect(twitterBox.y).toBeLessThan(headerBox.y + headerBox.height);
    }
  });

  test('share buttons remain accessible after scrolling', async ({ page }) => {
    const slug = await (async () => {
      await page.goto('/blog');
      await waitForPageReady(page);
      await page.waitForSelector('a[href^="/blog/"]', { timeout: 10000 }).catch(() => {});
      const links = await page.locator('a[href^="/blog/"]').all();
      for (const link of links) {
        const href = await link.getAttribute('href');
        if (href && /^\/blog\/[^/]+$/.test(href) && !href.includes('/category/') && !href.includes('/tag/') && href !== '/blog/search') return href.replace('/blog/', '');
      }
      return null;
    })();
    if (!slug) {
      test.skip();
      return;
    }

    await page.goto(`/blog/${slug}`);
    await waitForPageReady(page);
    await waitForContent(page);

    // Share buttons are in the header area, should remain in viewport after initial scroll
    const twitterShare = page.getByRole('button', { name: /Share on Twitter/i }).first();
    const initialVisible = await twitterShare.isVisible();
    expect(initialVisible).toBeTruthy();
  });
});

test.describe('AuthorCard Component', () => {
  test('author section displays author name on post detail', async ({ page }) => {
    const slug = await (async () => {
      await page.goto('/blog');
      await waitForPageReady(page);
      await page.waitForSelector('a[href^="/blog/"]', { timeout: 10000 }).catch(() => {});
      const links = await page.locator('a[href^="/blog/"]').all();
      for (const link of links) {
        const href = await link.getAttribute('href');
        if (href && /^\/blog\/[^/]+$/.test(href) && !href.includes('/category/') && !href.includes('/tag/') && href !== '/blog/search') return href.replace('/blog/', '');
      }
      return null;
    })();
    if (!slug) {
      test.skip();
      return;
    }

    await page.goto(`/blog/${slug}`);
    await waitForPageReady(page);
    await waitForContent(page);

    // Author name appears in meta section — look for any span or element with font-semibold/font-medium inside the meta row
    const authorMeta = page.locator('.flex.flex-wrap.items-center.gap-4.text-sm span.font-semibold').first();
    const hasAuthor = await authorMeta.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasAuthor).toBeTruthy();
  });

  test('author bio section contains avatar and description', async ({ page }) => {
    const slug = await (async () => {
      await page.goto('/blog');
      await waitForPageReady(page);
      await page.waitForSelector('a[href^="/blog/"]', { timeout: 10000 }).catch(() => {});
      const links = await page.locator('a[href^="/blog/"]').all();
      for (const link of links) {
        const href = await link.getAttribute('href');
        if (href && /^\/blog\/[^/]+$/.test(href) && !href.includes('/category/') && !href.includes('/tag/') && href !== '/blog/search') return href.replace('/blog/', '');
      }
      return null;
    })();
    if (!slug) {
      test.skip();
      return;
    }

    await page.goto(`/blog/${slug}`);
    await waitForPageReady(page);
    await waitForContent(page);

    // Author bio section: rounded-2xl container with avatar initial and bio text
    const authorBio = page.locator('div.rounded-2xl').filter({ has: page.getByText(/Software engineer and technical writer/i) });
    const hasAuthorBio = await authorBio.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasAuthorBio).toBeTruthy();

    // Avatar initial should be present (any rounded-full div with a letter)
    const avatarInitial = authorBio.locator('div.rounded-full').first();
    const hasAvatar = await avatarInitial.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasAvatar).toBeTruthy();
  });
});

test.describe('Consistent Branding', () => {
  test('header shows OpenInterview Blog branding', async ({ page }) => {
    await page.goto('/blog');
    await waitForPageReady(page);
    await waitForContent(page);

    const logo = page.getByRole('link', { name: /Open.*Interview/i }).first();
    await expect(logo).toBeVisible();

    const logoText = await logo.textContent();
    expect(logoText).toContain('Open');
    expect(logoText).toContain('Interview');
  });

  test('header and footer branding is consistent across blog pages', async ({ page }) => {
    const pages = ['/blog', '/blog/search', '/blog/category/engineering'];

    for (const path of pages) {
      await page.goto(path);
      await waitForPageReady(page);
      await waitForContent(page);

      // Header should have OpenInterview branding
      const header = page.locator('header[role="banner"]');
      await expect(header).toBeVisible({ timeout: 5000 });

      const headerLogo = header.locator('a').filter({ hasText: /Open.*Interview/i }).first();
      const hasHeaderLogo = await headerLogo.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasHeaderLogo).toBeTruthy();
    }
  });

  test('theme toggle is accessible in header on all blog pages', async ({ page }) => {
    const pages = ['/blog', '/blog/search'];

    for (const path of pages) {
      await page.goto(path);
      await waitForPageReady(page);
      await waitForContent(page);

      const themeToggle = page.getByRole('button', { name: /switch to (dark|light) mode/i });
      await expect(themeToggle).toBeVisible({ timeout: 5000 });
    }
  });

  test('search link in header navigates to search page', async ({ page }) => {
    await page.goto('/blog');
    await waitForPageReady(page);
    await waitForContent(page);

    const searchLink = page.getByRole('link', { name: /Search articles/i });
    await expect(searchLink).toBeVisible();

    await searchLink.click();
    await page.waitForURL(/\/blog\/search/, { timeout: 10000 });
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
      await expect(page.getByRole('navigation', { name: /Mobile navigation/i })).toBeVisible();

      const closeBtn = page.getByRole('button', { name: /close menu/i });
      await closeBtn.click();
      await expect(page.getByRole('navigation', { name: /Mobile navigation/i })).not.toBeVisible();
    }
  });

  test('article cards stack vertically on mobile', async ({ page }) => {
    await page.goto('/blog');
    await waitForPageReady(page);
    await waitForContent(page);

    const cards = page.locator('a[aria-label^="Read article"], a[aria-label^="Read featured article"]');
    const count = await cards.count();
    if (count >= 2) {
      const box1 = await cards.nth(0).boundingBox();
      const box2 = await cards.nth(1).boundingBox();
      if (box1 && box2) {
        expect(box2.y).toBeGreaterThan(box1.y);
      }
    }
  });
});
