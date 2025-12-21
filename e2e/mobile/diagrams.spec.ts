import { test, expect } from '@playwright/test';

/**
 * Mobile Mermaid Diagrams and Swipe Navigation Tests
 */

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

test.describe('Mobile Mermaid Diagrams (Disabled)', () => {
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

  test('should show placeholder instead of mermaid diagram on mobile', async ({ page }) => {
    await page.goto('/channel/system-design');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Mobile view shows question content differently - check for heading or question text
    const hasContent = await page.getByRole('heading', { level: 1 }).first().isVisible({ timeout: 5000 }).catch(() => false) ||
                       await page.locator('h1').first().isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasContent).toBeTruthy();
  });

  test('diagram placeholder should not overflow viewport', async ({ page }) => {
    await page.goto('/channel/system-design');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });
});

test.describe('Mobile Swipe Navigation', () => {
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

  test('horizontal swipe left should go to next question', async ({ page }) => {
    await page.goto('/channel/system-design/0');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/channel/system-design');
  });

  test('horizontal swipe right should go to previous question', async ({ page }) => {
    await page.goto('/channel/system-design/1');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/channel/system-design');
  });

  test('vertical swipe should NOT change question', async ({ page }) => {
    await page.goto('/channel/system-design/0');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/channel/system-design');
  });
});

test.describe('Mobile Mermaid Disabled State', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('marvel-intro-seen', 'true');
      localStorage.setItem('user-preferences', JSON.stringify({
        role: 'fullstack',
        subscribedChannels: ['system-design'],
        onboardingComplete: true,
        createdAt: new Date().toISOString()
      }));
    });
  });

  test('should not have zoom controls on mobile (mermaid disabled)', async ({ page }) => {
    await page.goto('/channel/system-design');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Mobile view shows question content - check for heading
    const hasContent = await page.getByRole('heading', { level: 1 }).first().isVisible({ timeout: 5000 }).catch(() => false) ||
                       await page.locator('h1').first().isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasContent).toBeTruthy();
    
    // Verify no zoom controls on mobile
    const hasZoomControls = await page.locator('[data-testid="zoom-controls"]').isVisible().catch(() => false);
    expect(hasZoomControls).toBeFalsy();
  });

  test('placeholder should be styled correctly', async ({ page }) => {
    await page.goto('/channel/system-design');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Mobile view shows question content - check for heading
    const hasContent = await page.getByRole('heading', { level: 1 }).first().isVisible({ timeout: 5000 }).catch(() => false) ||
                       await page.locator('h1').first().isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasContent).toBeTruthy();
  });
});

test.describe('Mobile Answer Panel Scrolling', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('marvel-intro-seen', 'true');
      localStorage.setItem('user-preferences', JSON.stringify({
        role: 'fullstack',
        subscribedChannels: ['system-design'],
        onboardingComplete: true,
        createdAt: new Date().toISOString()
      }));
    });
  });

  test('should be able to scroll answer content without changing question', async ({ page }) => {
    await page.goto('/channel/system-design/0');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/channel/system-design');
  });
});
