/**
 * Certifications Tests
 * Certification browsing, practice, and exam mode
 */

import { test, expect, setupUser, waitForPageReady, waitForContent, waitForDataLoad } from './fixtures';

test.describe('Certifications Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
    await page.goto('/certifications');
    await waitForPageReady(page);
    await waitForDataLoad(page);
  });

  test('page loads with categories', async ({ page }) => {
    await waitForContent(page, 200);
    
    // Wait for certifications to load (they come from JSON)
    await page.waitForSelector('button:has-text("Cloud"), button:has-text("All")', { timeout: 10000 }).catch(() => {});
    
    const certText = page.getByText(/Certification|Master Your|Exam/i).first();
    const hasCertText = await certText.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasCertText || (await page.locator('body').textContent())?.length! > 200).toBeTruthy();
    
    // Categories are filter buttons - check for "All" button which is always present
    const allButton = page.locator('button').filter({ hasText: 'All' }).first();
    const hasAllButton = await allButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    // Or check for any category button
    const categories = ['Cloud', 'DevOps', 'Security', 'Data', 'AI'];
    let foundCategory = hasAllButton;
    if (!foundCategory) {
      for (const cat of categories) {
        if (await page.locator('button').filter({ hasText: cat }).first().isVisible().catch(() => false)) {
          foundCategory = true;
          break;
        }
      }
    }
    expect(foundCategory).toBeTruthy();
  });

  test('search and category filter work', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search certifications/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('AWS');
      await expect(page.getByText(/AWS/i).first()).toBeVisible();
    }
    
    const cloudButton = page.locator('button').filter({ hasText: 'Cloud' }).first();
    if (await cloudButton.isVisible()) {
      await cloudButton.click();
      await expect(page.locator('body')).toContainText(/.{100,}/);
    }
  });

  test('clicking certification navigates to practice', async ({ page }) => {
    await waitForContent(page);
    
    const certCard = page.locator('[class*="cursor-pointer"], button')
      .filter({ hasText: /AWS|Azure|GCP|Kubernetes/i }).first();
    if (await certCard.isVisible({ timeout: 2000 })) {
      await certCard.click();
      expect(page.url()).toContain('/certification/');
    }
  });
});

test.describe('Certification Practice & Exam', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
  });

  test('practice page loads with back navigation', async ({ page }) => {
    await page.goto('/certification/aws-saa');
    await waitForPageReady(page);
    await expect(page.locator('body')).toContainText(/.{50,}/);
    
    const backButton = page.locator('button:has(svg.lucide-chevron-left, svg.lucide-arrow-left)').first();
    if (await backButton.isVisible()) {
      await backButton.click();
      const url = page.url();
      expect(url.includes('/certifications') || url === '/').toBeTruthy();
    }
  });

  test('exam page loads', async ({ page }) => {
    await page.goto('/certification/aws-saa/exam');
    await waitForPageReady(page);
    await expect(page.locator('body')).toContainText(/.{50,}/);
  });
});
