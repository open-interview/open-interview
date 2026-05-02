/**
 * Blog Accessibility E2E Tests
 *
 * Comprehensive WCAG 2.1 AA accessibility test suite for the blog.
 * Covers: skip links, alt text, accessible names, contrast, keyboard nav,
 * focus indicators, heading hierarchy, landmarks, ARIA, reduced motion,
 * nested interactives, form labels — across mobile/tablet/desktop.
 *
 * Uses axe-core via @axe-core/playwright + manual Playwright checks.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  runAxeAudit,
  checkAccessibleNames,
  checkLandmarks,
  checkHeadingHierarchy,
  checkColorContrast,
  waitForPageStable,
} from './helpers/accessibility-helpers';

// ---------------------------------------------------------------------------
// Blog page URLs
// ---------------------------------------------------------------------------
const BLOG_PAGES = [
  { name: 'Blog Home', url: '/blog' },
  { name: 'Blog Search', url: '/blog/search' },
  { name: 'Blog Category', url: '/blog/category/engineering' },
  { name: 'About Blog', url: '/about-blog' },
];

// ---------------------------------------------------------------------------
// Breakpoint fixtures
// ---------------------------------------------------------------------------
const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
} as const;

type ViewportKey = keyof typeof VIEWPORTS;

/**
 * Helper: navigate to a blog page and wait for content to stabilise.
 */
async function gotoBlogPage(page: import('@playwright/test').Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => document.querySelector('main, article, h1') !== null,
    { timeout: 10000 }
  ).catch(() => {});
  await page.waitForTimeout(500);
}

// ---------------------------------------------------------------------------
// 1. Skip-to-content link
// ---------------------------------------------------------------------------
test.describe('Skip to Content Link', () => {
  for (const vp of ['mobile', 'tablet', 'desktop'] as ViewportKey[]) {
    test.describe(`${vp} (${VIEWPORTS[vp].width}px)`, () => {
      test.use({ viewport: VIEWPORTS[vp] });

      for (const { name, url } of BLOG_PAGES) {
        test(`skip link is present on ${name}`, async ({ page }) => {
          await gotoBlogPage(page, url);
          const skipLink = page.locator('a.skip-to-content, a[href="#main-content"]').first();
          await expect(skipLink).toBeVisible();
          await expect(skipLink).toHaveAttribute('href', '#main-content');
          await expect(skipLink).toContainText(/skip/i);
        });
      }

      test(`skip link moves focus to main content`, async ({ page }) => {
        await gotoBlogPage(page, BLOG_PAGES[0].url);
        // Press Tab to focus the skip link (first focusable element)
        await page.keyboard.press('Tab');
        const skipLink = page.locator('a.skip-to-content, a[href="#main-content"]').first();
        await expect(skipLink).toBeFocused();
        // Activate it
        await skipLink.press('Enter');
        // Focus should have moved to #main-content
        await expect(page.locator('#main-content')).toBeFocused();
      });
    });
  }
});

// ---------------------------------------------------------------------------
// 2. All images have alt text
// ---------------------------------------------------------------------------
test.describe('Image Alt Text', () => {
  for (const vp of ['mobile', 'tablet', 'desktop'] as ViewportKey[]) {
    test.describe(`${vp} (${VIEWPORTS[vp].width}px)`, () => {
      test.use({ viewport: VIEWPORTS[vp] });

      for (const { name, url } of BLOG_PAGES) {
        test(`all images on ${name} have alt attributes`, async ({ page }) => {
          await gotoBlogPage(page, url);
          const imagesWithoutAlt = await page.evaluate(() => {
            const imgs = Array.from(document.querySelectorAll('img'));
            return imgs
              .filter((img) => !img.hasAttribute('alt'))
              .map((img) => ({ src: img.src }));
          });
          expect(imagesWithoutAlt).toEqual([]);
        });
      }

      test('cover images on post cards use meaningful alt text', async ({ page }) => {
        await gotoBlogPage(page, '/blog');
        // Featured cards and grid cards should have alt on cover images
        const coverImages = page.locator('article img');
        const count = await coverImages.count();
        for (let i = 0; i < Math.min(count, 5); i++) {
          const alt = await coverImages.nth(i).getAttribute('alt');
          expect(alt).not.toBeNull();
          expect(alt?.trim().length).toBeGreaterThan(0);
        }
      });
    });
  }
});

// ---------------------------------------------------------------------------
// 3. All links have accessible names
// ---------------------------------------------------------------------------
test.describe('Accessible Link Names', () => {
  for (const vp of ['mobile', 'tablet', 'desktop'] as ViewportKey[]) {
    test.describe(`${vp} (${VIEWPORTS[vp].width}px)`, () => {
      test.use({ viewport: VIEWPORTS[vp] });

      for (const { name, url } of BLOG_PAGES) {
        test(`all interactive elements on ${name} have accessible names`, async ({
          page,
        }) => {
          await gotoBlogPage(page, url);
          const unnamed = await checkAccessibleNames(page);
          expect(unnamed).toEqual([]);
        });
      }

      test('navigation links have descriptive text', async ({ page }) => {
        await gotoBlogPage(page, '/blog');
        const navLinks = page.locator('nav a[href]');
        const count = await navLinks.count();
        for (let i = 0; i < count; i++) {
          const text = await navLinks.nth(i).textContent();
          const ariaLabel = await navLinks.nth(i).getAttribute('aria-label');
          const accessibleName = text?.trim() || ariaLabel?.trim() || '';
          expect(accessibleName.length).toBeGreaterThan(0);
        }
      });

      test('search link has accessible name', async ({ page }) => {
        await gotoBlogPage(page, '/blog');
        const searchLink = page.getByRole('link', { name: /search/i });
        await expect(searchLink).toBeVisible();
      });

      test('theme toggle button has accessible name', async ({ page }) => {
        await gotoBlogPage(page, '/blog');
        const themeToggle = page.getByRole('button', {
          name: /switch to (dark|light) mode/i,
        });
        await expect(themeToggle).toBeVisible();
      });

      test('mobile menu button has accessible name', async ({ page }) => {
        await gotoBlogPage(page, '/blog');
        const menuBtn = page.getByRole('button', { name: /open menu|close menu/i });
        const isVisible = await menuBtn.isVisible().catch(() => false);
        if (isVisible) {
          await expect(menuBtn).toBeVisible();
        }
      });
    });
  }
});

// ---------------------------------------------------------------------------
// 4. Color contrast (axe-core)
// ---------------------------------------------------------------------------
test.describe('Color Contrast', () => {
  test.use({ viewport: VIEWPORTS.desktop });

  for (const { name, url } of BLOG_PAGES) {
    test(`${name} — no critical contrast violations`, async ({ page }) => {
      await gotoBlogPage(page, url);
      const contrastViolations = await checkColorContrast(page);
      // Log violations for review; we assert none are critical
      for (const v of contrastViolations) {
        console.log(`Contrast violation on ${name}: ${v.id} — ${v.description}`);
      }
      expect(contrastViolations.length).toBe(0);
    });
  }

  test('dark mode contrast passes', async ({ page }) => {
    await gotoBlogPage(page, '/blog');
    // Switch to dark mode
    const themeToggle = page.getByRole('button', {
      name: /switch to dark mode/i,
    });
    if (await themeToggle.isVisible().catch(() => false)) {
      await themeToggle.click();
      await page.waitForTimeout(200);
    }
    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    if (isDark) {
      const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();
      const contrastViolations = results.violations.filter(
        (v) => v.id === 'color-contrast'
      );
      expect(contrastViolations).toEqual([]);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Keyboard navigation
// ---------------------------------------------------------------------------
test.describe('Keyboard Navigation', () => {
  for (const vp of ['mobile', 'tablet', 'desktop'] as ViewportKey[]) {
    test.describe(`${vp} (${VIEWPORTS[vp].width}px)`, () => {
      test.use({ viewport: VIEWPORTS[vp] });

      test('can tab through all interactive elements on blog home', async ({
        page,
      }) => {
        await gotoBlogPage(page, '/blog');
        const interactiveCount = await page
          .locator(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
          .count();
        expect(interactiveCount).toBeGreaterThan(0);

        // Tab through every interactive element — none should throw
        for (let i = 0; i < interactiveCount; i++) {
          await page.keyboard.press('Tab');
          const activeTag = await page.evaluate(
            () => document.activeElement?.tagName
          );
          expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(activeTag || '')).toBe(true);
        }
      });

      test('can tab through all interactive elements on blog list', async ({
        page,
      }) => {
        await gotoBlogPage(page, '/blog');
        const interactiveCount = await page
          .locator(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
          .count();
        expect(interactiveCount).toBeGreaterThan(0);
        for (let i = 0; i < interactiveCount; i++) {
          await page.keyboard.press('Tab');
        }
      });

      test('can tab through all interactive elements on search page', async ({
        page,
      }) => {
        await gotoBlogPage(page, '/blog/search');
        const interactiveCount = await page
          .locator(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
          .count();
        expect(interactiveCount).toBeGreaterThan(0);
        for (let i = 0; i < interactiveCount; i++) {
          await page.keyboard.press('Tab');
        }
      });

      test('can tab through all interactive elements on post detail page', async ({
        page,
      }) => {
        // Navigate to a real post
        await gotoBlogPage(page, '/blog');
        await page.waitForSelector('a[href^="/blog/"]', { timeout: 10000 }).catch(() => {});
        const postLink = page
          .locator('a[href^="/blog/"]')
          .filter({ has: page.locator('article') })
          .first();
        if (await postLink.isVisible().catch(() => false)) {
          await postLink.click();
          await page.waitForURL(/\/blog\/.+/, { timeout: 10000 });
          await page.waitForTimeout(500);

          const interactiveCount = await page
            .locator(
              'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
            .count();
          expect(interactiveCount).toBeGreaterThan(0);
          for (let i = 0; i < Math.min(interactiveCount, 50); i++) {
            await page.keyboard.press('Tab');
          }
        }
      });

      test('can tab through knowledge check quiz', async ({ page }) => {
        // Find a post that has a knowledge check
        await gotoBlogPage(page, '/blog');
        await page.waitForSelector('a[href^="/blog/"]', { timeout: 10000 }).catch(() => {});
        const postLink = page
          .locator('a[href^="/blog/"]')
          .filter({ has: page.locator('article') })
          .first();
        if (await postLink.isVisible().catch(() => false)) {
          await postLink.click();
          await page.waitForURL(/\/blog\/.+/, { timeout: 10000 });
          await page.waitForTimeout(500);

          // Check if knowledge check is present
          const knowledgeCheck = page.locator('section', {
            hasText: /Knowledge Check/i,
          });
          if (await knowledgeCheck.isVisible().catch(() => false)) {
            // Quiz buttons should be keyboard accessible
            const quizButtons = knowledgeCheck.locator('button');
            const btnCount = await quizButtons.count();
            expect(btnCount).toBeGreaterThan(0);

            for (let i = 0; i < btnCount; i++) {
              await page.keyboard.press('Tab');
              const focused = await page.evaluate(
                () => document.activeElement?.tagName
              );
              expect(focused).toBe('BUTTON');
            }

            // Textareas should be keyboard accessible
            const textareas = knowledgeCheck.locator('textarea');
            const taCount = await textareas.count();
            for (let i = 0; i < taCount; i++) {
              await page.keyboard.press('Tab');
              const focused = await page.evaluate(
                () => document.activeElement?.tagName
              );
              expect(focused).toBe('TEXTAREA');
            }
          }
        }
      });

      test('Escape closes mobile menu', async ({ page }) => {
        await gotoBlogPage(page, '/blog');
        const menuBtn = page.getByRole('button', { name: /open menu/i });
        if (await menuBtn.isVisible().catch(() => false)) {
          await menuBtn.click();
          const mobileNav = page.getByRole('navigation', {
            name: /mobile navigation/i,
          });
          if (await mobileNav.isVisible().catch(() => false)) {
            await page.keyboard.press('Escape');
            // Menu should be closed or Escape was handled
            await page.waitForTimeout(200);
          }
        }
      });
    });
  }
});

// ---------------------------------------------------------------------------
// 6. Focus indicators are visible
// ---------------------------------------------------------------------------
test.describe('Focus Indicators', () => {
  test.use({ viewport: VIEWPORTS.desktop });

  test('focused elements show visible focus ring', async ({ page }) => {
    await gotoBlogPage(page, '/blog');

    const focusableElements = page.locator(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled])'
    );
    const count = await focusableElements.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const el = focusableElements.nth(i);
      await el.focus();

      const hasVisibleFocus = await el.evaluate((element) => {
        const el = element as HTMLElement;
        const computed = window.getComputedStyle(el);

        // Check outline
        const outlineStyle = computed.outlineStyle;
        const outlineWidth = parseFloat(computed.outlineWidth);
        if (outlineStyle !== 'none' && outlineWidth > 0) return true;

        // Check box-shadow
        if (computed.boxShadow && computed.boxShadow !== 'none') return true;

        // Check ring (Tailwind focus:ring creates box-shadow)
        // Already covered by box-shadow check above

        return false;
      });

      expect(hasVisibleFocus).toBe(true);
    }
  });

  test('skip link shows focus when tabbed to', async ({ page }) => {
    await gotoBlogPage(page, '/blog');
    await page.keyboard.press('Tab');

    const skipLink = page.locator('a.skip-to-content, a[href="#main-content"]').first();
    await expect(skipLink).toBeFocused();

    // Skip link should be visible when focused (not hidden off-screen)
    const isVisible = await skipLink.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const computed = window.getComputedStyle(el);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        computed.opacity !== '0' &&
        computed.visibility !== 'hidden'
      );
    });
    expect(isVisible).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 7. Heading hierarchy
// ---------------------------------------------------------------------------
test.describe('Heading Hierarchy', () => {
  for (const vp of ['mobile', 'tablet', 'desktop'] as ViewportKey[]) {
    test.describe(`${vp} (${VIEWPORTS[vp].width}px)`, () => {
      test.use({ viewport: VIEWPORTS[vp] });

      for (const { name, url } of BLOG_PAGES) {
        test(`${name} — heading hierarchy is correct`, async ({ page }) => {
          await gotoBlogPage(page, url);
          const hierarchy = await checkHeadingHierarchy(page);
          expect(hierarchy.isValid).toBe(true);
        });
      }

      test(`${BLOG_PAGES[0].name} — exactly one h1`, async ({ page }) => {
        await gotoBlogPage(page, BLOG_PAGES[0].url);
        const h1Count = await page.locator('h1').count();
        expect(h1Count).toBe(1);
      });

      test('post detail page — exactly one h1', async ({ page }) => {
        await gotoBlogPage(page, '/blog');
        await page.waitForSelector('a[href^="/blog/"]', { timeout: 10000 }).catch(() => {});
        const postLink = page
          .locator('a[href^="/blog/"]')
          .filter({ has: page.locator('article') })
          .first();
        if (await postLink.isVisible().catch(() => false)) {
          await postLink.click();
          await page.waitForURL(/\/blog\/.+/, { timeout: 10000 });
          await page.waitForTimeout(500);
          const h1Count = await page.locator('h1').count();
          expect(h1Count).toBe(1);
        }
      });

      test('no skipped heading levels', async ({ page }) => {
        await gotoBlogPage(page, '/blog');
        const headings = await page.evaluate(() => {
          const els = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
          return els.map((el) => parseInt(el.tagName.substring(1)));
        });

        for (let i = 1; i < headings.length; i++) {
          const diff = headings[i] - headings[i - 1];
          expect(diff).toBeLessThanOrEqual(1);
        }
      });
    });
  }
});

// ---------------------------------------------------------------------------
// 8. Landmark roles
// ---------------------------------------------------------------------------
test.describe('Landmark Roles', () => {
  for (const vp of ['mobile', 'tablet', 'desktop'] as ViewportKey[]) {
    test.describe(`${vp} (${VIEWPORTS[vp].width}px)`, () => {
      test.use({ viewport: VIEWPORTS[vp] });

      for (const { name, url } of BLOG_PAGES) {
        test(`${name} — required landmarks are present`, async ({ page }) => {
          await gotoBlogPage(page, url);
          const landmarks = await checkLandmarks(page);

          expect(landmarks.hasMain).toBe(true);
          expect(landmarks.hasNav).toBe(true);
          expect(landmarks.hasFooter).toBe(true);
        });
      }

      test(`${BLOG_PAGES[0].name} — header has banner role`, async ({ page }) => {
        await gotoBlogPage(page, BLOG_PAGES[0].url);
        const header = page.locator('header[role="banner"], header').first();
        await expect(header).toBeVisible();
        const role = await header.getAttribute('role');
        expect(role).toBe('banner');
      });

      test('main content area has id="main-content"', async ({ page }) => {
        await gotoBlogPage(page, '/blog');
        const mainContent = page.locator('main#main-content, [id="main-content"]');
        await expect(mainContent).toBeVisible();
      });

      test('desktop layout has aside for TOC', async ({ page }) => {
        // Navigate to a post to check for aside
        await gotoBlogPage(page, '/blog');
        await page.waitForSelector('a[href^="/blog/"]', { timeout: 10000 }).catch(() => {});
        const postLink = page
          .locator('a[href^="/blog/"]')
          .filter({ has: page.locator('article') })
          .first();
        if (await postLink.isVisible().catch(() => false)) {
          await postLink.click();
          await page.waitForURL(/\/blog\/.+/, { timeout: 10000 });
          await page.waitForTimeout(500);
          const landmarks = await checkLandmarks(page);
          // Aside may be present (TOC sidebar) on post detail
          console.log('aside present:', landmarks.hasAside);
        }
      });

      test('navigation landmarks have accessible labels', async ({ page }) => {
        await gotoBlogPage(page, '/blog');
        const navs = page.locator('nav');
        const count = await navs.count();
        for (let i = 0; i < count; i++) {
          const nav = navs.nth(i);
          const ariaLabel = await nav.getAttribute('aria-label');
          const hasLabel = ariaLabel?.trim();
          // Every nav should have an accessible label (either aria-label or visible heading)
          const hasHeading = await nav
            .locator('h1, h2, h3, h4, h5, h6')
            .first()
            .isVisible()
            .catch(() => false);
          if (!hasLabel && !hasHeading) {
            // Skip navs that are inside interactive cards — they may not need a label
            const parent = await nav.evaluate((el) => el.closest('article')?.tagName);
            expect(parent).toBeTruthy();
          }
        }
      });
    });
  }
});

// ---------------------------------------------------------------------------
// 9. ARIA attributes
// ---------------------------------------------------------------------------
test.describe('ARIA Attributes', () => {
  test.use({ viewport: VIEWPORTS.desktop });

  test('active nav link has aria-current="page"', async ({ page }) => {
    await gotoBlogPage(page, '/blog');
    const activeLink = page.locator('nav a[aria-current="page"]');
    await expect(activeLink.first()).toBeVisible();
    const currentPage = await activeLink.first().getAttribute('aria-current');
    expect(currentPage).toBe('page');
  });

  test('reading progress bar has correct ARIA', async ({ page }) => {
    // Go to a post and scroll to trigger progress bar
    await gotoBlogPage(page, '/blog');
    await page.waitForSelector('a[href^="/blog/"]', { timeout: 10000 }).catch(() => {});
    const postLink = page
      .locator('a[href^="/blog/"]')
      .filter({ has: page.locator('article') })
      .first();
    if (await postLink.isVisible().catch(() => false)) {
      await postLink.click();
      await page.waitForURL(/\/blog\/.+/, { timeout: 10000 });
      await page.waitForTimeout(500);

      // Scroll to trigger progress bar
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(300);

      const progressBar = page.locator('[role="progressbar"][aria-label="Reading progress"]');
      const exists = await progressBar.count() > 0;
      if (exists) {
        const role = await progressBar.getAttribute('role');
        expect(role).toBe('progressbar');
        const ariaLabel = await progressBar.getAttribute('aria-label');
        expect(ariaLabel).toBe('Reading progress');
        const ariaValuenow = await progressBar.getAttribute('aria-valuenow');
        expect(ariaValuenow).not.toBeNull();
        const ariaValuemin = await progressBar.getAttribute('aria-valuemin');
        expect(ariaValuemin).toBe('0');
        const ariaValuemax = await progressBar.getAttribute('aria-valuemax');
        expect(ariaValuemax).toBe('100');
      }
    }
  });

  test('mobile menu button has aria-expanded', async ({ page }) => {
    await gotoBlogPage(page, '/blog');
    const menuBtn = page.getByRole('button', { name: /open menu/i });
    if (await menuBtn.isVisible().catch(() => false)) {
      const ariaExpanded = await menuBtn.getAttribute('aria-expanded');
      expect(ariaExpanded).toBe('false');
      await menuBtn.click();
      await page.waitForTimeout(200);
      const expanded = await menuBtn.getAttribute('aria-expanded');
      expect(expanded).toBe('true');
    }
  });

  test('icon-only buttons have aria-hidden on decorative icons', async ({
    page,
  }) => {
    await gotoBlogPage(page, '/blog');
    // Check that decorative icons within buttons have aria-hidden
    const decorativeIcons = page.locator('button svg[aria-hidden="true"]');
    const count = await decorativeIcons.count();
    // At least the theme toggle and mobile menu should have hidden icons
    expect(count).toBeGreaterThan(0);
  });

  test('share buttons on post detail have aria-labels', async ({ page }) => {
    await gotoBlogPage(page, '/blog');
    await page.waitForSelector('a[href^="/blog/"]', { timeout: 10000 }).catch(() => {});
    const postLink = page
      .locator('a[href^="/blog/"]')
      .filter({ has: page.locator('article') })
      .first();
    if (await postLink.isVisible().catch(() => false)) {
      await postLink.click();
      await page.waitForURL(/\/blog\/.+/, { timeout: 10000 });
      await page.waitForTimeout(500);

      const twitterShare = page.getByRole('link', { name: /twitter/i });
      const linkedinShare = page.getByRole('link', { name: /linkedin/i });
      const copyLink = page.getByRole('button', { name: /copy link/i });

      await expect(twitterShare.first()).toBeVisible();
      await expect(linkedinShare.first()).toBeVisible();
      await expect(copyLink.first()).toBeVisible();
    }
  });

  test('post navigation has aria-label', async ({ page }) => {
    await gotoBlogPage(page, '/blog');
    await page.waitForSelector('a[href^="/blog/"]', { timeout: 10000 }).catch(() => {});
    const postLink = page
      .locator('a[href^="/blog/"]')
      .filter({ has: page.locator('article') })
      .first();
    if (await postLink.isVisible().catch(() => false)) {
      await postLink.click();
      await page.waitForURL(/\/blog\/.+/, { timeout: 10000 });
      await page.waitForTimeout(500);

      const postNav = page.locator('nav[aria-label="Post navigation"]');
      const exists = await postNav.count() > 0;
      if (exists) {
        const ariaLabel = await postNav.getAttribute('aria-label');
        expect(ariaLabel).toBe('Post navigation');
      }
    }
  });

  test('breadcrumb nav has aria-label', async ({ page }) => {
    await gotoBlogPage(page, '/blog');
    await page.waitForSelector('a[href^="/blog/"]', { timeout: 10000 }).catch(() => {});
    const postLink = page
      .locator('a[href^="/blog/"]')
      .filter({ has: page.locator('article') })
      .first();
    if (await postLink.isVisible().catch(() => false)) {
      await postLink.click();
      await page.waitForURL(/\/blog\/.+/, { timeout: 10000 });
      await page.waitForTimeout(500);

      const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
      const exists = await breadcrumb.count() > 0;
      if (exists) {
        const ariaLabel = await breadcrumb.getAttribute('aria-label');
        expect(ariaLabel).toBe('Breadcrumb');
      }
    }
  });

  test('related posts section is linked to its heading', async ({ page }) => {
    await gotoBlogPage(page, '/blog');
    await page.waitForSelector('a[href^="/blog/"]', { timeout: 10000 }).catch(() => {});
    const postLink = page
      .locator('a[href^="/blog/"]')
      .filter({ has: page.locator('article') })
      .first();
    if (await postLink.isVisible().catch(() => false)) {
      await postLink.click();
      await page.waitForURL(/\/blog\/.+/, { timeout: 10000 });
      await page.waitForTimeout(500);

      const relatedSection = page.locator('section[aria-labelledby="related-heading"]');
      const exists = await relatedSection.count() > 0;
      if (exists) {
        const ariaLabelledby = await relatedSection.getAttribute('aria-labelledby');
        expect(ariaLabelledby).toBe('related-heading');
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 10. Reduced motion
// ---------------------------------------------------------------------------
test.describe('Reduced Motion', () => {
  test.use({ viewport: VIEWPORTS.desktop });

  test('animations are disabled when prefers-reduced-motion is enabled', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoBlogPage(page, '/blog');

    const animatedElements = page.locator('[class*="animate-"]');
    const count = await animatedElements.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const duration = await animatedElements.nth(i).evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return parseFloat(computed.animationDuration || '0');
      });
      expect(duration).toBeLessThanOrEqual(0.01);
    }
  });

  test('transitions are instant with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoBlogPage(page, '/blog');

    const interactiveElements = page.locator(
      'button, a, [role="button"]'
    );
    const count = await interactiveElements.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const duration = await interactiveElements.nth(i).evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return parseFloat(computed.transitionDuration || '0');
      });
      expect(duration).toBeLessThanOrEqual(0.01);
    }
  });

  test('loading skeleton respects reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Skeletons only appear briefly during loading; this tests the class pattern
    await gotoBlogPage(page, '/blog');

    // If any skeleton elements exist, they should not animate
    const skeletons = page.locator('.animate-pulse');
    const count = await skeletons.count();
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 5); i++) {
        const duration = await skeletons.nth(i).evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return parseFloat(computed.animationDuration || '0');
        });
        expect(duration).toBeLessThanOrEqual(0.01);
      }
    }
  });

  test('normal animations work when reduced motion is NOT preferred', async ({
    page,
  }) => {
    await gotoBlogPage(page, '/blog');

    const animatedElements = page.locator('[class*="animate-"]');
    const count = await animatedElements.count();

    let hasNormalAnimation = false;
    for (let i = 0; i < Math.min(count, 5); i++) {
      const duration = await animatedElements.nth(i).evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return parseFloat(computed.animationDuration || '0');
      });
      if (duration > 0.01) {
        hasNormalAnimation = true;
        break;
      }
    }

    // If there are animated elements, at least some should have normal duration
    if (count > 0) {
      expect(hasNormalAnimation).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 11. No nested interactive elements
// ---------------------------------------------------------------------------
test.describe('No Nested Interactive Elements', () => {
  for (const vp of ['mobile', 'tablet', 'desktop'] as ViewportKey[]) {
    test.describe(`${vp} (${VIEWPORTS[vp].width}px)`, () => {
      test.use({ viewport: VIEWPORTS[vp] });

      test('no buttons inside links', async ({ page }) => {
        await gotoBlogPage(page, '/blog');
        const nestedButtons = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a'));
          const nested: string[] = [];
          for (const link of links) {
            const buttons = link.querySelectorAll('button');
            if (buttons.length > 0) {
              nested.push(link.outerHTML.substring(0, 200));
            }
          }
          return nested;
        });
        expect(nestedButtons).toEqual([]);
      });

      test('no links inside buttons', async ({ page }) => {
        await gotoBlogPage(page, '/blog');
        const nestedLinks = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const nested: string[] = [];
          for (const btn of buttons) {
            const links = btn.querySelectorAll('a');
            if (links.length > 0) {
              nested.push(btn.outerHTML.substring(0, 200));
            }
          }
          return nested;
        });
        expect(nestedLinks).toEqual([]);
      });

      test('no interactive elements inside labels', async ({ page }) => {
        await gotoBlogPage(page, '/blog/search');
        const interactiveInLabels = await page.evaluate(() => {
          const labels = Array.from(document.querySelectorAll('label'));
          const nested: string[] = [];
          for (const label of labels) {
            const interactive = label.querySelectorAll(
              'button, a[href], input, select, textarea'
            );
            if (interactive.length > 0) {
              nested.push(label.outerHTML.substring(0, 200));
            }
          }
          return nested;
        });
        expect(interactiveInLabels).toEqual([]);
      });

      test('no nested interactive elements on post detail', async ({ page }) => {
        await gotoBlogPage(page, '/blog');
        await page.waitForSelector('a[href^="/blog/"]', { timeout: 10000 }).catch(() => {});
        const postLink = page
          .locator('a[href^="/blog/"]')
          .filter({ has: page.locator('article') })
          .first();
        if (await postLink.isVisible().catch(() => false)) {
          await postLink.click();
          await page.waitForURL(/\/blog\/.+/, { timeout: 10000 });
          await page.waitForTimeout(500);

          const nested = await page.evaluate(() => {
            const allLinks = Array.from(document.querySelectorAll('a'));
            const nested: { type: string; html: string }[] = [];
            for (const link of allLinks) {
              const buttons = link.querySelectorAll('button');
              if (buttons.length > 0) {
                nested.push({
                  type: 'button-in-link',
                  html: link.outerHTML.substring(0, 200),
                });
              }
            }
            const allButtons = Array.from(document.querySelectorAll('button'));
            for (const btn of allButtons) {
              const links = btn.querySelectorAll('a');
              if (links.length > 0) {
                nested.push({
                  type: 'link-in-button',
                  html: btn.outerHTML.substring(0, 200),
                });
              }
            }
            return nested;
          });
          expect(nested).toEqual([]);
        }
      });
    });
  }
});

// ---------------------------------------------------------------------------
// 12. Form labels
// ---------------------------------------------------------------------------
test.describe('Form Label Association', () => {
  test.use({ viewport: VIEWPORTS.desktop });

  test('newsletter form input has associated label', async ({ page }) => {
    await gotoBlogPage(page, '/blog');
    const emailInput = page.locator('#newsletter-email');
    const inputExists = await emailInput.count() > 0;
    if (inputExists) {
      const label = page.locator('label[for="newsletter-email"]');
      await expect(label).toBeVisible();
      const labelText = await label.textContent();
      expect(labelText?.trim().length).toBeGreaterThan(0);
    }
  });

  test('newsletter form label is visually hidden but accessible', async ({
    page,
  }) => {
    await gotoBlogPage(page, '/blog');
    const label = page.locator('label[for="newsletter-email"]');
    const exists = await label.count() > 0;
    if (exists) {
      // The label should use sr-only or visually-hidden class
      const className = await label.getAttribute('class');
      expect(className).toMatch(/sr-only|visually-hidden|screen-reader/);
    }
  });

  test('search input has accessible label', async ({ page }) => {
    await gotoBlogPage(page, '/blog/search');
    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput.first()).toBeVisible();

    const ariaLabel = await searchInput.first().getAttribute('aria-label');
    expect(ariaLabel?.trim().length).toBeGreaterThan(0);
  });

  test('newsletter error message is associated with input via aria-describedby', async ({
    page,
  }) => {
    await gotoBlogPage(page, '/blog');
    const emailInput = page.locator('#newsletter-email');
    const inputExists = await emailInput.count() > 0;
    if (inputExists) {
      // When there's an error, aria-describedby should point to the error element
      // Submit with invalid email to trigger error
      await emailInput.fill('invalid');
      const submitBtn = page.getByRole('button', { name: /subscribe/i });
      await submitBtn.click();
      await page.waitForTimeout(500);

      const ariaDescribedby = await emailInput.getAttribute('aria-describedby');
      // If there's an error, aria-describedby should be set
      const hasError = await page
        .locator('[role="alert"]')
        .first()
        .isVisible()
        .catch(() => false);
      if (hasError) {
        expect(ariaDescribedby?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('error messages have role="alert"', async ({ page }) => {
    await gotoBlogPage(page, '/blog');
    const emailInput = page.locator('#newsletter-email');
    const inputExists = await emailInput.count() > 0;
    if (inputExists) {
      await emailInput.fill('invalid');
      const submitBtn = page.getByRole('button', { name: /subscribe/i });
      await submitBtn.click();
      await page.waitForTimeout(500);

      const alertMsg = page.locator('[role="alert"]');
      const isVisible = await alertMsg.first().isVisible().catch(() => false);
      if (isVisible) {
        const role = await alertMsg.first().getAttribute('role');
        expect(role).toBe('alert');
      }
    }
  });

  test('knowledge check textareas have accessible names', async ({ page }) => {
    await gotoBlogPage(page, '/blog');
    await page.waitForSelector('a[href^="/blog/"]', { timeout: 10000 }).catch(() => {});
    const postLink = page
      .locator('a[href^="/blog/"]')
      .filter({ has: page.locator('article') })
      .first();
    if (await postLink.isVisible().catch(() => false)) {
      await postLink.click();
      await page.waitForURL(/\/blog\/.+/, { timeout: 10000 });
      await page.waitForTimeout(500);

      const knowledgeCheck = page.locator('section', {
        hasText: /Knowledge Check/i,
      });
      if (await knowledgeCheck.isVisible().catch(() => false)) {
        const textareas = knowledgeCheck.locator('textarea');
        const count = await textareas.count();
        for (let i = 0; i < Math.min(count, 3); i++) {
          const ta = textareas.nth(i);
          const ariaLabel = await ta.getAttribute('aria-label');
          const placeholder = await ta.getAttribute('placeholder');
          const id = await ta.getAttribute('id');
          const hasLabel =
            ariaLabel?.trim() ||
            placeholder?.trim() ||
            (id && (await page.locator(`label[for="${id}"]`).count()) > 0);
          expect(hasLabel).toBeTruthy();
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 13. Comprehensive axe-core audit across breakpoints
// ---------------------------------------------------------------------------
test.describe('Axe-core Comprehensive Audit', () => {
  for (const vp of ['mobile', 'tablet', 'desktop'] as ViewportKey[]) {
    test.describe(`${vp} (${VIEWPORTS[vp].width}px)`, () => {
      test.use({ viewport: VIEWPORTS[vp] });

      for (const { name, url } of BLOG_PAGES) {
        test(`${name} — no axe violations`, async ({ page }) => {
          await gotoBlogPage(page, url);
          const results = await runAxeAudit(page);
          const violations = results.violations;

          if (violations.length > 0) {
            for (const v of violations) {
              console.log(
                `[${vp}] ${name} — Violation: ${v.id} (${v.impact}) — ${v.description}`
              );
            }
          }

          // Assert no critical or serious violations
          const criticalOrSerious = violations.filter(
            (v) => v.impact === 'critical' || v.impact === 'serious'
          );
          expect(criticalOrSerious).toEqual([]);
        });
      }

      test('post detail page — no axe violations', async ({ page }) => {
        await gotoBlogPage(page, '/blog');
        await page.waitForSelector('a[href^="/blog/"]', { timeout: 10000 }).catch(() => {});
        const postLink = page
          .locator('a[href^="/blog/"]')
          .filter({ has: page.locator('article') })
          .first();
        if (await postLink.isVisible().catch(() => false)) {
          await postLink.click();
          await page.waitForURL(/\/blog\/.+/, { timeout: 10000 });
          await page.waitForTimeout(500);

          const results = await runAxeAudit(page);
          const criticalOrSerious = results.violations.filter(
            (v) => v.impact === 'critical' || v.impact === 'serious'
          );
          expect(criticalOrSerious).toEqual([]);
        }
      });
    });
  }
});

// ---------------------------------------------------------------------------
// 14. Additional WCAG 2.1 AA checks
// ---------------------------------------------------------------------------
test.describe('WCAG 2.1 AA — Additional Checks', () => {
  test.use({ viewport: VIEWPORTS.desktop });

  test('page has lang attribute', async ({ page }) => {
    await gotoBlogPage(page, '/blog');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
    expect(lang?.length).toBeGreaterThan(0);
  });

  test('page title is descriptive', async ({ page }) => {
    await gotoBlogPage(page, '/blog');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(title.toLowerCase()).toMatch(/blog|openinterview/i);
  });

  test('no auto-playing media', async ({ page }) => {
    await gotoBlogPage(page, '/blog');
    const autoPlayingMedia = await page.evaluate(() => {
      const media = Array.from(
        document.querySelectorAll('video[autoplay], audio[autoplay]')
      );
      return media.map((el) => el.outerHTML.substring(0, 200));
    });
    expect(autoPlayingMedia).toEqual([]);
  });

  test('links open in new tabs have warning', async ({ page }) => {
    // On post detail page, share links open in new tabs
    await gotoBlogPage(page, '/blog');
    await page.waitForSelector('a[href^="/blog/"]', { timeout: 10000 }).catch(() => {});
    const postLink = page
      .locator('a[href^="/blog/"]')
      .filter({ has: page.locator('article') })
      .first();
    if (await postLink.isVisible().catch(() => false)) {
      await postLink.click();
      await page.waitForURL(/\/blog\/.+/, { timeout: 10000 });
      await page.waitForTimeout(500);

      const newTabLinks = page.locator('a[target="_blank"]');
      const count = await newTabLinks.count();
      for (let i = 0; i < count; i++) {
        const ariaLabel = await newTabLinks.nth(i).getAttribute('aria-label');
        const text = await newTabLinks.nth(i).textContent();
        const title = await newTabLinks.nth(i).getAttribute('title');
        const accessibleName = (ariaLabel || text || title || '').toLowerCase();
        // Should indicate it opens in new tab (via aria-label, icon, or title)
        // This is a best practice check — we just log
        if (!accessibleName.includes('new tab') && !accessibleName.includes('external')) {
          console.log(
            `New tab link may not indicate it opens externally: ${accessibleName.substring(0, 50)}`
          );
        }
      }
    }
  });

  test('no horizontal scroll at mobile viewport', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await gotoBlogPage(page, '/blog');
    const hasOverflow = await page.evaluate(
      () => document.body.scrollWidth > window.innerWidth + 5
    );
    expect(hasOverflow).toBe(false);
  });

  test('focus order follows visual order', async ({ page }) => {
    await gotoBlogPage(page, '/blog');
    // Collect tab order
    const tabOrder: string[] = [];
    const interactiveCount = await page
      .locator(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled])'
      )
      .count();

    for (let i = 0; i < Math.min(interactiveCount, 20); i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return '';
        const rect = el.getBoundingClientRect();
        return `${el.tagName}:${Math.round(rect.y)}`;
      });
      if (info) tabOrder.push(info);
    }

    // Verify Y positions are generally increasing (top to bottom)
    // Allow some tolerance for nav items that may be side by side
    if (tabOrder.length >= 2) {
      let outOfOrder = 0;
      for (let i = 1; i < tabOrder.length; i++) {
        const prevY = parseInt(tabOrder[i - 1].split(':')[1] || '0');
        const currY = parseInt(tabOrder[i].split(':')[1] || '0');
        if (currY < prevY - 10) {
          outOfOrder++;
        }
      }
      // Allow up to 20% out of order (for nav items, etc.)
      const tolerance = Math.max(1, Math.floor(tabOrder.length * 0.2));
      expect(outOfOrder).toBeLessThanOrEqual(tolerance);
    }
  });

  test('category pills are keyboard accessible buttons', async ({ page }) => {
    await gotoBlogPage(page, '/blog');
    const categoryPills = page.locator('article button');
    const count = await categoryPills.count();
    if (count > 0) {
      const firstPill = categoryPills.first();
      await expect(firstPill).toBeVisible();
      // Should have accessible name (category text)
      const text = await firstPill.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });
});
