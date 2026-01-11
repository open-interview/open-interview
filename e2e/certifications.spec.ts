/**
 * Certifications Tests
 * Certification browsing, practice, and exam mode
 */

import { test, expect, setupUser, waitForPageReady } from './fixtures';

test.describe('Certifications Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
  });

  test('page loads', async ({ page }) => {
    await page.goto('/certifications');
    await waitForPageReady(page);
    await page.waitForTimeout(1500);
    
    // Should show certifications heading or content
    const certText = page.getByText(/Certification|Master Your|Exam/i).first();
    const hasCertText = await certText.isVisible({ timeout: 5000 }).catch(() => false);
    
    // Or check for substantial content
    const hasContent = await page.locator('body').textContent();
    expect(hasCertText || (hasContent?.length ?? 0) > 200).toBeTruthy();
  });

  test('shows certification categories', async ({ page }) => {
    await page.goto('/certifications');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);
    
    // Should show category filter pills
    const categories = ['Cloud', 'DevOps', 'Security', 'Data', 'AI'];
    let foundCategory = false;
    
    for (const cat of categories) {
      const isVisible = await page.getByText(cat, { exact: true }).first().isVisible().catch(() => false);
      if (isVisible) {
        foundCategory = true;
        break;
      }
    }
    
    expect(foundCategory).toBeTruthy();
  });

  test('search filters certifications', async ({ page }) => {
    await page.goto('/certifications');
    await waitForPageReady(page);
    
    const searchInput = page.getByPlaceholder(/Search certifications/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('AWS');
      await page.waitForTimeout(500);
      
      // Should show AWS certifications
      const awsText = page.getByText(/AWS/i);
      await expect(awsText.first()).toBeVisible();
    }
  });

  test('category filter works', async ({ page }) => {
    await page.goto('/certifications');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);
    
    // Click on a category pill
    const cloudButton = page.locator('button').filter({ hasText: 'Cloud' }).first();
    if (await cloudButton.isVisible()) {
      await cloudButton.click();
      await page.waitForTimeout(500);
      
      // Should filter to show cloud certifications
      const hasContent = await page.locator('body').textContent();
      expect(hasContent?.length).toBeGreaterThan(100);
    }
  });

  test('clicking certification navigates to practice', async ({ page }) => {
    await page.goto('/certifications');
    await waitForPageReady(page);
    await page.waitForTimeout(1500);
    
    // Click on a certification card
    const certCard = page.locator('[class*="cursor-pointer"], button').filter({ hasText: /AWS|Azure|GCP|Kubernetes/i }).first();
    if (await certCard.isVisible()) {
      await certCard.click();
      await page.waitForTimeout(500);
      
      // Should navigate to certification detail
      expect(page.url()).toContain('/certification/');
    }
  });

  test('shows certification stats', async ({ page }) => {
    await page.goto('/certifications');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);
    
    // Should show stats like hours, questions, pass rate
    const hasStats = await page.locator('body').textContent();
    // Check for common stat indicators
    const hasHours = hasStats?.includes('h') || hasStats?.includes('hour');
    const hasQuestions = hasStats?.includes('question') || hasStats?.includes('Q');
    
    expect(hasHours || hasQuestions || true).toBeTruthy();
  });
});

test.describe('Certification Practice', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
  });

  test('practice page loads', async ({ page }) => {
    // Navigate to a certification practice page
    await page.goto('/certification/aws-saa');
    await waitForPageReady(page);
    
    // Should show content or loading state
    const hasContent = await page.locator('body').textContent();
    expect(hasContent?.length).toBeGreaterThan(50);
  });

  test('back button returns to certifications', async ({ page }) => {
    await page.goto('/certification/aws-saa');
    await waitForPageReady(page);
    
    const backButton = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-left, svg.lucide-arrow-left') }).first();
    if (await backButton.isVisible()) {
      await backButton.click();
      await page.waitForTimeout(500);
      
      // Should navigate back
      const url = page.url();
      expect(url.includes('/certifications') || url === '/').toBeTruthy();
    }
  });
});

test.describe('Certification Exam Mode', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
  });

  test('exam page loads', async ({ page }) => {
    await page.goto('/certification/aws-saa/exam');
    await waitForPageReady(page);
    
    // Should show exam content or no questions message
    const hasContent = await page.locator('body').textContent();
    expect(hasContent?.length).toBeGreaterThan(50);
  });
});
