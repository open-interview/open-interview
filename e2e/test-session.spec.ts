/**
 * Test Session — consolidated from:
 *   unified/test-session.spec.ts + refactored/test-session-refactored.spec.ts
 */

import { test, expect } from '@playwright/test';
import { TestSessionPage } from './helpers/page-objects';
import { assertQuestionVisible, assertNoHorizontalScroll, waitForAnimation } from './helpers/test-helpers';

test.describe('Test Session — Core', () => {
  let testSession: TestSessionPage;

  test.beforeEach(async ({ page }) => {
    testSession = new TestSessionPage(page);
    await testSession.goto('react');
  });

  test('starts test session with timer and counter', async ({ page }) => {
    await assertQuestionVisible(page);
    await expect(testSession.timer).toBeVisible();
    await expect(testSession.questionCounter).toBeVisible();
  });

  test('timer counts down', async ({ page }) => {
    const t1 = await testSession.getTimeRemaining();
    expect(t1).toMatch(/\d+:\d+/);
    await page.waitForTimeout(2000);
    const t2 = await testSession.getTimeRemaining();
    expect(t2).not.toBe(t1);
  });

  test('tracks progress through questions', async ({ page }) => {
    const total = await testSession.getTotalQuestions();
    expect(total).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(3, total); i++) {
      expect(await testSession.getCurrentQuestionNumber()).toBe(i + 1);
      await testSession.revealAnswer();
      await waitForAnimation(page, 500);
      if (i < total - 1) await testSession.clickNext();
    }
  });

  test('completes test and shows results with valid score', async ({ page }) => {
    await testSession.completeTest();
    await expect(testSession.resultsSection).toBeVisible({ timeout: 10000 });
    await expect(testSession.scoreDisplay).toBeVisible();
    const score = await testSession.getScore();
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('shows pass/fail and correct/incorrect breakdown', async ({ page }) => {
    await testSession.completeTest();
    await expect(page.locator('text=/pass|fail/i')).toBeVisible();
    await expect(page.locator('text=/correct|incorrect/i')).toBeVisible();
  });

  test('allows retry after completion', async ({ page }) => {
    await testSession.completeTest();
    await page.getByRole('button', { name: /retry|try again/i }).click();
    await assertQuestionVisible(page);
    expect(await testSession.getCurrentQuestionNumber()).toBe(1);
  });
});

test.describe('Test Session — Mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('works on mobile with no horizontal scroll', async ({ page }) => {
    const testSession = new TestSessionPage(page);
    await testSession.goto('react');
    await assertNoHorizontalScroll(page);
    await assertQuestionVisible(page);
    await expect(testSession.timer).toBeVisible();
  });
});

test.describe('Test Session — Edge Cases', () => {
  test('shows empty state for invalid channel', async ({ page }) => {
    await page.goto('/test/invalid-channel');
    await expect(page.locator('text=/no questions|empty/i')).toBeVisible({ timeout: 5000 });
  });
});
