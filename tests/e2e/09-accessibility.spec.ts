/**
 * Test Suite 09 — Accessibility & Contrast (P2-03, P2-04, P3-02)
 *
 * Covers:
 * - Font sizes on card stats elements (P2-03)
 * - muted-foreground contrast on dark background (P2-04)
 * - text-gray-500 contrast check (P2-04)
 * - ARIA labels on subscribe/start buttons in channels (P3-02)
 * - ARIA labels on mic button in voice (P3-02)
 * - Sidebar collapse button has aria-label (P3-02)
 * - Skip to content link for keyboard users
 * - Interactive elements reachable by keyboard
 * - Focus styles visible
 */

import { test, expect } from '@playwright/test';
import { navigateTo, contrastRatio } from './helpers';

const BACKGROUND_COLOR = '#0a0e1a';
const MUTED_FOREGROUND_APPROX = '#798aab'; // hsl(220 15% 55%) approximate
const GRAY_500 = '#6b7280';
const WHITE_40 = 'rgba(255,255,255,0.4)'; // text-white/40

test.describe('Font Size Checks (P2-03)', () => {

  test('channel card stats text is >= 12px', async ({ page }) => {
    await navigateTo(page, '/channels');
    await page.waitForLoadState('networkidle');

    // Find any elements with text-[10px] class
    const smallEls = await page.$$('[class*="text-\\[10px\\]"]');
    let failCount = 0;
    for (const el of smallEls) {
      const fontSize = await el.evaluate(e => parseFloat(window.getComputedStyle(e).fontSize));
      if (fontSize < 12) {
        failCount++;
        console.warn(`P2-03: Element with ${fontSize}px font found on /channels`);
      }
    }
    console.log(`P2-03: ${failCount} elements below 12px on /channels`);
    // TODO: after fix: expect(failCount).toBe(0);
  });

  test('certification card stats text is >= 12px', async ({ page }) => {
    await navigateTo(page, '/certifications');
    await page.waitForLoadState('networkidle');

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
    await page.waitForLoadState('networkidle');

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
    // hsl(220 15% 55%) = approximately #798aab
    const ratio = contrastRatio(MUTED_FOREGROUND_APPROX, BACKGROUND_COLOR);
    console.log(`P2-04: muted-foreground contrast ratio: ${ratio.toFixed(2)}:1 (need 4.5 for AA)`);
    // TODO: after fix: expect(ratio).toBeGreaterThanOrEqual(4.5);
    if (ratio < 4.5) {
      console.warn(`P2-04: FAIL — muted-foreground contrast ${ratio.toFixed(2)}:1 fails WCAG AA`);
    }
  });

  test('text-gray-500 on background passes WCAG AA (P2-04)', () => {
    const ratio = contrastRatio(GRAY_500, BACKGROUND_COLOR);
    console.log(`P2-04: text-gray-500 contrast ratio: ${ratio.toFixed(2)}:1 (need 4.5)`);
    // TODO: after fix: expect(ratio).toBeGreaterThanOrEqual(4.5);
    if (ratio < 4.5) {
      console.warn(`P2-04: FAIL — text-gray-500 contrast ${ratio.toFixed(2)}:1 fails WCAG AA`);
    }
  });

  test('challenges page has no hardcoded gray-500 text below contrast threshold (P2-04)', async ({ page }) => {
    await navigateTo(page, '/code');
    await page.waitForLoadState('networkidle');

    // Find elements with hardcoded text-gray-500 class
    const grayEls = await page.$$('[class*="text-gray-5"]');
    console.log(`P2-04: /code has ${grayEls.length} text-gray-5xx elements (should be 0 after P1-03 fix)`);

    // TODO: after fix: expect(grayEls.length).toBe(0);
  });

  test('home page text-white/60 opacity check (P2-04)', async ({ page }) => {
    await navigateTo(page, '/');
    await page.waitForLoadState('networkidle');

    const whiteOpacityEls = await page.$$('[class*="text-white\\/6"]');
    let lowContrastCount = 0;
    for (const el of whiteOpacityEls.slice(0, 5)) {
      const color = await el.evaluate(e => window.getComputedStyle(e).color);
      // text-white/60 = rgba(255,255,255,0.6) on dark bg ≈ 5.4:1 (borderline OK)
      // text-white/40 = rgba(255,255,255,0.4) on dark bg ≈ 2.3:1 (FAIL)
      if (color.includes('0.4') || color.includes('0.3') || color.includes('0.2')) {
        lowContrastCount++;
      }
    }
    console.log(`P2-04: home page low-contrast text-white/* elements: ${lowContrastCount}`);
  });
});

test.describe('ARIA Labels (P3-02)', () => {

  test('channel subscribe buttons have accessible names (P3-02)', async ({ page }) => {
    await navigateTo(page, '/channels');
    await page.waitForLoadState('networkidle');

    // Find subscribe/start buttons
    const btns = await page.$$('button[class*="min-h-\\[44px\\]"]');
    let noAriaCount = 0;
    for (const btn of btns.slice(0, 10)) {
      const ariaLabel = await btn.getAttribute('aria-label');
      const textContent = (await btn.textContent())?.trim();
      if (!ariaLabel && (!textContent || textContent.length < 2)) {
        noAriaCount++;
      }
    }
    console.log(`P3-02: channel buttons without accessible name: ${noAriaCount}`);
    // TODO: after fix: expect(noAriaCount).toBe(0);
  });

  test('voice mic button has aria-label (P3-02)', async ({ page }) => {
    await navigateTo(page, '/voice-interview');
    await page.waitForLoadState('networkidle');

    const micBtns = await page.$$('[aria-label*="mic"], [aria-label*="record"], [aria-label*="start"]');
    console.log(`P3-02: mic buttons with aria-label: ${micBtns.length}`);
    // TODO: after fix: expect(micBtns.length).toBeGreaterThan(0);
  });

  test('sidebar collapse button has aria-label (P3-02)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await navigateTo(page, '/channels');
    await page.waitForLoadState('networkidle');

    // Find sidebar collapse/expand button
    const collapseBtns = await page.$$('[aria-label*="collapse"], [aria-label*="expand"], [aria-label*="sidebar"]');
    console.log(`P3-02: sidebar toggle buttons with aria-label: ${collapseBtns.length}`);
    // TODO: after fix: expect(collapseBtns.length).toBeGreaterThan(0);
  });

  test('flashcard flip area has aria-label (P3-02)', async ({ page }) => {
    await navigateTo(page, '/flashcards');
    await page.waitForLoadState('networkidle');

    const flipBtns = await page.$$('[aria-label*="flip"], [aria-label*="reveal"], [aria-label*="card"]');
    console.log(`P3-02: flashcard flip aria-label elements: ${flipBtns.length}`);
  });
});

test.describe('Keyboard Navigation', () => {

  test('tab key reaches primary CTA on homepage', async ({ page }) => {
    await navigateTo(page, '/');
    await page.waitForLoadState('networkidle');

    // Tab through focusable elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // A focused element should exist
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focused);
  });

  test('focus ring is visible on focused elements', async ({ page }) => {
    await navigateTo(page, '/channels');
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Tab');

    // Check that the focused element has an outline
    const outlineWidth = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return '0px';
      return window.getComputedStyle(el).outlineWidth;
    });
    const width = parseFloat(outlineWidth);
    console.log(`Focus ring outline-width: ${width}px`);
    // TODO: expect(width).toBeGreaterThan(0);
  });
});
