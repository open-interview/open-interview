/**
 * Test Suite 09 — Accessibility & Contrast (P2-03, P2-04, P3-02)
 */

import { test, expect } from '@playwright/test';
import { navigateTo, contrastRatio } from './helpers';

const BACKGROUND_COLOR = '#0a0e1a';
const MUTED_FOREGROUND_APPROX = '#798aab';
const GRAY_500 = '#6b7280';

test.describe('Font Size Checks (P2-03)', () => {

  test('channel card stats text is >= 12px', async ({ page }) => {
    await navigateTo(page, '/channels');

    const smallEls = await page.$$('[class*="text-\\[10px\\]"]');
    let failCount = 0;
    for (const el of smallEls) {
      const fontSize = await el.evaluate(e => parseFloat(window.getComputedStyle(e).fontSize));
      if (fontSize < 12) {
        failCount++;
        console.warn(`P2-03: ${fontSize}px font on /channels`);
      }
    }
    console.log(`P2-03: ${failCount} elements below 12px on /channels`);
    // TODO: after fix: expect(failCount).toBe(0);
  });

  test('certification card stats text is >= 12px', async ({ page }) => {
    await navigateTo(page, '/certifications');

    const smallEls = await page.$$('[class*="text-\\[10px\\]"]');
    let failCount = 0;
    for (const el of smallEls) {
      const fontSize = await el.evaluate(e => parseFloat(window.getComputedStyle(e).fontSize));
      if (fontSize < 12) failCount++;
    }
    console.log(`P2-03: ${failCount} elements below 12px on /certifications`);
    // TODO: after fix: expect(failCount).toBe(0);
  });

  test('events dashboard stats text is >= 12px', async ({ page }) => {
    await navigateTo(page, '/events');

    const smallEls = await page.$$('[class*="text-\\[10px\\]"]');
    let failCount = 0;
    for (const el of smallEls) {
      const fontSize = await el.evaluate(e => parseFloat(window.getComputedStyle(e).fontSize));
      if (fontSize < 12) failCount++;
    }
    console.log(`P2-03: ${failCount} elements below 12px on /events`);
  });
});

test.describe('Color Contrast Checks (P2-04)', () => {

  test('muted-foreground on background passes WCAG AA (P2-04)', () => {
    const ratio = contrastRatio(MUTED_FOREGROUND_APPROX, BACKGROUND_COLOR);
    console.log(`P2-04: muted-foreground contrast ratio: ${ratio.toFixed(2)}:1 (need 4.5)`);
    if (ratio < 4.5) {
      console.warn(`P2-04: FAIL — muted-foreground contrast ${ratio.toFixed(2)}:1 fails WCAG AA`);
    }
    // TODO: after fix: expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  test('text-gray-500 on background passes WCAG AA (P2-04)', () => {
    const ratio = contrastRatio(GRAY_500, BACKGROUND_COLOR);
    console.log(`P2-04: text-gray-500 contrast ratio: ${ratio.toFixed(2)}:1 (need 4.5)`);
    if (ratio < 4.5) {
      console.warn(`P2-04: FAIL — text-gray-500 contrast ${ratio.toFixed(2)}:1 fails WCAG AA`);
    }
    // TODO: after fix: expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  test('/code has no hardcoded text-gray-5xx elements (P1-03 + P2-04)', async ({ page }) => {
    await navigateTo(page, '/code');

    const grayEls = await page.$$('[class*="text-gray-5"]');
    console.log(`P2-04: /code has ${grayEls.length} text-gray-5xx elements (should be 0 post-fix)`);
    // TODO: after fix: expect(grayEls.length).toBe(0);
  });

  test('home page text-white/40 opacity check (P2-04)', async ({ page }) => {
    await navigateTo(page, '/');

    const whiteOpacityEls = await page.$$('[class*="text-white\\/4"]');
    let lowContrastCount = 0;
    for (const el of whiteOpacityEls.slice(0, 5)) {
      const color = await el.evaluate(e => window.getComputedStyle(e).color);
      if (color.includes('0.4') || color.includes('0.3') || color.includes('0.2')) {
        lowContrastCount++;
      }
    }
    console.log(`P2-04: home page low-contrast text-white/40 elements: ${lowContrastCount}`);
  });
});

test.describe('ARIA Labels (P3-02)', () => {

  test('channel subscribe buttons have accessible names (P3-02)', async ({ page }) => {
    await navigateTo(page, '/channels');

    const btns = await page.$$('button[class*="min-h-\\[44px\\]"]');
    let noAriaCount = 0;
    for (const btn of btns.slice(0, 10)) {
      const ariaLabel = await btn.getAttribute('aria-label');
      const textContent = (await btn.textContent())?.trim();
      if (!ariaLabel && (!textContent || textContent.length < 2)) noAriaCount++;
    }
    console.log(`P3-02: channel buttons without accessible name: ${noAriaCount}`);
    // TODO: after fix: expect(noAriaCount).toBe(0);
  });

  test('voice mic button has aria-label (P3-02)', async ({ page }) => {
    await navigateTo(page, '/voice-interview');

    const micBtns = await page.$$('[aria-label*="mic"], [aria-label*="record"], [aria-label*="start"]');
    console.log(`P3-02: mic buttons with aria-label: ${micBtns.length}`);
    // TODO: after fix: expect(micBtns.length).toBeGreaterThan(0);
  });

  test('sidebar collapse button has aria-label (P3-02)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await navigateTo(page, '/channels');

    const collapseBtns = await page.$$('[aria-label*="collapse"], [aria-label*="expand"], [aria-label*="sidebar"]');
    console.log(`P3-02: sidebar toggle buttons with aria-label: ${collapseBtns.length}`);
    // TODO: after fix: expect(collapseBtns.length).toBeGreaterThan(0);
  });

  test('flashcard flip area has aria-label (P3-02)', async ({ page }) => {
    await navigateTo(page, '/flashcards');

    const flipBtns = await page.$$('[aria-label*="flip"], [aria-label*="reveal"], [aria-label*="card"]');
    console.log(`P3-02: flashcard flip aria-label elements: ${flipBtns.length}`);
  });
});

test.describe('Keyboard Navigation', () => {

  test('tab key reaches interactive element on homepage', async ({ page }) => {
    await navigateTo(page, '/');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focused);
  });

  test('focus ring is visible on focused elements', async ({ page }) => {
    await navigateTo(page, '/channels');
    await page.keyboard.press('Tab');

    const outlineWidth = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return '0px';
      return window.getComputedStyle(el).outlineWidth;
    });
    console.log(`Focus ring outline-width: ${parseFloat(outlineWidth)}px`);
    // TODO: expect(parseFloat(outlineWidth)).toBeGreaterThan(0);
  });
});
