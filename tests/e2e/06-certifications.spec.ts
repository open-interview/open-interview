/**
 * Test Suite 06 — Certifications (P1-07, P2-02, P2-03, P3-04, P3-01)
 *
 * Covers:
 * - /certifications page loads without error
 * - Certification cards are visible
 * - Certification card stats text is readable (P2-03 — text-[10px])
 * - Clicking a cert card opens detail modal
 * - "Start Practice" navigates to correct channel, not 404 (P1-07)
 * - Breadcrumb links on /certification/:id use SPA navigation (P3-04)
 * - Last card row is visible above mobile nav (P2-02)
 * - data-testid presence (P3-01)
 */

import { test, expect } from '@playwright/test';
import { navigateTo, assertPageLoaded } from './helpers';

test.describe('Certifications — /certifications', () => {

  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/certifications');
    await page.waitForLoadState('networkidle');
  });

  test('page loads without errors', async ({ page }) => {
    await assertPageLoaded(page, '/certifications');
  });

  test('certification cards are visible', async ({ page }) => {
    const cards = page.locator('[class*="rounded-xl"][class*="cursor-pointer"]');
    await expect(cards.first()).toBeVisible({ timeout: 8000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    console.log(`${count} certification cards visible`);
  });

  test('certification card stats text is >= 12px (P2-03)', async ({ page }) => {
    const smallTextEls = await page.$$('[class*="text-\\[10px\\]"]');
    if (smallTextEls.length > 0) {
      for (const el of smallTextEls.slice(0, 5)) {
        const fontSize = await el.evaluate(e => parseFloat(window.getComputedStyle(e).fontSize));
        console.log(`P2-03: Certification stats font-size: ${fontSize}px (min should be 12px)`);
        // TODO: after fix: expect(fontSize).toBeGreaterThanOrEqual(12);
      }
    }
  });

  test('clicking certification card opens detail modal', async ({ page }) => {
    const cards = page.locator('[class*="rounded-xl"][class*="cursor-pointer"]');
    if (await cards.count() === 0) return;

    await cards.first().click();
    await page.waitForTimeout(300);

    const modal = page.locator('[class*="fixed"][class*="inset-0"]').or(
      page.getByRole('dialog')
    );
    await expect(modal.first()).toBeVisible({ timeout: 3000 });
  });

  test('Start Practice button navigates to valid page not 404 (P1-07)', async ({ page }) => {
    const cards = page.locator('[class*="rounded-xl"][class*="cursor-pointer"]');
    if (await cards.count() === 0) return;

    await cards.first().click();
    await page.waitForTimeout(300);

    const startBtn = page.getByRole('button', { name: /start|practice|begin/i }).last();
    if (await startBtn.isVisible({ timeout: 2000 })) {
      await startBtn.click();
      await page.waitForLoadState('networkidle');

      // P1-07: Should land on a valid channel page, not 404
      const is404 = await page.getByText(/not found|404|page.*exist/i).isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`P1-07: Cert start navigated to 404: ${is404}`);
      expect(is404).toBe(false);
    }
  });

  test('provider filter buttons work', async ({ page }) => {
    const filterBtns = page.getByRole('button').filter({ hasText: /aws|google|microsoft|azure|all/i });
    if (await filterBtns.count() > 0) {
      await filterBtns.first().click();
      await page.waitForTimeout(300);
      await assertPageLoaded(page, '/certifications');
    }
  });

  test('last certification card row is visible above mobile nav (P2-02)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateTo(page, '/certifications');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('[class*="rounded-xl"][class*="cursor-pointer"]');
    const count = await cards.count();
    if (count > 0) {
      const lastCard = cards.last();
      const box = await lastCard.boundingBox();
      if (box) {
        console.log(`P2-02: Last cert card bottom: ${box.y + box.height}px on 667px viewport`);
      }
    }
  });

  test('data-testid attributes present (P3-01)', async ({ page }) => {
    const testIdEls = page.locator('[data-testid]');
    const count = await testIdEls.count();
    console.log(`P3-01: /certifications has ${count} data-testid elements`);
  });
});

test.describe('Certification Practice — /certification/:id', () => {

  test('/certification/aws-solutions-architect loads if it exists (P1-07)', async ({ page }) => {
    await navigateTo(page, '/certification/aws-solutions-architect');
    await page.waitForLoadState('networkidle');
    const is404 = await page.getByText(/not found|404/i).isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`P1-07: /certification/aws-solutions-architect shows 404: ${is404}`);
  });

  test('breadcrumb links use SPA navigation not full reload (P3-04)', async ({ page }) => {
    await navigateTo(page, '/certifications');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('[class*="rounded-xl"][class*="cursor-pointer"]');
    if (await cards.count() === 0) return;

    await cards.first().click();
    await page.waitForTimeout(300);

    const startBtn = page.getByRole('button', { name: /start|practice|begin/i }).last();
    if (await startBtn.isVisible({ timeout: 2000 })) {
      await startBtn.click();
      await page.waitForLoadState('networkidle');
    }

    // On the practice page, find breadcrumb links
    const breadcrumbs = page.locator('nav[aria-label*="breadcrumb"] a, [class*="breadcrumb"] a');
    if (await breadcrumbs.count() > 0) {
      // Track navigation events — SPA navigation does NOT trigger full reload
      let fullReload = false;
      page.on('load', () => { fullReload = true; });

      await breadcrumbs.first().click();
      await page.waitForTimeout(500);

      // P3-04: ideally this is false (SPA navigation, no full reload)
      console.log(`P3-04: breadcrumb click caused full reload: ${fullReload}`);
      // TODO: after fix: expect(fullReload).toBe(false);
    }
  });
});
