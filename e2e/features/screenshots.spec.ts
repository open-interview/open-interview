import { test, expect } from '@playwright/test';

/**
 * Screenshot Pages Tests
 * Tests for pages used in screenshot automation
 */

test.describe('Screenshot Pages - Desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop screenshot tests');

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('marvel-intro-seen', 'true');
      localStorage.setItem('user-preferences', JSON.stringify({
        role: 'fullstack',
        subscribedChannels: ['system-design', 'algorithms', 'frontend', 'devops', 'generative-ai', 'machine-learning'],
        onboardingComplete: true,
        createdAt: new Date().toISOString()
      }));
      
      localStorage.setItem('progress-system-design', JSON.stringify([
        'sd-1', 'sd-2', 'sd-3', 'sd-4', 'sd-5', 'sd-6', 'sd-7', 'sd-8', 'sd-9', 'sd-10'
      ]));
      localStorage.setItem('progress-algorithms', JSON.stringify([
        'algo-1', 'algo-2', 'algo-3', 'algo-4', 'algo-5'
      ]));
    });
  });

  test('home page renders correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check for key elements in the redesigned home page
    // Quick Quiz card, Featured question card, or welcome card should be visible
    const hasQuickQuiz = await page.getByText("Quick Quiz").isVisible({ timeout: 5000 }).catch(() => false);
    const hasFeaturedQuestion = await page.getByText("Today's Question").isVisible({ timeout: 1000 }).catch(() => false);
    const hasWelcome = await page.getByText('Welcome to Learn Reels').isVisible({ timeout: 1000 }).catch(() => false);
    expect(hasQuickQuiz || hasFeaturedQuestion || hasWelcome).toBeTruthy();
    
    // Your Channels section should be visible for users with subscriptions
    await expect(page.getByText('Your Channels')).toBeVisible();
  });

  test('channels page renders correctly', async ({ page }) => {
    await page.goto('/channels');
    await page.waitForTimeout(2000);
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
  });

  test('question reels page renders correctly', async ({ page }) => {
    await page.goto('/channel/system-design/0');
    await page.waitForTimeout(2500);
    
    const hasContent = await page.getByTestId('question-panel').first().isVisible({ timeout: 5000 }).catch(() => false) ||
                       await page.getByText('Question').isVisible({ timeout: 1000 }).catch(() => false);
    expect(hasContent).toBeTruthy();
  });

  test('stats page renders correctly', async ({ page }) => {
    await page.goto('/stats');
    await page.waitForTimeout(2000);
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
  });

  test('badges page renders correctly', async ({ page }) => {
    await page.goto('/badges');
    await page.waitForTimeout(2000);
    
    await expect(page.getByRole('heading', { name: /Badges/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Your Collection')).toBeVisible();
  });

  test('tests page renders correctly', async ({ page }) => {
    await page.goto('/tests');
    await page.waitForTimeout(2000);
    await expect(page.getByText('Tests')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Screenshot Pages - Mobile', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('marvel-intro-seen', 'true');
      localStorage.setItem('user-preferences', JSON.stringify({
        role: 'fullstack',
        subscribedChannels: ['system-design', 'algorithms', 'frontend', 'devops'],
        onboardingComplete: true,
        createdAt: new Date().toISOString()
      }));
    });
  });

  test('home page renders correctly on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10);
    
    const pageContent = await page.locator('body').textContent();
    expect(pageContent && pageContent.length > 100).toBeTruthy();
  });

  test('reels page renders correctly on mobile', async ({ page }) => {
    await page.goto('/channel/system-design/0');
    await page.waitForTimeout(2500);
    
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10);
  });

  test('badges page renders correctly on mobile', async ({ page }) => {
    await page.goto('/badges');
    await page.waitForTimeout(2000);
    
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10);
    
    await expect(page.getByRole('heading', { name: /Badges/i })).toBeVisible({ timeout: 10000 });
  });

  test('tests page renders correctly on mobile', async ({ page }) => {
    await page.goto('/tests');
    await page.waitForTimeout(2000);
    
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10);
    
    await expect(page.getByText('Tests')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Screenshot Pages - Theme Support', () => {
  test.skip(({ isMobile }) => isMobile, 'Theme tests are desktop-only');

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('marvel-intro-seen', 'true');
      localStorage.setItem('user-preferences', JSON.stringify({
        role: 'fullstack',
        subscribedChannels: ['system-design', 'algorithms'],
        onboardingComplete: true,
        createdAt: new Date().toISOString()
      }));
    });
  });

  test('home page supports dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.waitForTimeout(2000);
    // Check for key elements in the redesigned home page
    const hasQuickQuiz = await page.getByText("Quick Quiz").isVisible({ timeout: 5000 }).catch(() => false);
    const hasFeaturedQuestion = await page.getByText("Today's Question").isVisible({ timeout: 1000 }).catch(() => false);
    const hasChannels = await page.getByText('Your Channels').isVisible({ timeout: 1000 }).catch(() => false);
    expect(hasQuickQuiz || hasFeaturedQuestion || hasChannels).toBeTruthy();
  });

  test('home page supports light theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
    });
    await page.goto('/');
    await page.waitForTimeout(2000);
    // Check for key elements in the redesigned home page
    const hasQuickQuiz = await page.getByText("Quick Quiz").isVisible({ timeout: 5000 }).catch(() => false);
    const hasFeaturedQuestion = await page.getByText("Today's Question").isVisible({ timeout: 1000 }).catch(() => false);
    const hasChannels = await page.getByText('Your Channels').isVisible({ timeout: 1000 }).catch(() => false);
    expect(hasQuickQuiz || hasFeaturedQuestion || hasChannels).toBeTruthy();
  });

  test('badges page supports both themes', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/badges');
    await page.waitForTimeout(2000);
    await expect(page.getByRole('heading', { name: /Badges/i })).toBeVisible({ timeout: 10000 });
    
    await page.emulateMedia({ colorScheme: 'light' });
    await page.reload();
    await page.waitForTimeout(2000);
    await expect(page.getByRole('heading', { name: /Badges/i })).toBeVisible({ timeout: 10000 });
  });
});
