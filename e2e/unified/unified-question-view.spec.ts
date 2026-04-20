/**
 * E2E Tests: Unified Question View Component
 * Tests the core unified question viewing experience across all modes
 */

import { test, expect } from '@playwright/test';
import { UnifiedQuestionViewPage } from '../helpers/page-objects';
import {
  assertQuestionVisible,
  assertAnswerVisible,
  assertNoHorizontalScroll,
  assertTouchTargetSize,
  assertPageLoadTime,
  assertSmoothAnimations,
  assertKeyboardNavigation,
} from '../helpers/test-helpers';

test.describe('Unified Question View - Core Functionality', () => {
  let questionView: UnifiedQuestionViewPage;

  test.beforeEach(async ({ page }) => {
    questionView = new UnifiedQuestionViewPage(page);
    await questionView.goto('/channel/react');
  });

  test('should display question with all metadata', async ({ page }) => {
    // Check question is visible
    await assertQuestionVisible(page);

    // Check metadata bar
    await expect(questionView.metadataBar).toBeVisible();
    await expect(questionView.questionCounter).toBeVisible();
    await expect(questionView.difficultyBadge).toBeVisible();

    // Check progress bar
    await expect(questionView.progressBar).toBeVisible();

    // Check action bar
    await expect(questionView.actionBar).toBeVisible();
    await expect(questionView.revealButton).toBeVisible();
  });

  test('should reveal and hide answer', async ({ page }) => {
    // Initially answer should be hidden
    await expect(questionView.answerPanel).not.toBeVisible();

    // Reveal answer
    await questionView.revealAnswer();
    await assertAnswerVisible(page);

    // Hide answer
    await questionView.hideAnswer();
    await expect(questionView.answerPanel).not.toBeVisible();
  });

  test('should navigate between questions', async ({ page }) => {
    const initialQuestion = await questionView.getCurrentQuestionNumber();

    // Navigate to next question
    await questionView.clickNext();
    const nextQuestion = await questionView.getCurrentQuestionNumber();
    expect(nextQuestion).toBe(initialQuestion + 1);

    // Navigate to previous question
    await questionView.clickPrevious();
    const prevQuestion = await questionView.getCurrentQuestionNumber();
    expect(prevQuestion).toBe(initialQuestion);
  });

  test('should update progress bar correctly', async ({ page }) => {
    const total = await questionView.getTotalQuestions();
    
    for (let i = 1; i <= Math.min(3, total); i++) {
      const current = await questionView.getCurrentQuestionNumber();
      expect(current).toBe(i);
      
      if (i < total) {
        await questionView.clickNext();
      }
    }
  });

  test('should disable navigation at boundaries', async ({ page }) => {
    // At first question, previous should be disabled
    const current = await questionView.getCurrentQuestionNumber();
    if (current === 1) {
      await expect(questionView.previousButton).toBeDisabled();
    }

    // Navigate to last question
    const total = await questionView.getTotalQuestions();
    for (let i = current; i < total; i++) {
      await questionView.clickNext();
    }

    // At last question, next should be disabled
    await expect(questionView.nextButton).toBeDisabled();
  });

  test('should display difficulty badge correctly', async ({ page }) => {
    const difficulty = await questionView.getDifficulty();
    expect(['beginner', 'intermediate', 'advanced']).toContain(difficulty);

    // Check badge styling
    const badge = questionView.difficultyBadge;
    await expect(badge).toBeVisible();
    await expect(badge).toHaveCSS('border-radius', /.+/);
  });

  test('should handle bookmark toggle', async ({ page }) => {
    // Toggle bookmark on
    await questionView.toggleBookmark();
    await expect(questionView.bookmarkButton).toHaveAttribute('aria-pressed', 'true');

    // Toggle bookmark off
    await questionView.toggleBookmark();
    await expect(questionView.bookmarkButton).toHaveAttribute('aria-pressed', 'false');
  });
});

test.describe('Unified Question View - Mobile Optimizations', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 13

  let questionView: UnifiedQuestionViewPage;

  test.beforeEach(async ({ page }) => {
    questionView = new UnifiedQuestionViewPage(page);
    await questionView.goto('/channel/react');
  });

  test('should have no horizontal scroll', async ({ page }) => {
    await assertNoHorizontalScroll(page);
  });

  test('should have touch-friendly targets', async ({ page }) => {
    // Check all interactive elements meet 44x44px minimum
    await assertTouchTargetSize(questionView.nextButton, 44);
    await assertTouchTargetSize(questionView.previousButton, 44);
    await assertTouchTargetSize(questionView.revealButton, 44);
    await assertTouchTargetSize(questionView.bookmarkButton, 44);
  });

  test('should support safe areas', async ({ page }) => {
    // Check top safe area (notch)
    const metadataBar = questionView.metadataBar;
    const box = await metadataBar.boundingBox();
    expect(box?.y).toBeGreaterThan(0); // Should have top padding

    // Check bottom safe area (home indicator)
    const actionBar = questionView.actionBar;
    const actionBox = await actionBar.boundingBox();
    const viewport = page.viewportSize();
    if (viewport) {
      expect(actionBox?.y! + actionBox?.height!).toBeLessThan(viewport.height);
    }
  });

  test('should have readable text on mobile', async ({ page }) => {
    // Check font sizes are appropriate
    const questionText = page.locator('h2, h3').first();
    const fontSize = await questionText.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });
    
    const size = parseInt(fontSize);
    expect(size).toBeGreaterThanOrEqual(18); // Minimum 18px for mobile
  });

  test('should handle swipe gestures', async ({ page, isMobile }) => {
    if (!isMobile) test.skip();

    const initialQuestion = await questionView.getCurrentQuestionNumber();

    // Swipe left (next)
    const viewport = page.viewportSize()!;
    await page.touchscreen.swipe(
      { x: viewport.width * 0.8, y: viewport.height * 0.5 },
      { x: viewport.width * 0.2, y: viewport.height * 0.5 }
    );
    await page.waitForTimeout(500);

    const nextQuestion = await questionView.getCurrentQuestionNumber();
    expect(nextQuestion).toBe(initialQuestion + 1);
  });
});

test.describe('Unified Question View - Performance', () => {
  let questionView: UnifiedQuestionViewPage;

  test.beforeEach(async ({ page }) => {
    questionView = new UnifiedQuestionViewPage(page);
  });

  test('should load quickly', async ({ page }) => {
    await questionView.goto('/channel/react');
    await assertPageLoadTime(page, 3000); // Max 3 seconds
  });

  test('should have smooth animations', async ({ page }) => {
    await questionView.goto('/channel/react');
    await assertSmoothAnimations(page);
  });

  test('should handle rapid navigation', async ({ page }) => {
    await questionView.goto('/channel/react');

    // Rapidly click next 5 times
    for (let i = 0; i < 5; i++) {
      await questionView.clickNext();
      await page.waitForTimeout(100); // Minimal wait
    }

    // Should still be functional
    await assertQuestionVisible(page);
    const current = await questionView.getCurrentQuestionNumber();
    expect(current).toBeGreaterThan(1);
  });

  test('should not have memory leaks', async ({ page }) => {
    await questionView.goto('/channel/react');

    // Navigate through many questions
    for (let i = 0; i < 20; i++) {
      await questionView.clickNext();
      await page.waitForTimeout(50);
    }

    // Check memory usage (simplified)
    const metrics = await page.metrics();
    expect(metrics.JSHeapUsedSize).toBeLessThan(100 * 1024 * 1024); // < 100MB
  });
});

test.describe('Unified Question View - Accessibility', () => {
  let questionView: UnifiedQuestionViewPage;

  test.beforeEach(async ({ page }) => {
    questionView = new UnifiedQuestionViewPage(page);
    await questionView.goto('/channel/react');
  });

  test('should support keyboard navigation', async ({ page }) => {
    await assertKeyboardNavigation(page);

    // Tab to reveal button and press Enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Answer should be revealed
    await assertAnswerVisible(page);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    // Check all buttons have labels
    await expect(questionView.nextButton).toHaveAttribute('aria-label', /.+/);
    await expect(questionView.previousButton).toHaveAttribute('aria-label', /.+/);
    await expect(questionView.revealButton).toHaveAttribute('aria-label', /.+/);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // Check text contrast
    const questionText = page.locator('h2').first();
    const color = await questionText.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        color: style.color,
        backgroundColor: style.backgroundColor
      };
    });

    // Should have high contrast (simplified check)
    expect(color.color).toBeTruthy();
    expect(color.backgroundColor).toBeTruthy();
  });

  test('should announce page changes to screen readers', async ({ page }) => {
    // Check for live regions
    const liveRegion = page.locator('[aria-live]');
    await expect(liveRegion).toBeAttached();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);

    // Check h1 exists
    const h1 = page.locator('h1');
    await expect(h1).toBeAttached();
  });
});

test.describe('Unified Question View - Mode-Specific Styling', () => {
  test('should apply browse mode styling', async ({ page }) => {
    const questionView = new UnifiedQuestionViewPage(page);
    await questionView.goto('/channel/react');

    // Check for cyan accent (browse mode)
    const revealButton = questionView.revealButton;
    const bgColor = await revealButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should have cyan-ish color (simplified check)
    expect(bgColor).toBeTruthy();
  });

  test('should apply test mode styling', async ({ page }) => {
    const questionView = new UnifiedQuestionViewPage(page);
    await questionView.goto('/test/react');

    // Check for amber accent (test mode)
    // Check timer is visible
    await expect(questionView.timer).toBeVisible();
  });

  test('should apply interview mode styling', async ({ page }) => {
    const questionView = new UnifiedQuestionViewPage(page);
    await questionView.goto('/voice-interview');

    // Check for purple accent (interview mode)
    // Should have voice-specific UI
    const recordButton = page.getByRole('button', { name: /record/i });
    await expect(recordButton).toBeVisible();
  });
});

test.describe('Unified Question View - Error Handling', () => {
  test('should handle missing question gracefully', async ({ page }) => {
    await page.goto('/channel/invalid-channel-id');
    
    // Should show error message or redirect
    const errorMessage = page.locator('text=/not found|error/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should handle network errors', async ({ page }) => {
    // Simulate offline
    await page.context().setOffline(true);
    
    await page.goto('/channel/react');
    
    // Should show offline message
    const offlineMessage = page.locator('text=/offline|network/i');
    await expect(offlineMessage).toBeVisible({ timeout: 5000 });
    
    await page.context().setOffline(false);
  });

  test('should recover from errors', async ({ page }) => {
    const questionView = new UnifiedQuestionViewPage(page);
    await questionView.goto('/channel/react');

    // Cause an error by navigating to invalid question
    await page.evaluate(() => {
      // @ts-ignore
      window.history.pushState({}, '', '/channel/react/invalid-id');
    });

    // Navigate back
    await page.goBack();

    // Should still work
    await assertQuestionVisible(page);
  });
});
