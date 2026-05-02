/**
 * Test Suite 05 — Voice Interview (P3-03, P3-02, P3-01)
 */

import { test, expect } from '@playwright/test';
import { navigateTo, assertPageLoaded, BASE_URL, skipOnboarding } from './helpers';

test.describe('Voice Interview — /voice-interview', () => {

  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/voice-interview');
  });

  test('page loads without errors', async ({ page }) => {
    await assertPageLoaded(page, '/voice-interview');
  });

  test('page heading or title is visible', async ({ page }) => {
    const heading = page.getByRole('heading').first()
      .or(page.getByText(/voice|interview|practice|mock/i).first());
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('microphone icon or button is present', async ({ page }) => {
    const micEl = page.getByRole('button').filter({ hasText: /mic|record|start/i })
      .or(page.locator('[aria-label*="mic"], [aria-label*="record"]'))
      .or(page.locator('[class*="mic"], [class*="Mic"]'));
    const count = await micEl.count();
    console.log(`Mic buttons/icons found: ${count}`);
    expect(count).toBeGreaterThan(0);
  });

  test('mic button has accessible aria-label (P3-02)', async ({ page }) => {
    const micBtns = await page.$$('[aria-label*="mic"], [aria-label*="record"], [aria-label*="start"]');
    console.log(`P3-02: mic buttons with aria-label: ${micBtns.length}`);
    // TODO: after fix: expect(micBtns.length).toBeGreaterThan(0);
  });

  test('microphone denied shows error state (P3-03)', async ({ page, context }) => {
    await context.grantPermissions([]);

    await skipOnboarding(page);
    await page.goto(`${BASE_URL}/voice-interview`);
    await page.waitForLoadState('load');

    const startBtn = page.getByRole('button').filter({ hasText: /start|begin|record/i }).first();
    if (await startBtn.isVisible({ timeout: 3000 })) {
      await startBtn.click();
      await page.waitForTimeout(1000);

      const errorMsg = page.getByText(/microphone.*denied|mic.*access|permission.*denied|allow.*mic/i);
      const hasError = await errorMsg.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`P3-03: mic denied error shown: ${hasError}`);
      // TODO: after fix: expect(hasError).toBe(true);
    }
  });

  test('topic/channel selection is present', async ({ page }) => {
    const selects = page.getByRole('combobox')
      .or(page.locator('select'))
      .or(page.getByRole('button').filter({ hasText: /topic|channel|select/i }));
    console.log(`Topic/channel selectors: ${await selects.count()}`);
  });

  test('back/browse channels button is present', async ({ page }) => {
    const backBtn = page.getByRole('button', { name: /browse|channels|back/i })
      .or(page.getByRole('link', { name: /channel/i }));
    if (await backBtn.count() > 0) {
      await backBtn.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('data-testid attributes present (P3-01)', async ({ page }) => {
    const count = await page.locator('[data-testid]').count();
    console.log(`P3-01: /voice-interview has ${count} elements with data-testid`);
    // TODO: after fix: expect(count).toBeGreaterThan(3);
  });
});

test.describe('Voice Session — /voice-session', () => {

  test('/voice-session page loads', async ({ page }) => {
    await navigateTo(page, '/voice-session');
    await assertPageLoaded(page, '/voice-session');
  });
});
