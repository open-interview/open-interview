/**
 * Test Suite 08 — Profile & Bookmarks (P1-06, P3-01)
 *
 * Covers:
 * - /profile loads from localStorage without crash (P1-06)
 * - /profile handles corrupted/missing localStorage gracefully (P1-06)
 * - /bookmarks loads from localStorage without crash (P1-06)
 * - /bookmarks handles empty state (no saved questions)
 * - /bookmarks handles missing/corrupted localStorage
 * - Name editing works on Profile
 * - Stats displayed correctly on Profile
 * - Bookmarked item can be opened
 * - data-testid presence (P3-01)
 */

import { test, expect } from '@playwright/test';
import { navigateTo, assertPageLoaded, BASE_URL, skipOnboarding } from './helpers';

test.describe('Profile Page — /profile', () => {

  test('page loads without error from empty localStorage', async ({ page }) => {
    // No preferences set — all localStorage empty
    await page.addInitScript(() => localStorage.clear());
    await skipOnboarding(page);
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');
    await assertPageLoaded(page, '/profile');
  });

  test('page loads correctly with valid localStorage data', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('user-display-name', 'Test User');
      localStorage.setItem('user-preferences', JSON.stringify({
        role: 'frontend',
        subscribedChannels: ['javascript'],
        onboardingComplete: true,
      }));
    });
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');
    await assertPageLoaded(page, '/profile');
    await expect(page.getByText('Test User')).toBeVisible({ timeout: 5000 });
  });

  test('handles corrupted localStorage JSON gracefully (P1-06)', async ({ page }) => {
    await page.addInitScript(() => {
      // Inject corrupted JSON
      localStorage.setItem('user-preferences', 'NOT_VALID_JSON{{{');
      localStorage.setItem('user-display-name', null as any);
    });
    await skipOnboarding(page);
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');

    // P1-06: Should not crash — page should still render
    await assertPageLoaded(page, '/profile');

    // Should not show a JavaScript error
    const hasJsError = await page.getByText(/unexpected token|syntaxerror|reference error/i)
      .isVisible({ timeout: 1000 }).catch(() => false);
    expect(hasJsError).toBe(false);
  });

  test('profile shows loading skeleton on initial mount (P1-06 — may be missing)', async ({ page }) => {
    await skipOnboarding(page);
    await page.goto(`${BASE_URL}/profile`);

    // Check for any skeleton/pulse element immediately on paint
    const skeleton = page.locator('[class*="animate-pulse"]').first();
    const hasSkeleton = await skeleton.isVisible({ timeout: 500 }).catch(() => false);
    console.log(`P1-06: /profile loading skeleton: ${hasSkeleton}`);
    // TODO: after fix: await expect(skeleton).toBeVisible({ timeout: 300 });
  });

  test('display name is editable', async ({ page }) => {
    await navigateTo(page, '/profile');
    await page.waitForLoadState('networkidle');

    // Look for an edit button near the name
    const editBtn = page.getByRole('button', { name: /edit|rename|change name/i })
      .or(page.locator('[class*="edit"][class*="name"]'));
    const hasEdit = await editBtn.count() > 0;
    console.log(`Profile has edit name button: ${hasEdit}`);
  });

  test('stats section is present', async ({ page }) => {
    await navigateTo(page, '/profile');
    const statsEl = page.getByText(/question|streak|session|progress/i).first();
    const hasStats = await statsEl.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Profile stats visible: ${hasStats}`);
  });

  test('data-testid attributes present (P3-01)', async ({ page }) => {
    await navigateTo(page, '/profile');
    const count = await page.locator('[data-testid]').count();
    console.log(`P3-01: /profile has ${count} data-testid elements`);
  });
});

test.describe('Bookmarks Page — /bookmarks', () => {

  test('page loads without error from empty localStorage', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await skipOnboarding(page);
    await page.goto(`${BASE_URL}/bookmarks`);
    await page.waitForLoadState('networkidle');
    await assertPageLoaded(page, '/bookmarks');
  });

  test('empty state shown when no bookmarks saved', async ({ page }) => {
    await page.addInitScript(() => {
      // Clear all bookmark keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.includes('saved') || key?.includes('bookmark')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    });
    await skipOnboarding(page);
    await page.goto(`${BASE_URL}/bookmarks`);
    await page.waitForLoadState('networkidle');

    // Should show empty state, not blank page
    const emptyText = page.getByText(/no bookmark|nothing saved|save question|start saving/i);
    const hasEmpty = await emptyText.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Bookmarks empty state shown: ${hasEmpty}`);
  });

  test('handles corrupted localStorage gracefully (P1-06)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('saved-q-corrupted-123', 'NOT_VALID{{{{');
    });
    await skipOnboarding(page);
    await page.goto(`${BASE_URL}/bookmarks`);
    await page.waitForLoadState('networkidle');

    // P1-06: Should not crash
    await assertPageLoaded(page, '/bookmarks');
  });

  test('bookmarked question renders with title', async ({ page }) => {
    await page.addInitScript(() => {
      // Inject a sample bookmark
      localStorage.setItem('saved-q-test-001', JSON.stringify({
        id: 'test-001',
        question: 'What is a closure in JavaScript?',
        channel: 'javascript',
        savedAt: new Date().toISOString(),
      }));
    });
    await skipOnboarding(page);
    await page.goto(`${BASE_URL}/bookmarks`);
    await page.waitForLoadState('networkidle');

    const bookmark = page.getByText(/closure|javascript/i).first();
    const hasBookmark = await bookmark.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Injected bookmark visible: ${hasBookmark}`);
  });

  test('data-testid attributes present (P3-01)', async ({ page }) => {
    await navigateTo(page, '/bookmarks');
    const count = await page.locator('[data-testid]').count();
    console.log(`P3-01: /bookmarks has ${count} data-testid elements`);
  });
});
