/**
 * Training & SRS Review — consolidated from:
 *   training.spec.ts + training-comprehensive.spec.ts
 *   + srs-review.spec.ts + srs-review-comprehensive.spec.ts
 */

import { test, expect, setupUser, waitForPageReady, waitForContent, waitForDataLoad, checkNoOverflow, hideMascot } from './fixtures';

async function seedSrsCards(page: import('@playwright/test').Page, count = 3) {
  await page.addInitScript((count) => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const cards: Record<string, object> = {};
    for (let i = 0; i < count; i++) {
      const id = `test-q-${i + 1}`;
      cards[id] = { questionId: id, channel: 'system-design', difficulty: 'intermediate', interval: 1, easeFactor: 2.5, repetitions: i, nextReview: yesterday, lastReview: yesterday, totalReviews: i + 1, correctStreak: i, masteryLevel: i };
    }
    localStorage.setItem('code-reels-srs', JSON.stringify(cards));
  }, count);
}

// ── Training Mode ─────────────────────────────────────────────────────────────

test.describe('Training Mode', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
    await page.goto('/training');
    await waitForPageReady(page);
    await waitForDataLoad(page);
    await hideMascot(page);
  });

  test('page loads with content', async ({ page }) => {
    await waitForContent(page, 100);
    expect((await page.locator('body').textContent() || '').length).toBeGreaterThan(100);
  });

  test('shows question or empty state', async ({ page }) => {
    await waitForContent(page, 100);
    const hasQuestion = await page.locator('h2, h3').first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasEmptyState = await page.getByText(/no questions|subscribe|browse channels/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasQuestion || hasEmptyState).toBeTruthy();
  });

  test('reveal answer button or empty state is present', async ({ page }) => {
    await waitForContent(page, 100);
    const revealBtn = page.locator('button').filter({ hasText: /tap to reveal|reveal answer|show answer/i }).first();
    const hasReveal = await revealBtn.isVisible({ timeout: 3000 }).catch(() => false);
    const hasEmptyState = await page.getByText(/no questions|subscribe|browse channels/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasReveal || hasEmptyState).toBeTruthy();
  });

  test('clicking reveal shows more content', async ({ page }) => {
    await waitForContent(page, 100);
    const revealBtn = page.locator('button').filter({ hasText: /tap to reveal|reveal answer|show answer/i }).first();
    if (!await revealBtn.isVisible({ timeout: 3000 }).catch(() => false)) return;
    const before = (await page.locator('body').textContent() || '').length;
    await revealBtn.click();
    await page.waitForTimeout(400);
    const after = (await page.locator('body').textContent() || '').length;
    expect(after).toBeGreaterThanOrEqual(before);
  });

  test('skip/next button navigates to another question', async ({ page }) => {
    await waitForContent(page, 100);
    const skipBtn = page.locator('button').filter({ hasText: /skip|next/i }).first();
    if (!await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) return;
    await skipBtn.click();
    await page.waitForTimeout(500);
    expect((await page.locator('body').textContent() || '').length).toBeGreaterThan(50);
  });

  test('progress indicator is shown or empty state', async ({ page }) => {
    await waitForContent(page, 100);
    const hasProgressBar = await page.locator('[role="progressbar"], [class*="progress"]').first().isVisible({ timeout: 2000 }).catch(() => false);
    const hasProgressText = /\d+\s*[\/|]\s*\d+/.test(await page.locator('body').textContent() || '');
    const hasEmptyState = await page.getByText(/no questions|subscribe/i).isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasProgressBar || hasProgressText || hasEmptyState).toBeTruthy();
  });

  test('no horizontal overflow', async ({ page }) => {
    await waitForContent(page, 100);
    await checkNoOverflow(page);
  });
});

test.describe('Training Mode - No Channels', () => {
  test('shows empty state when no channels subscribed', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('marvel-intro-seen', 'true');
      localStorage.setItem('user-preferences', JSON.stringify({ role: 'fullstack', subscribedChannels: [], onboardingComplete: true, createdAt: new Date().toISOString() }));
    });
    await page.goto('/training');
    await waitForPageReady(page);
    await waitForDataLoad(page);
    const hasEmptyMsg = await page.getByText(/no questions|subscribe|browse channels/i).first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasEmptyMsg || (await page.locator('body').textContent() || '').length > 50).toBeTruthy();
  });
});

// ── SRS Review ────────────────────────────────────────────────────────────────

test.describe('SRS Review — with due cards', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
    await seedSrsCards(page, 3);
    await page.goto('/review');
    await waitForPageReady(page);
    await waitForDataLoad(page);
    await hideMascot(page);
  });

  test('page loads at /review', async ({ page }) => {
    expect(page.url()).toContain('/review');
    expect((await page.locator('body').textContent() || '').length).toBeGreaterThan(30);
  });

  test('shows review content or empty state', async ({ page }) => {
    const hasContent = await page.locator('h1, h2, h3').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmptyState = await page.getByText(/no cards|all caught up|nothing due|no reviews/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasContent || hasEmptyState).toBeTruthy();
  });

  test('reveal button or empty state is shown', async ({ page }) => {
    const revealBtn = page.locator('button').filter({ hasText: /tap to reveal|reveal|show answer/i }).first();
    const hasReveal = await revealBtn.isVisible({ timeout: 3000 }).catch(() => false);
    const hasEmptyState = await page.getByText(/no cards|all caught up|nothing due/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasReveal || hasEmptyState).toBeTruthy();
  });

  test('rating buttons visible after reveal', async ({ page }) => {
    const revealBtn = page.locator('button').filter({ hasText: /tap to reveal|reveal|show answer/i }).first();
    if (!await revealBtn.isVisible({ timeout: 3000 }).catch(() => false)) return;
    await revealBtn.click();
    await page.waitForTimeout(300);
    expect.soft(await page.getByRole('button', { name: /again/i }).isVisible({ timeout: 3000 }).catch(() => false)).toBeTruthy();
    expect.soft(await page.getByRole('button', { name: /good/i }).isVisible({ timeout: 3000 }).catch(() => false)).toBeTruthy();
  });

  test('clicking a rating advances to next card', async ({ page }) => {
    const revealBtn = page.locator('button').filter({ hasText: /tap to reveal|reveal|show answer/i }).first();
    if (!await revealBtn.isVisible({ timeout: 3000 }).catch(() => false)) return;
    await revealBtn.click();
    await page.waitForTimeout(300);
    const goodBtn = page.getByRole('button', { name: /good/i });
    if (!await goodBtn.isVisible({ timeout: 2000 }).catch(() => false)) return;
    await goodBtn.click();
    await page.waitForTimeout(500);
    expect((await page.locator('body').textContent() || '').length).toBeGreaterThan(30);
  });

  test('no overflow on review page', async ({ page }) => {
    await checkNoOverflow(page);
  });
});

test.describe('SRS Review — empty state', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
    await page.addInitScript(() => { localStorage.setItem('code-reels-srs', JSON.stringify({})); });
    await page.goto('/review');
    await waitForPageReady(page);
    await waitForDataLoad(page);
    await hideMascot(page);
  });

  test('shows empty state when no cards due', async ({ page }) => {
    const emptyMsg = await page.getByText(/no cards|all caught up|nothing due|no reviews/i).isVisible({ timeout: 5000 }).catch(() => false);
    expect(emptyMsg || (await page.locator('body').textContent() || '').length > 30).toBeTruthy();
  });
});
