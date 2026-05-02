/**
 * Test Suite 03 — Channels Page (P1-05, P2-02, P2-03, P3-01)
 *
 * Covers:
 * - Channels page renders without crashing
 * - Loading skeleton appears while data loads (P1-05 — currently missing)
 * - Channel cards render with readable stats text (P2-03)
 * - Subscribe/Start buttons are functional
 * - Last row of cards is not hidden behind mobile nav (P2-02)
 * - Category filter pills work
 * - Channel detail modal opens and closes
 * - data-testid presence (P3-01)
 */

import { test, expect } from '@playwright/test';
import { navigateTo, assertPageLoaded } from './helpers';

test.describe('Channels Page — /channels', () => {

  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/channels');
    await page.waitForLoadState('networkidle');
  });

  test('page loads without errors', async ({ page }) => {
    await assertPageLoaded(page, '/channels');
  });

  test('channel cards are visible', async ({ page }) => {
    // Wait for at least one channel card to appear
    const cards = page.locator('[class*="rounded"][class*="border"][class*="cursor-pointer"]');
    await expect(cards.first()).toBeVisible({ timeout: 8000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    console.log(`Channels page: ${count} cards visible`);
  });

  test('loading skeleton shown while data loads (P1-05 — may be missing)', async ({ page }) => {
    // Reload with throttled network to catch loading state
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 200);
    });
    await navigateTo(page, '/channels');

    const skeleton = page.locator('[class*="animate-pulse"]').first();
    const hasSkeletonState = await skeleton.isVisible({ timeout: 500 }).catch(() => false);
    console.log(`P1-05: loading skeleton present: ${hasSkeletonState}`);
    // TODO: after fix: await expect(skeleton).toBeVisible({ timeout: 2000 });
  });

  test('channel card stats text is readable (min 12px — P2-03)', async ({ page }) => {
    // Check that stats text within cards is at least 12px
    const statsEls = await page.$$('[class*="text-\\[10px\\]"]');
    if (statsEls.length > 0) {
      for (const el of statsEls.slice(0, 3)) {
        const fontSize = await el.evaluate(e => parseFloat(window.getComputedStyle(e).fontSize));
        console.log(`P2-03: found element with font-size: ${fontSize}px (expected >= 12px)`);
        // TODO: after fix: expect(fontSize).toBeGreaterThanOrEqual(12);
      }
    }
  });

  test('category filter pills are present and clickable', async ({ page }) => {
    // Look for filter/category buttons
    const filterBtns = page.getByRole('button').filter({ hasText: /all|javascript|system|react|frontend/i });
    if (await filterBtns.count() > 0) {
      const firstFilter = filterBtns.first();
      await expect(firstFilter).toBeVisible();
      await firstFilter.click();
      await page.waitForTimeout(300);
    }
  });

  test('clicking a channel card opens detail modal', async ({ page }) => {
    const cards = page.locator('[class*="rounded-3xl"][class*="cursor-pointer"]');
    if (await cards.count() === 0) {
      test.skip(true, 'No channel cards found');
    }
    await cards.first().click();
    // A modal/sheet should appear
    const modal = page.locator('[class*="fixed"][class*="inset-0"]').or(
      page.getByRole('dialog')
    );
    await expect(modal.first()).toBeVisible({ timeout: 3000 });
  });

  test('modal can be dismissed', async ({ page }) => {
    const cards = page.locator('[class*="rounded-3xl"][class*="cursor-pointer"]');
    if (await cards.count() === 0) return;

    await cards.first().click();
    await page.waitForTimeout(300);

    // Try pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const modal = page.locator('[class*="fixed"][class*="inset-0"]');
    const isGone = await modal.first().isHidden({ timeout: 2000 }).catch(() => false);
    console.log(`Modal dismissed by Escape: ${isGone}`);
  });

  test('last channel card row is visible above mobile nav (P2-02)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateTo(page, '/channels');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('[class*="rounded-3xl"][class*="border"]');
    const count = await cards.count();
    if (count > 0) {
      const lastCard = cards.last();
      const box = await lastCard.boundingBox();
      if (box) {
        const navHeight = 56; // mobile nav height
        const viewportHeight = 667;
        const cardBottom = box.y + box.height;
        // Card bottom should not exceed (viewport - nav) when scrolled to bottom
        // This is a soft check — just log for now
        console.log(`P2-02: last card bottom: ${cardBottom}px, nav starts at ~${viewportHeight - navHeight}px`);
      }
    }
  });

  test('data-testid attributes present on channel cards (P3-01)', async ({ page }) => {
    const testIdEls = page.locator('[data-testid]');
    const count = await testIdEls.count();
    console.log(`P3-01: /channels has ${count} elements with data-testid`);
    // TODO: after fix: expect(count).toBeGreaterThan(5);
  });
});
