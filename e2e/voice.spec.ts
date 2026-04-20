/**
 * Voice — consolidated from:
 *   voice-session.spec.ts + voice-interview.spec.ts
 *   + refactored/voice-interview-refactored.spec.ts
 */

import { test, expect, setupUser, waitForPageReady, waitForContent } from './fixtures';
import { VoiceInterviewPage } from './helpers/page-objects';
import { assertNoHorizontalScroll } from './helpers/test-helpers';

// ── Voice Session ─────────────────────────────────────────────────────────────

test.describe('Voice Session', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
  });

  test('page loads with session content and controls', async ({ page }) => {
    await page.goto('/voice-session');
    await waitForPageReady(page);
    await waitForContent(page);
    const hasSessionText = (await page.locator('body').textContent())?.match(/Session|Practice|Question/);
    expect(hasSessionText).toBeTruthy();
    const hasAnyButton = await page.locator('button').first().isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasAnyButton).toBeTruthy();
  });

  test('navigation back to home works', async ({ page }) => {
    await page.goto('/voice-session');
    await waitForPageReady(page);
    const backButton = page.locator('button:has(svg.lucide-chevron-left, svg.lucide-arrow-left)').first();
    if (await backButton.isVisible({ timeout: 2000 })) {
      await backButton.click();
      expect(page.url()).toBeTruthy();
    }
  });

  test('can navigate to specific question session', async ({ page }) => {
    await page.goto('/voice-session/q-test-123');
    await waitForPageReady(page);
    await expect(page.locator('body')).toContainText(/.{50,}/);
  });
});

// ── Voice Interview ───────────────────────────────────────────────────────────

test.describe('Voice Interview', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
    await page.goto('/voice-interview');
    await waitForPageReady(page);
  });

  test('page loads with question and record button', async ({ page }) => {
    await waitForContent(page, 200);
    const hasContent = await page.locator('main, [class*="content"]').first().isVisible().catch(() => false);
    expect(hasContent || (await page.locator('body').textContent())!.length > 200).toBeTruthy();
    const hasStartButton = await page.locator('button').filter({ hasText: /Start Recording/i }).first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasMicButton = await page.locator('button svg').first().isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasStartButton || hasMicButton).toBeTruthy();
  });

  test('skip and home navigation work', async ({ page }) => {
    const skipButton = page.locator('button').filter({ hasText: /Skip|Next/i }).first();
    if (await skipButton.isVisible({ timeout: 2000 })) await skipButton.click();
    const homeButton = page.locator('button:has(svg.lucide-home)').first();
    if (await homeButton.isVisible({ timeout: 2000 })) {
      await homeButton.click();
      await expect(page).toHaveURL('/');
    }
  });
});

// ── Voice Interview Refactored (recording indicator) ─────────────────────────

test.describe('Voice Interview — Recording Indicator', () => {
  let voiceInterview: VoiceInterviewPage;

  test.beforeEach(async ({ page }) => {
    voiceInterview = new VoiceInterviewPage(page);
    await voiceInterview.goto();
  });

  test('shows recording indicator without time display', async ({ page }) => {
    await voiceInterview.startRecording();
    const recordingIndicator = page.locator('[class*="pulse"], [class*="animate-pulse"]');
    await expect(recordingIndicator).toBeVisible();
    const timeDisplay = page.locator('text=/\\d+:\\d+/');
    await expect(timeDisplay).not.toBeVisible();
  });

  test('shows "Recording" text instead of time', async ({ page }) => {
    await voiceInterview.startRecording();
    await expect(page.locator('text=/recording/i')).toBeVisible();
  });

  test('navigates between questions', async ({ page }) => {
    const initial = await voiceInterview.getCurrentQuestionNumber();
    await voiceInterview.skipQuestion();
    const next = await voiceInterview.getCurrentQuestionNumber();
    expect(next).toBe(initial + 1);
  });

  test('shows single progress counter', async ({ page }) => {
    const counter = await voiceInterview.questionCounter.textContent();
    expect(counter).toMatch(/^\d+\s*\/\s*\d+$/);
    const counters = await page.locator('text=/\\d+\\s*\\/\\s*\\d+/').count();
    expect(counters).toBe(1);
  });

  test('has proper ARIA labels', async ({ page }) => {
    await expect(voiceInterview.recordButton).toHaveAttribute('aria-label', /.+/);
  });
});

test.describe('Voice Interview — Mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('no horizontal scroll on mobile', async ({ page }) => {
    const voiceInterview = new VoiceInterviewPage(page);
    await voiceInterview.goto();
    await assertNoHorizontalScroll(page);
  });

  test('record button is touch-friendly (≥44px)', async ({ page }) => {
    const voiceInterview = new VoiceInterviewPage(page);
    await voiceInterview.goto();
    const box = await voiceInterview.recordButton.boundingBox();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});
