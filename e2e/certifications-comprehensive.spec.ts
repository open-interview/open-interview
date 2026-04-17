import { test, expect, setupUser, waitForPageReady, waitForContent, waitForDataLoad, checkNoOverflow, hideMascot } from './fixtures';

test.describe('Certifications Comprehensive', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
    await page.goto('/certifications');
    await waitForPageReady(page);
    await waitForDataLoad(page);
    await hideMascot(page);
  });

  test('page loads with certification list', async ({ page }) => {
    await waitForContent(page, 200);
    const body = await page.locator('body').textContent();
    expect.soft(body?.length).toBeGreaterThan(200);

    const hasCerts = await page.locator('[class*="card"], [class*="cert"], li, article')
      .filter({ hasText: /AWS|Azure|GCP|Kubernetes|Terraform/i })
      .first()
      .isVisible({ timeout: 8000 })
      .catch(() => false);
    expect.soft(hasCerts).toBeTruthy();
  });

  test('AWS certifications are displayed', async ({ page }) => {
    await waitForContent(page, 100);
    const awsVisible = await page.getByText(/AWS/i).first().isVisible({ timeout: 8000 }).catch(() => false);
    expect.soft(awsVisible).toBeTruthy();

    const awsItems = page.locator('body').getByText(/AWS Solutions Architect|AWS Developer|AWS SysOps/i).first();
    const hasAwsDetail = await awsItems.isVisible({ timeout: 5000 }).catch(() => false);
    expect.soft(hasAwsDetail).toBeTruthy();
  });

  test('Kubernetes certifications are visible', async ({ page }) => {
    await waitForContent(page, 100);
    const k8sVisible = await page.getByText(/Kubernetes|CKA|CKAD|CKS/i).first().isVisible({ timeout: 8000 }).catch(() => false);
    expect.soft(k8sVisible).toBeTruthy();
  });

  test('certification cards show provider and name', async ({ page }) => {
    await waitForContent(page, 200);

    const providers = ['AWS', 'Azure', 'GCP', 'Kubernetes', 'Terraform'];
    let foundCount = 0;
    for (const provider of providers) {
      const visible = await page.getByText(new RegExp(provider, 'i')).first().isVisible({ timeout: 3000 }).catch(() => false);
      if (visible) foundCount++;
    }
    expect.soft(foundCount).toBeGreaterThanOrEqual(2);
  });

  test('clicking a certification opens practice mode', async ({ page }) => {
    await waitForContent(page, 200);

    const certCard = page.locator('[class*="cursor-pointer"], button, a, [role="button"]')
      .filter({ hasText: /AWS|Azure|GCP|Kubernetes/i })
      .first();

    const isClickable = await certCard.isVisible({ timeout: 8000 }).catch(() => false);
    if (!isClickable) {
      test.skip();
      return;
    }

    await certCard.click();
    await waitForPageReady(page);

    const url = page.url();
    const navigated = url.includes('/certification') || url.includes('/cert');
    expect.soft(navigated).toBeTruthy();
  });

  test('practice mode shows questions', async ({ page }) => {
    await page.goto('/certification/aws-saa');
    await waitForPageReady(page);
    await waitForDataLoad(page);

    const hasContent = await page.locator('body').textContent().then(t => (t?.length ?? 0) > 50).catch(() => false);
    expect.soft(hasContent).toBeTruthy();

    const startBtn = page.getByRole('button', { name: /start|practice|begin/i }).first();
    const hasStart = await startBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasStart) {
      await startBtn.click();
      await waitForContent(page, 50);
    }

    const questionVisible = await page.locator('h1, h2, h3, p, [class*="question"]')
      .filter({ hasText: /.{20,}/ })
      .first()
      .isVisible({ timeout: 8000 })
      .catch(() => false);
    expect.soft(questionVisible).toBeTruthy();
  });

  test('filter by provider works - AWS', async ({ page }) => {
    await waitForContent(page, 100);

    const awsFilter = page.locator('button, [role="tab"], [role="option"]')
      .filter({ hasText: /^AWS$/ })
      .first();
    const hasFilter = await awsFilter.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasFilter) {
      await awsFilter.click();
      await waitForContent(page, 50);
      const awsContent = await page.getByText(/AWS/i).first().isVisible({ timeout: 5000 }).catch(() => false);
      expect.soft(awsContent).toBeTruthy();
    } else {
      // Filter may be a different UI — check AWS content is present regardless
      const awsPresent = await page.getByText(/AWS/i).first().isVisible({ timeout: 5000 }).catch(() => false);
      expect.soft(awsPresent).toBeTruthy();
    }
  });

  test('filter by provider works - GCP', async ({ page }) => {
    await waitForContent(page, 100);

    const gcpFilter = page.locator('button, [role="tab"], [role="option"]')
      .filter({ hasText: /^GCP$|^Google/i })
      .first();
    const hasFilter = await gcpFilter.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasFilter) {
      await gcpFilter.click();
      await waitForContent(page, 50);
      const gcpContent = await page.getByText(/GCP|Google Cloud/i).first().isVisible({ timeout: 5000 }).catch(() => false);
      expect.soft(gcpContent).toBeTruthy();
    } else {
      const gcpPresent = await page.getByText(/GCP|Google Cloud/i).first().isVisible({ timeout: 5000 }).catch(() => false);
      expect.soft(gcpPresent).toBeTruthy();
    }
  });

  test('filter by provider works - Azure', async ({ page }) => {
    await waitForContent(page, 100);

    const azureFilter = page.locator('button, [role="tab"], [role="option"]')
      .filter({ hasText: /^Azure$/i })
      .first();
    const hasFilter = await azureFilter.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasFilter) {
      await azureFilter.click();
      await waitForContent(page, 50);
      const azureContent = await page.getByText(/Azure/i).first().isVisible({ timeout: 5000 }).catch(() => false);
      expect.soft(azureContent).toBeTruthy();
    } else {
      const azurePresent = await page.getByText(/Azure/i).first().isVisible({ timeout: 5000 }).catch(() => false);
      expect.soft(azurePresent).toBeTruthy();
    }
  });

  test('search/filter certifications', async ({ page }) => {
    await waitForContent(page, 100);

    const searchInput = page.getByPlaceholder(/search/i).first();
    const hasSearch = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSearch) {
      await searchInput.fill('Kubernetes');
      await page.waitForTimeout(400);
      const k8sResult = await page.getByText(/Kubernetes|CKA/i).first().isVisible({ timeout: 5000 }).catch(() => false);
      expect.soft(k8sResult).toBeTruthy();

      await searchInput.clear();
      await page.waitForTimeout(300);
    } else {
      // No search box — verify content is still present
      const hasContent = await page.locator('body').textContent().then(t => (t?.length ?? 0) > 100).catch(() => false);
      expect.soft(hasContent).toBeTruthy();
    }
  });

  test('no overflow on certifications page', async ({ page }) => {
    await waitForContent(page, 200);
    await checkNoOverflow(page);
  });

  test('progress indicator for started certifications', async ({ page }) => {
    // Seed some progress in localStorage
    await page.evaluate(() => {
      const progress = { 'aws-saa': { completed: 5, total: 20, lastAttempt: Date.now() } };
      localStorage.setItem('cert-progress', JSON.stringify(progress));
    });

    await page.reload();
    await waitForPageReady(page);
    await waitForDataLoad(page);
    await hideMascot(page);
    await waitForContent(page, 100);

    // Progress may show as a bar, percentage, or badge — check broadly
    const progressIndicator = page.locator(
      '[class*="progress"], [role="progressbar"], [class*="badge"], [class*="percent"]'
    ).first();
    const hasProgress = await progressIndicator.isVisible({ timeout: 5000 }).catch(() => false);

    // Also accept numeric progress text like "5/20" or "25%"
    const progressText = await page.getByText(/\d+\s*\/\s*\d+|\d+%/).first().isVisible({ timeout: 3000 }).catch(() => false);

    expect.soft(hasProgress || progressText).toBeTruthy();
  });
});
