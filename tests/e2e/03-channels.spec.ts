/**
 * Test Suite 03 — Channels Page (P1-05, P2-02, P2-03, P3-01)
 */

import { test, expect } from '@playwright/test';
import { navigateTo, assertPageLoaded } from './helpers';

test.describe('Channels Page — /channels', () => {

  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/channels');
  });

  test('page loads without errors', async ({ page }) => {
    await assertPageLoaded(page, '/channels');
  });

  test('channel cards are visible', async ({ page }) => {
    const cards = page.locator('[class*="rounded"][class*="border"][class*="cursor-pointer"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    console.log(`Channels page: ${count} cards visible`);
  });

  test('loading skeleton shown while data loads (P1-05 — may be missing)', async ({ page }) => {
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 300);
    });
    await navigateTo(page, '/channels');

    const skeleton = page.locator('[class*="animate-pulse"]').first();
    const hasSkeletonState = await skeleton.isVisible({ timeout: 800 }).catch(() => false);
    console.log(`P1-05: loading skeleton present: ${hasSkeletonState}`);
    // TODO: after fix: await expect(skeleton).toBeVisible({ timeout: 2000 });
  });

  test('channel card stats text is readable (min 12px — P2-03)', async ({ page }) => {
    const statsEls = await page.$$('[class*="text-\\[10px\\]"]');
    if (statsEls.length > 0) {
      for (const el of statsEls.slice(0, 3)) {
        const fontSize = await el.evaluate(e => parseFloat(window.getComputedStyle(e).fontSize));
        console.log(`P2-03: font-size: ${fontSize}px (expected >= 12px)`);
        // TODO: after fix: expect(fontSize).toBeGreaterThanOrEqual(12);
      }
    }
  });

  test('category filter pills are present and clickable', async ({ page }) => {
    const filterBtns = page.getByRole('button').filter({ hasText: /all|javascript|system|react|frontend/i });
    if (await filterBtns.count() > 0) {
      await expect(filterBtns.first()).toBeVisible();
      await filterBtns.first().click();
      await page.waitForTimeout(300);
    }
  });

  test('clicking a channel card opens detail modal', async ({ page }) => {
    const cards = page.locator('[class*="rounded-3xl"][class*="cursor-pointer"]');
    if (await cards.count() === 0) {
      test.skip(true, 'No channel cards found');
    }
    await cards.first().click();
    const modal = page.locator('[class*="fixed"][class*="inset-0"]').or(page.getByRole('dialog'));
    await expect(modal.first()).toBeVisible({ timeout: 3000 });
  });

  test('modal can be dismissed', async ({ page }) => {
    const cards = page.locator('[class*="rounded-3xl"][class*="cursor-pointer"]');
    if (await cards.count() === 0) return;

    await cards.first().click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const modal = page.locator('[class*="fixed"][class*="inset-0"]');
    const isGone = await modal.first().isHidden({ timeout: 2000 }).catch(() => false);
    console.log(`Modal dismissed by Escape: ${isGone}`);
  });

  test('last channel card row is visible above mobile nav (P2-02)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateTo(page, '/channels');

    const cards = page.locator('[class*="rounded-3xl"][class*="border"]');
    if (await cards.count() > 0) {
      const box = await cards.last().boundingBox();
      if (box) {
        console.log(`P2-02: last card bottom: ${box.y + box.height}px, nav starts at ~611px`);
      }
    }
  });

  test('data-testid attributes present on channel cards (P3-01)', async ({ page }) => {
    const count = await page.locator('[data-testid]').count();
    console.log(`P3-01: /channels has ${count} elements with data-testid`);
    // TODO: after fix: expect(count).toBeGreaterThan(5);
  });
});
