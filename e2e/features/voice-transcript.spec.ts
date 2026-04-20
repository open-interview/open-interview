/**
 * E2E Tests: Voice Interview Transcript Display
 * Tests that transcript area is visible and shows appropriate feedback
 */

import { test, expect } from '@playwright/test';

test.describe('Voice Interview - Transcript Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/voice-interview');
    // Wait for questions to load
    await page.waitForSelector('button:has-text("Start Recording")', { timeout: 10000 });
  });

  test('should show transcript area when recording starts', async ({ page }) => {
    // Start recording
    await page.click('button:has-text("Start Recording")');
    
    // Wait for recording state
    await page.waitForSelector('text=/Recording/i', { timeout: 5000 });
    
    // Transcript area should be visible
    const transcriptArea = page.locator('div.bg-\\[\\#0d1117\\].rounded-xl.min-h-\\[120px\\]');
    await expect(transcriptArea).toBeVisible();
  });

  test('should show placeholder text when no speech detected', async ({ page }) => {
    // Start recording
    await page.click('button:has-text("Start Recording")');
    
    // Should show placeholder
    const placeholder = page.locator('text=/Start speaking.*Your words will appear here/i');
    await expect(placeholder).toBeVisible({ timeout: 5000 });
  });

  test('should show listening indicator', async ({ page }) => {
    // Start recording
    await page.click('button:has-text("Start Recording")');
    
    // Should show "Listening..." text
    const listeningText = page.locator('text=/\\(Listening\\.\\.\\.\\)/i');
    await expect(listeningText).toBeVisible({ timeout: 5000 });
  });

  test('should show recording indicator with pulse animation', async ({ page }) => {
    // Start recording
    await page.click('button:has-text("Start Recording")');
    
    // Red pulsing dot should be visible
    const pulsingDot = page.locator('.animate-pulse.bg-\\[\\#f85149\\]').first();
    await expect(pulsingDot).toBeVisible();
    
    // Recording text should be visible
    const recordingText = page.locator('text=/Recording/i');
    await expect(recordingText).toBeVisible();
  });

  test('should show stop button when recording', async ({ page }) => {
    // Start recording
    await page.click('button:has-text("Start Recording")');
    
    // Stop button should appear
    const stopButton = page.locator('button:has-text("Stop Recording")');
    await expect(stopButton).toBeVisible({ timeout: 5000 });
  });

  test('should transition to editing state after stopping', async ({ page }) => {
    // Start recording
    await page.click('button:has-text("Start Recording")');
    await page.waitForSelector('button:has-text("Stop Recording")', { timeout: 5000 });
    
    // Stop recording
    await page.click('button:has-text("Stop Recording")');
    
    // Should show editing state
    await page.waitForSelector('text=/Edit.*then submit/i', { timeout: 5000 });
    
    // Should show submit button
    const submitButton = page.locator('button:has-text("Submit Answer")');
    await expect(submitButton).toBeVisible();
  });

  test('should show textarea in editing mode', async ({ page }) => {
    // Start and stop recording
    await page.click('button:has-text("Start Recording")');
    await page.waitForSelector('button:has-text("Stop Recording")', { timeout: 5000 });
    await page.click('button:has-text("Stop Recording")');
    
    // Textarea should be visible
    const textarea = page.locator('textarea[placeholder*="Edit your transcribed answer"]');
    await expect(textarea).toBeVisible({ timeout: 5000 });
  });

  test('should show re-record button in editing mode', async ({ page }) => {
    // Start and stop recording
    await page.click('button:has-text("Start Recording")');
    await page.waitForSelector('button:has-text("Stop Recording")', { timeout: 5000 });
    await page.click('button:has-text("Stop Recording")');
    
    // Re-record button should be visible
    const reRecordButton = page.locator('button:has-text("Re-record")');
    await expect(reRecordButton).toBeVisible({ timeout: 5000 });
  });

  test('should return to recording state when re-record clicked', async ({ page }) => {
    // Start, stop, then re-record
    await page.click('button:has-text("Start Recording")');
    await page.waitForSelector('button:has-text("Stop Recording")', { timeout: 5000 });
    await page.click('button:has-text("Stop Recording")');
    await page.waitForSelector('button:has-text("Re-record")', { timeout: 5000 });
    await page.click('button:has-text("Re-record")');
    
    // Should be back in recording state
    await page.waitForSelector('text=/Recording/i', { timeout: 5000 });
    const stopButton = page.locator('button:has-text("Stop Recording")');
    await expect(stopButton).toBeVisible();
  });
});

test.describe('Voice Interview - Mobile Transcript Display', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/voice-interview');
    await page.waitForSelector('button:has-text("Start Recording")', { timeout: 10000 });
  });

  test('should show transcript area on mobile', async ({ page }) => {
    await page.click('button:has-text("Start Recording")');
    
    const transcriptArea = page.locator('div.bg-\\[\\#0d1117\\].rounded-xl.min-h-\\[120px\\]');
    await expect(transcriptArea).toBeVisible({ timeout: 5000 });
    
    // Should be within viewport
    const box = await transcriptArea.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.width).toBeLessThanOrEqual(390);
    }
  });

  test('should show placeholder text on mobile', async ({ page }) => {
    await page.click('button:has-text("Start Recording")');
    
    const placeholder = page.locator('text=/Start speaking/i');
    await expect(placeholder).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Voice Interview - Browser Compatibility Check', () => {
  test('should show unsupported browser message in Firefox', async ({ page, browserName }) => {
    // This test is informational - Firefox doesn't support Web Speech API
    if (browserName === 'firefox') {
      await page.goto('/voice-interview');
      
      // Should show browser not supported message
      const unsupportedMessage = page.locator('text=/Browser Not Supported/i');
      await expect(unsupportedMessage).toBeVisible({ timeout: 5000 });
    }
  });

  test('should work in Chromium browsers', async ({ page, browserName }) => {
    if (browserName === 'chromium') {
      await page.goto('/voice-interview');
      
      // Should show start recording button
      const startButton = page.locator('button:has-text("Start Recording")');
      await expect(startButton).toBeVisible({ timeout: 10000 });
    }
  });
});
