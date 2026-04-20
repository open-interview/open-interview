import { test, expect } from '@playwright/test';

/**
 * E2E Test: TLDR/Quick Answer Validation
 * 
 * Ensures that TLDR sections don't contain MCQ options
 * Tests across different question types and channels
 */

test.describe('TLDR Content Quality', () => {
  
  test('should not show MCQ options in TLDR section', async ({ page }) => {
    // Navigate to test session
    await page.goto('/test-session/aws');
    
    // Wait for questions to load
    await page.waitForSelector('[data-testid="question-card"]', { timeout: 10000 });
    
    // Get all TLDR sections
    const tldrSections = page.locator('[data-testid="tldr-section"], .tldr, [class*="tldr"]');
    const count = await tldrSections.count();
    
    console.log(`Found ${count} TLDR sections to check`);
    
    // Check each TLDR section
    for (let i = 0; i < count; i++) {
      const tldr = tldrSections.nth(i);
      const text = await tldr.textContent();
      
      if (text) {
        // Check for MCQ option patterns
        const hasMCQPattern = /\[\s*\{\s*"id"\s*:\s*"[a-z]"/i.test(text);
        const hasOptionLabels = /Option [A-D]:/i.test(text);
        const hasOptionLetters = /\([A-D]\)/.test(text);
        
        expect(hasMCQPattern, `TLDR should not contain JSON MCQ options: ${text.substring(0, 100)}`).toBe(false);
        expect(hasOptionLabels, `TLDR should not contain "Option A:" labels: ${text.substring(0, 100)}`).toBe(false);
        expect(hasOptionLetters, `TLDR should not contain "(A)" style labels: ${text.substring(0, 100)}`).toBe(false);
      }
    }
  });
  
  test('should not show MCQ options in quick answer section', async ({ page }) => {
    // Navigate to certification exam
    await page.goto('/certification-exam/aws-saa');
    
    // Wait for questions to load
    await page.waitForSelector('[data-testid="question-card"]', { timeout: 10000 });
    
    // Look for quick answer sections
    const quickAnswerSections = page.locator('[data-testid="quick-answer"], .quick-answer, [class*="quick-answer"]');
    const count = await quickAnswerSections.count();
    
    console.log(`Found ${count} quick answer sections to check`);
    
    for (let i = 0; i < count; i++) {
      const quickAnswer = quickAnswerSections.nth(i);
      const text = await quickAnswer.textContent();
      
      if (text) {
        // Check for MCQ option patterns
        const hasMCQPattern = /\[\s*\{\s*"id"\s*:\s*"[a-z]"/i.test(text);
        
        expect(hasMCQPattern, `Quick answer should not contain JSON MCQ options: ${text.substring(0, 100)}`).toBe(false);
      }
    }
  });
  
  test('should validate TLDR across multiple channels', async ({ page }) => {
    const channels = ['aws', 'system-design', 'frontend', 'backend'];
    
    for (const channel of channels) {
      console.log(`\nChecking channel: ${channel}`);
      
      await page.goto(`/test-session/${channel}`);
      await page.waitForSelector('[data-testid="question-card"]', { timeout: 10000 });
      
      // Check first question's TLDR
      const tldr = page.locator('[data-testid="tldr-section"]').first();
      
      if (await tldr.count() > 0) {
        const text = await tldr.textContent();
        
        if (text) {
          const hasMCQPattern = /\[\s*\{\s*"id"\s*:\s*"[a-z]"/i.test(text);
          expect(hasMCQPattern, `${channel}: TLDR should not contain MCQ options`).toBe(false);
        }
      }
    }
  });
  
  test('should validate answer panel does not leak options', async ({ page }) => {
    await page.goto('/test-session/aws');
    await page.waitForSelector('[data-testid="question-card"]', { timeout: 10000 });
    
    // Before revealing answer, check that options aren't visible in summary
    const summaryBeforeReveal = page.locator('[data-testid="answer-summary"], .answer-summary');
    
    if (await summaryBeforeReveal.count() > 0) {
      const text = await summaryBeforeReveal.first().textContent();
      
      if (text) {
        const hasMCQPattern = /\[\s*\{\s*"id"\s*:\s*"[a-z]"/i.test(text);
        expect(hasMCQPattern, 'Answer summary should not show MCQ options before reveal').toBe(false);
      }
    }
  });
  
  test('should check extreme mode question viewer', async ({ page }) => {
    await page.goto('/test-session/aws');
    await page.waitForSelector('[data-testid="question-card"]', { timeout: 10000 });
    
    // Check if extreme mode is available
    const extremeToggle = page.locator('[data-testid="extreme-mode-toggle"]');
    
    if (await extremeToggle.count() > 0) {
      await extremeToggle.click();
      await page.waitForTimeout(500);
      
      // Check TLDR in extreme mode
      const tldr = page.locator('[data-testid="tldr-section"]').first();
      
      if (await tldr.count() > 0) {
        const text = await tldr.textContent();
        
        if (text) {
          const hasMCQPattern = /\[\s*\{\s*"id"\s*:\s*"[a-z]"/i.test(text);
          expect(hasMCQPattern, 'Extreme mode TLDR should not contain MCQ options').toBe(false);
        }
      }
    }
  });
});

test.describe('Database Content Validation', () => {
  
  test('should verify database has no MCQ options in TLDR', async ({ request }) => {
    // This test calls an API endpoint to check database directly
    // Requires a validation endpoint to be created
    
    const response = await request.get('/api/validate/tldr-content');
    
    if (response.ok()) {
      const data = await response.json();
      
      expect(data.issuesFound, 'Database should have no TLDR issues').toBe(0);
      
      if (data.issuesFound > 0) {
        console.log('Issues found:', data.issues);
      }
    }
  });
});
