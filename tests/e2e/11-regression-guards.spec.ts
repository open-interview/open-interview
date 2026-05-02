/**
 * Test Suite 11 — Critical Regression Guards
 *
 * Covers gaps identified in the existing suite where tests only console.log
 * but never assert. These are real assertions that will catch regressions.
 *
 * - P1-06: localStorage corruption must not crash the app
 * - P2-02: mobile nav must not overlap last content card
 * - P2-03: card stats text must be >= 12px
 * - P2-04: muted-foreground contrast must pass WCAG AA
 * - P1-07: cert "Start Practice" must not land on 404
 */

import { test, expect } from '@playwright/test';
import { navigateTo, assertPageLoaded, BASE_URL, skipOnboarding, contrastRatio, assertNoNavOverlap } from './helpers';

const MOBILE = { width: 375, height: 667 };

// ---------------------------------------------------------------------------
// P1-06 — localStorage corruption resilience
// ---------------------------------------------------------------------------
test.describe('localStorage resilience (P1-06)', () => {

  const CORRUPT_PAGES = ['/profile', '/bookmarks', '/history', '/badges'];

  for (const path of CORRUPT_PAGES) {
    test(`${path} survives corrupted localStorage`, async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('user-preferences', 'NOT_VALID_JSON{{{');
        localStorage.setItem('user-display-name', 'null');
        localStorage.setItem('saved-q-bad', '{{invalid}}');
      });
      await skipOnboarding(page);
      await page.goto(`${BASE_URL}${path}`);
      await page.waitForLoadState('load');

      // Must not show a JS error message
      await expect(page.getByText(/unexpected token|syntaxerror|referenceerror/i)).not.toBeVisible();
      // Must not show a blank page — at least one element in body
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.trim().length).toBeGreaterThan(0);
    });
  }
});

// ---------------------------------------------------------------------------
// P2-02 — Mobile nav overlap
// ---------------------------------------------------------------------------
test.describe('Mobile nav overlap (P2-02)', () => {

  test('/channels — last card does not overlap mobile nav', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await navigateTo(page, '/channels');
    await page.waitForLoadState('load');

    const cards = page.locator('[data-testid="channel-card"]').or(
      page.locator('[class*="rounded-3xl"][class*="cursor-pointer"]')
    );
    if (await cards.count() === 0) {
      test.skip(true, 'No channel cards found');
    }
    await assertNoNavOverlap(page, cards);
  });

  test('/certifications — last card does not overlap mobile nav', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await navigateTo(page, '/certifications');
    await page.waitForLoadState('load');

    const cards = page.locator('[data-testid="cert-card"]').or(
      page.locator('[class*="rounded-xl"][class*="cursor-pointer"]')
    );
    if (await cards.count() === 0) {
      test.skip(true, 'No cert cards found');
    }
    await assertNoNavOverlap(page, cards);
  });
});

// ---------------------------------------------------------------------------
// P2-03 — Minimum font size on card stats
// ---------------------------------------------------------------------------
test.describe('Card stats font size >= 12px (P2-03)', () => {

  const PAGES_WITH_STATS = ['/channels', '/certifications', '/events'];

  for (const path of PAGES_WITH_STATS) {
    test(`${path} — no stats text below 12px`, async ({ page }) => {
      await navigateTo(page, path);
      await page.waitForLoadState('load');

      const smallEls = page.locator('[class*="text-\\[10px\\]"]');
      const count = await smallEls.count();

      for (let i = 0; i < count; i++) {
        const fontSize = await smallEls.nth(i).evaluate(
          el => parseFloat(window.getComputedStyle(el).fontSize)
        );
        expect(fontSize, `${path}: stats element ${i} has ${fontSize}px (min 12px)`).toBeGreaterThanOrEqual(12);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// P2-04 — WCAG AA contrast for muted text
// ---------------------------------------------------------------------------
test.describe('Color contrast (P2-04)', () => {

  test('muted-foreground on background passes WCAG AA 4.5:1', () => {
    // hsl(220 15% 55%) ≈ #798aab on background #0a0e1a
    const ratio = contrastRatio('#798aab', '#0a0e1a');
    expect(ratio, `muted-foreground contrast ${ratio.toFixed(2)}:1 fails WCAG AA`).toBeGreaterThanOrEqual(4.5);
  });

  test('text-gray-500 on background passes WCAG AA 4.5:1', () => {
    const ratio = contrastRatio('#6b7280', '#0a0e1a');
    expect(ratio, `text-gray-500 contrast ${ratio.toFixed(2)}:1 fails WCAG AA`).toBeGreaterThanOrEqual(4.5);
  });
});

// ---------------------------------------------------------------------------
// P1-07 — Cert "Start Practice" must not 404
// ---------------------------------------------------------------------------
test.describe('Certification Start Practice (P1-07)', () => {

  test('clicking Start Practice on first cert card does not land on 404', async ({ page }) => {
    await navigateTo(page, '/certifications');
    await page.waitForLoadState('load');

    const cards = page.locator('[class*="rounded-xl"][class*="cursor-pointer"]');
    if (await cards.count() === 0) {
      test.skip(true, 'No cert cards found');
    }

    await cards.first().click();
    await page.waitForTimeout(300);

    const startBtn = page.getByRole('button', { name: /start|practice|begin/i }).last();
    if (!(await startBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
      test.skip(true, 'No Start Practice button found in modal');
    }

    await startBtn.click();
    await page.waitForLoadState('load');

    await expect(page.getByText(/not found|404|page.*exist/i)).not.toBeVisible({ timeout: 3000 });
  });
});

// ---------------------------------------------------------------------------
// Keyboard accessibility — focus ring must be visible
// ---------------------------------------------------------------------------
test.describe('Keyboard focus ring', () => {

  test('focused interactive element has visible outline on /channels', async ({ page }) => {
    await navigateTo(page, '/channels');
    await page.waitForLoadState('load');

    await page.keyboard.press('Tab');

    const outlineWidth = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return 0;
      return parseFloat(window.getComputedStyle(el).outlineWidth);
    });

    expect(outlineWidth, 'Focused element has no visible focus ring').toBeGreaterThan(0);
  });
});
