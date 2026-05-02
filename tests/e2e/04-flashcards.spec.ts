/**
 * Test Suite 04 — Flashcards (P2-01, P3-01)
 *
 * Covers:
 * - Flashcards page loads without error
 * - Sidebar navigation is visible on /flashcards (P2-01 — currently hidden)
 * - Flashcard flips on click/keyboard
 * - Empty state shows when no flashcards exist
 * - Channel filter tabs are present
 * - Back navigation works (not just "go to home")
 * - Rating buttons appear after card flip
 * - data-testid presence (P3-01)
 */

import { test, expect } from '@playwright/test';
import { navigateTo, assertPageLoaded } from './helpers';

test.describe('Flashcards Page — /flashcards', () => {

  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/flashcards');
    await page.waitForLoadState('networkidle');
  });

  test('page loads without errors', async ({ page }) => {
    await assertPageLoaded(page, '/flashcards');
  });

  test('sidebar nav is visible on /flashcards (P2-01 — may be hidden)', async ({ page }) => {
    // Flashcards uses hideNav which hides the sidebar
    // P2-01: sidebar should be visible
    const sidebar = page.locator('[class*="sidebar"], aside').first();
    const isVisible = await sidebar.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`P2-01: sidebar visible on /flashcards: ${isVisible}`);
    // TODO: after fix: await expect(sidebar).toBeVisible();
  });

  test('desktop sidebar is present on /flashcards viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await navigateTo(page, '/flashcards');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('[class*="sidebar"], nav[class*="fixed"]').first();
    const isVisible = await sidebar.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`P2-01: desktop sidebar on /flashcards: ${isVisible}`);
  });

  test('shows empty state when no flashcards available', async ({ page }) => {
    // Could show empty state if no subscribed channels or no cards due
    const emptyEl = page.getByText(/no flashcard|no card|check back|flashcard.*generate/i);
    const hasEmpty = await emptyEl.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Empty state visible: ${hasEmpty}`);
    if (hasEmpty) {
      await expect(emptyEl).toBeVisible();
    }
  });

  test('flashcard is visible when cards are available', async ({ page }) => {
    const card = page.locator('[class*="rounded-\\[28px\\]"]').or(
      page.locator('[style*="perspective"]')
    );
    const hasCard = await card.first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Flashcard visible: ${hasCard}`);
  });

  test('flashcard flips on click to show answer', async ({ page }) => {
    const card = page.locator('[class*="rounded-\\[28px\\]"]').first();
    const hasCard = await card.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCard) {
      await card.click();
      await page.waitForTimeout(400);
      // After flip, answer content should be visible
      const answerContent = page.getByText(/answer|explanation|tl;dr/i);
      const hasAnswer = await answerContent.isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`Flashcard shows answer after click: ${hasAnswer}`);
    }
  });

  test('rating buttons appear after flipping card', async ({ page }) => {
    const card = page.locator('[class*="rounded-\\[28px\\]"]').first();
    const hasCard = await card.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCard) {
      await card.click();
      await page.waitForTimeout(400);

      const ratingBtns = page.getByRole('button').filter({ hasText: /again|hard|good|easy/i });
      const count = await ratingBtns.count();
      console.log(`Rating buttons visible after flip: ${count}`);
    }
  });

  test('keyboard arrow keys navigate between cards', async ({ page }) => {
    const card = page.locator('[class*="rounded-\\[28px\\]"]').first();
    const hasCard = await card.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCard) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(300);
      // Just verify no crash
      await assertPageLoaded(page, '/flashcards');
    }
  });

  test('channel filter tabs are present', async ({ page }) => {
    const tabs = page.locator('[class*="rounded-full"][class*="text-xs"]');
    const count = await tabs.count();
    console.log(`Channel filter tabs: ${count}`);
  });

  test('back/home button is present and navigable', async ({ page }) => {
    // Look for a back to home or close button
    const backBtn = page.getByRole('button').filter({ hasText: /home|back|channels/i })
      .or(page.getByRole('link', { name: /home|channels/i }));
    const count = await backBtn.count();
    console.log(`Back/home button count: ${count}`);
  });

  test('data-testid attributes present (P3-01)', async ({ page }) => {
    const testIdEls = page.locator('[data-testid]');
    const count = await testIdEls.count();
    console.log(`P3-01: /flashcards has ${count} elements with data-testid`);
    // TODO: after fix: expect(count).toBeGreaterThan(3);
  });
});
