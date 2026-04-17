import { test, expect, setupUser, waitForPageReady, hideMascot } from './fixtures';

const KEY_PAGES = ['/', '/channels', '/learning-paths', '/certifications', '/about'];

test.describe('Theme & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
    await page.goto('/');
    await waitForPageReady(page);
    await hideMascot(page);
  });

  // 1. Page loads with a theme class on html element
  test('html element has dark or light class on load', async ({ page }) => {
    const htmlClass = await page.locator('html').getAttribute('class');
    const dataTheme = await page.locator('html').getAttribute('data-theme');
    const hasTheme =
      (htmlClass?.includes('dark') || htmlClass?.includes('light')) ||
      (dataTheme === 'dark' || dataTheme === 'light');
    expect.soft(hasTheme).toBe(true);
  });

  // 2. Theme toggle button is accessible
  test('theme toggle button has accessible label', async ({ page }) => {
    const toggleBtn = page
      .locator('button')
      .filter({ hasText: /theme|dark|light/i })
      .or(page.locator('[aria-label*="theme" i], [aria-label*="dark" i], [aria-label*="light" i]'))
      .first();

    const found = await toggleBtn.isVisible().catch(() => false);
    if (!found) {
      // Theme may only be toggled via keyboard; skip gracefully
      test.skip();
      return;
    }

    const ariaLabel = await toggleBtn.getAttribute('aria-label');
    const title = await toggleBtn.getAttribute('title');
    const text = await toggleBtn.textContent();
    const hasLabel = !!(ariaLabel || title || (text && text.trim().length > 0));
    expect.soft(hasLabel).toBe(true);
  });

  // 3. 'T' key toggles theme on desktop
  test('pressing T key toggles theme', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Keyboard shortcuts not applicable on mobile');

    const getTheme = () =>
      page.evaluate(() => ({
        cls: document.documentElement.className,
        attr: document.documentElement.getAttribute('data-theme'),
      }));

    const before = await getTheme();
    await page.keyboard.press('t');
    await page.waitForTimeout(300);
    const after = await getTheme();

    const changed = before.cls !== after.cls || before.attr !== after.attr;
    expect.soft(changed).toBe(true);
  });

  // 4. Theme persists after page reload
  test('theme persists after page reload', async ({ page }) => {
    // Force a known theme via localStorage
    await page.evaluate(() => localStorage.setItem('theme', 'light'));
    await page.reload();
    await waitForPageReady(page);

    const htmlClass = await page.locator('html').getAttribute('class');
    const dataTheme = await page.locator('html').getAttribute('data-theme');
    const isLight = htmlClass?.includes('light') || dataTheme === 'light';
    expect.soft(isLight).toBe(true);
  });

  // 5. Key pages render without white-on-white or black-on-black text
  test('no invisible text (white-on-white / black-on-black) on key pages', async ({ page }) => {
    for (const path of KEY_PAGES) {
      await page.goto(path);
      await waitForPageReady(page);

      const issues = await page.evaluate(() => {
        const bad: string[] = [];
        document.querySelectorAll('p, h1, h2, h3, h4, span, a, button, li').forEach((el) => {
          if (!(el as HTMLElement).offsetParent && el.tagName !== 'BODY') return; // skip hidden
          const s = window.getComputedStyle(el);
          const color = s.color;
          const bg = s.backgroundColor;
          // Detect exact same opaque color for text and background
          if (color === bg && !bg.includes('rgba(0, 0, 0, 0)') && !bg.includes('transparent')) {
            bad.push(`${el.tagName}:${el.textContent?.slice(0, 30)}`);
          }
        });
        return bad.slice(0, 5);
      });

      expect.soft(issues, `Invisible text on ${path}`).toHaveLength(0);
    }
  });

  // 6. Focus indicators visible on interactive elements
  test('interactive elements show focus outline', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Focus indicators tested on desktop only');

    // Tab to first few focusable elements and check outline
    let visibleFocusCount = 0;
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const hasFocus = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return false;
        const s = window.getComputedStyle(el);
        const outline = s.outlineWidth;
        const boxShadow = s.boxShadow;
        return (
          (parseFloat(outline) > 0) ||
          (boxShadow !== 'none' && boxShadow !== '')
        );
      });
      if (hasFocus) visibleFocusCount++;
    }
    expect.soft(visibleFocusCount).toBeGreaterThan(0);
  });

  // 7. Images have alt text (spot check)
  test('images have alt attributes', async ({ page }) => {
    const images = await page.locator('img').all();
    let checked = 0;
    for (const img of images.slice(0, 10)) {
      const isVisible = await img.isVisible().catch(() => false);
      if (!isVisible) continue;
      const alt = await img.getAttribute('alt');
      // alt="" is valid for decorative images; null/undefined is not
      expect.soft(alt, `img missing alt: ${await img.getAttribute('src')}`).not.toBeNull();
      checked++;
    }
    // Only assert if we found images to check
    if (checked === 0) test.skip();
  });

  // 8. Buttons have accessible labels
  test('buttons have accessible labels', async ({ page }) => {
    const buttons = await page.locator('button:visible').all();
    let unlabelled = 0;
    for (const btn of buttons.slice(0, 20)) {
      const ariaLabel = await btn.getAttribute('aria-label').catch(() => null);
      const ariaLabelledBy = await btn.getAttribute('aria-labelledby').catch(() => null);
      const text = ((await btn.textContent().catch(() => '')) ?? '').trim();
      const title = await btn.getAttribute('title').catch(() => null);
      const hasLabel = !!(ariaLabel || ariaLabelledBy || text || title);
      if (!hasLabel) unlabelled++;
    }
    expect.soft(unlabelled).toBe(0);
  });

  // 9. Color contrast check on primary text
  test('primary text has sufficient contrast against background', async ({ page }) => {
    const result = await page.evaluate(() => {
      function luminance(r: number, g: number, b: number) {
        const [rs, gs, bs] = [r, g, b].map((c) => {
          const s = c / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      }
      function parseRgb(color: string) {
        const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        return m ? [+m[1], +m[2], +m[3]] : null;
      }
      function contrast(c1: string, c2: string) {
        const a = parseRgb(c1);
        const b = parseRgb(c2);
        if (!a || !b) return null;
        const l1 = luminance(a[0], a[1], a[2]);
        const l2 = luminance(b[0], b[1], b[2]);
        const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
        return (lighter + 0.05) / (darker + 0.05);
      }

      const candidates = Array.from(
        document.querySelectorAll('h1, h2, p, [class*="text-foreground"]')
      ).filter((el) => (el as HTMLElement).offsetParent !== null).slice(0, 5);

      const ratios: number[] = [];
      for (const el of candidates) {
        const s = window.getComputedStyle(el);
        const ratio = contrast(s.color, s.backgroundColor);
        if (ratio !== null && s.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          ratios.push(ratio);
        }
      }
      return ratios;
    });

    for (const ratio of result) {
      // WCAG AA: 4.5:1 for normal text
      expect.soft(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });
});
