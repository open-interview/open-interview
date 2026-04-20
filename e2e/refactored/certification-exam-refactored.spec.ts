/**
 * E2E Tests: Certification Exam (Refactored - No Timer)
 * Tests certification exam without timer functionality
 */

import { test, expect } from '@playwright/test';
import { CertificationPage } from '../helpers/page-objects';
import {
  assertQuestionVisible,
  assertNoHorizontalScroll,
  waitForAnimation,
} from '../helpers/test-helpers';

test.describe('Certification Exam - Core Functionality (Refactored)', () => {
  let certPage: CertificationPage;

  test.beforeEach(async ({ page }) => {
    certPage = new CertificationPage(page);
    await certPage.goto('aws-solutions-architect');
  });

  test('should start exam without timer', async ({ page }) => {
    await certPage.startExam();
    
    await assertQuestionVisible(page);
    
    // Timer should NOT be visible
    const timer = page.locator('text=/\\d+:\\d+/');
    await expect(timer).not.toBeVisible();
  });

  test('should show single progress counter', async ({ page }) => {
    await certPage.startExam();
    
    const counter = await certPage.questionCounter.textContent();
    expect(counter).toMatch(/^\d+\s*\/\s*\d+$/);
    
    // Only one counter
    const counters = await page.locator('text=/\\d+\\s*\\/\\s*\\d+/').count();
    expect(counters).toBe(1);
  });

  test('should navigate between questions', async ({ page }) => {
    await certPage.startExam();
    
    const initial = await certPage.getCurrentQuestionNumber();
    
    await certPage.clickNext();
    
    const next = await certPage.getCurrentQuestionNumber();
    expect(next).toBe(initial + 1);
  });

  test('should flag questions', async ({ page }) => {
    await certPage.startExam();
    
    await certPage.flagQuestion();
    
    // Flag button should be active
    await expect(certPage.flagButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should complete exam and show results', async ({ page }) => {
    await certPage.startExam();
    
    // Answer all questions
    const total = await certPage.getTotalQuestions();
    for (let i = 0; i < total; i++) {
      // Select an option
      const option = page.locator('button[role="radio"]').first();
      await option.click();
      
      if (i < total - 1) {
        await certPage.clickNext();
      }
    }
    
    // Finish exam
    const finishButton = page.getByRole('button', { name: /finish/i });
    await finishButton.click();
    
    // Should show results
    const results = page.locator('text=/results|score/i');
    await expect(results).toBeVisible({ timeout: 10000 });
  });

  test('should not show pause/play buttons', async ({ page }) => {
    await certPage.startExam();
    
    // Pause and play buttons should NOT exist
    const pauseButton = page.getByRole('button', { name: /pause/i });
    const playButton = page.getByRole('button', { name: /play|resume/i });
    
    await expect(pauseButton).not.toBeVisible();
    await expect(playButton).not.toBeVisible();
  });
});

test.describe('Certification Exam - Mobile Experience', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  let certPage: CertificationPage;

  test.beforeEach(async ({ page }) => {
    certPage = new CertificationPage(page);
    await certPage.goto('aws-solutions-architect');
  });

  test('should have no horizontal scroll', async ({ page }) => {
    await certPage.startExam();
    await assertNoHorizontalScroll(page);
  });

  test('should have touch-friendly option buttons', async ({ page }) => {
    await certPage.startExam();
    
    const options = await page.locator('button[role="radio"]').all();
    
    for (const option of options.slice(0, 3)) {
      const box = await option.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should not have content cutoff', async ({ page }) => {
    await certPage.startExam();
    
    const questionText = page.locator('h2').first();
    const box = await questionText.boundingBox();
    const viewport = page.viewportSize()!;
    
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    }
  });
});

test.describe('Certification Exam - Results', () => {
  let certPage: CertificationPage;

  test.beforeEach(async ({ page }) => {
    certPage = new CertificationPage(page);
    await certPage.goto('aws-solutions-architect');
  });

  test('should show score without time stats', async ({ page }) => {
    await certPage.startExam();
    
    // Complete exam quickly
    const total = await certPage.getTotalQuestions();
    for (let i = 0; i < Math.min(5, total); i++) {
      const option = page.locator('button[role="radio"]').first();
      await option.click();
      
      if (i < total - 1) {
        await certPage.clickNext();
      }
    }
    
    const finishButton = page.getByRole('button', { name: /finish/i });
    await finishButton.click();
    
    // Should show score
    const score = page.locator('text=/\\d+%/');
    await expect(score).toBeVisible({ timeout: 10000 });
    
    // Should NOT show time stats
    const timeStats = page.locator('text=/time|duration|minutes/i');
    await expect(timeStats).not.toBeVisible();
  });

  test('should show domain breakdown', async ({ page }) => {
    await certPage.startExam();
    
    // Complete exam
    const total = await certPage.getTotalQuestions();
    for (let i = 0; i < Math.min(5, total); i++) {
      const option = page.locator('button[role="radio"]').first();
      await option.click();
      
      if (i < total - 1) {
        await certPage.clickNext();
      }
    }
    
    const finishButton = page.getByRole('button', { name: /finish/i });
    await finishButton.click();
    
    // Should show domain breakdown
    await expect(certPage.domainTracker).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Certification Exam - Visual Regression', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('should match visual snapshot - exam question', async ({ page }) => {
    const certPage = new CertificationPage(page);
    await certPage.goto('aws-solutions-architect');
    await certPage.startExam();
    
    await expect(page).toHaveScreenshot('cert-exam-question.png', {
      maxDiffPixels: 100,
    });
  });

  test('should match visual snapshot - results', async ({ page }) => {
    const certPage = new CertificationPage(page);
    await certPage.goto('aws-solutions-architect');
    await certPage.startExam();
    
    // Quick completion
    const total = await certPage.getTotalQuestions();
    for (let i = 0; i < Math.min(3, total); i++) {
      const option = page.locator('button[role="radio"]').first();
      await option.click();
      
      if (i < total - 1) {
        await certPage.clickNext();
      }
    }
    
    const finishButton = page.getByRole('button', { name: /finish/i });
    await finishButton.click();
    
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('cert-exam-results.png', {
      maxDiffPixels: 100,
    });
  });
});
