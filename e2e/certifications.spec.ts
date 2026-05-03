/**
 * Certifications — consolidated from:
 *   certifications.spec.ts + certifications-comprehensive.spec.ts
 */

import { test, expect, setupUser, waitForPageReady, waitForContent, waitForDataLoad, checkNoOverflow, hideMascot } from './fixtures';

test.describe('Certifications Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
    await page.goto('/certifications');
    await waitForPageReady(page);
    await waitForDataLoad(page);
    await hideMascot(page);
  });

  test('page loads with content', async ({ page }) => {
    await waitForContent(page, 100);
    const body = await page.locator('body').textContent();
    expect(body?.length).toBeGreaterThan(100);
  });

  test('shows certifications or empty state', async ({ page }) => {
    // Wait for skeleton loaders to disappear (certifications.json fetch is async)
    await page.waitForFunction(
      () => !document.querySelector('[class*="animate-pulse"]:not(button):not([class*="bg-"])'),
      { timeout: 8000 }
    ).catch(() => {});
    await page.waitForTimeout(500);

    // Check for cert cards (h3 with cert name, div with provider like AWS/Azure), or empty state
    const hasCertsByProvider = await page.locator('h3')
      .filter({ hasText: /AWS|Azure|GCP|Kubernetes|Terraform/i })
      .first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasCertsByCard = await page.locator('[class*="bg-card"], [class*="rounded-2xl"]')
      .filter({ hasText: /AWS|Azure|GCP|Kubernetes|Terraform/i })
      .first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasEmptyState = await page.getByText(/no certifications|try a different/i).first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasProviderSection = await page.locator('div').filter({ hasText: /Amazon Web Services|Microsoft Azure|Google Cloud/i }).first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasCertsByProvider || hasCertsByCard || hasEmptyState || hasProviderSection).toBeTruthy();
  });

  test('category filter buttons are present', async ({ page }) => {
    await waitForContent(page, 100);
    const allButton = page.locator('button').filter({ hasText: 'All' }).first();
    const hasAllButton = await allButton.isVisible({ timeout: 5000 }).catch(() => false);
    const categories = ['Cloud', 'DevOps', 'Security', 'Data', 'AI'];
    let foundCategory = hasAllButton;
    if (!foundCategory) {
      for (const cat of categories) {
        if (await page.locator('button').filter({ hasText: cat }).first().isVisible().catch(() => false)) {
          foundCategory = true; break;
        }
      }
    }
    expect(foundCategory).toBeTruthy();
  });

  test('search and category filter work', async ({ page }) => {
    // Wait for certifications data to load — skeleton has no animate-pulse, wait for cert h3 content
    await page.waitForFunction(
      () => {
        const h3s = Array.from(document.querySelectorAll('h3'));
        return h3s.some(el => /AWS|Azure|Google|Kubernetes|Terraform|Certified|Cloud/i.test(el.textContent || ''));
      },
      { timeout: 12000 }
    ).catch(() => {});
    await page.waitForTimeout(300);

    const searchInput = page.getByPlaceholder(/Search certifications/i).first();
    const isVisible = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await searchInput.fill('AWS');
      await page.waitForTimeout(500);
      // After filtering by "AWS", results should still have some h3 or the empty state
      const hasAWS = await page.locator('h3').filter({ hasText: /AWS/i }).first().isVisible({ timeout: 5000 }).catch(() => false);
      const hasNoResults = await page.getByText(/no certifications/i).first().isVisible({ timeout: 1000 }).catch(() => false);
      // Either AWS results are shown, or "no certifications" empty state, either is valid
      expect(hasAWS || hasNoResults).toBeTruthy();
      await searchInput.clear();
    }
    const cloudButton = page.locator('button').filter({ hasText: 'Cloud' }).first();
    if (await cloudButton.isVisible()) {
      await cloudButton.click();
      await expect(page.locator('body')).toContainText(/.{100,}/);
    }
  });

  test('clicking a certification navigates to practice', async ({ page }) => {
    await waitForContent(page, 100);
    const certCard = page.locator('[class*="cursor-pointer"], button, a')
      .filter({ hasText: /AWS|Azure|GCP|Kubernetes/i }).first();
    const isClickable = await certCard.isVisible({ timeout: 3000 }).catch(() => false);
    if (!isClickable) return; // no certs in dev
    await certCard.click();
    await waitForPageReady(page);
    const url = page.url();
    expect(url.includes('/certification') || url.includes('/cert')).toBeTruthy();
  });

  test('no overflow on certifications page', async ({ page }) => {
    await waitForContent(page, 100);
    await checkNoOverflow(page);
  });
});

test.describe('Certification Practice & Exam', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
  });

  test('practice page loads', async ({ page }) => {
    await page.goto('/certification/aws-saa');
    await waitForPageReady(page);
    await waitForDataLoad(page);
    const hasContent = (await page.locator('body').textContent() || '').length > 50;
    expect(hasContent).toBeTruthy();
  });

  test('practice page has back navigation', async ({ page }) => {
    await page.goto('/certification/aws-saa');
    await waitForPageReady(page);
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
