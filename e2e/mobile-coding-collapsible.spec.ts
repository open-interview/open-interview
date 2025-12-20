import { test, expect, Page } from '@playwright/test';

/**
 * Mobile Coding Challenge Collapsible Sections Tests
 * 
 * Tests that coding questions have collapsible question and code areas on mobile
 */

// Mobile viewport configuration
test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

// Helper to skip onboarding
async function skipOnboarding(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('marvel-intro-seen', 'true');
    localStorage.setItem('user-preferences', JSON.stringify({
      role: 'fullstack',
      subscribedChannels: ['system-design', 'algorithms', 'backend', 'frontend'],
      onboardingComplete: true,
      createdAt: new Date().toISOString()
    }));
  });
}

test.describe('Mobile Coding Challenge - Collapsible Sections', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
  });

  test('Problem description panel should be collapsible on mobile', async ({ page }) => {
    await page.goto('/coding');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Click on first challenge
    const firstChallenge = page.getByTestId('challenge-card-0');
    await firstChallenge.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/mobile-screenshots/coding-initial.png', fullPage: true });
    
    // Find the problem collapse toggle (only visible on mobile)
    const problemToggle = page.getByTestId('problem-collapse-toggle');
    await expect(problemToggle).toBeVisible();
    
    // Problem content should be visible initially
    const problemContent = page.getByTestId('problem-content');
    await expect(problemContent).toBeVisible();
    
    // Click to collapse
    await problemToggle.click();
    await page.waitForTimeout(500);
    
    // Problem content should be hidden
    await expect(problemContent).not.toBeVisible();
    await page.screenshot({ path: 'test-results/mobile-screenshots/coding-problem-collapsed.png', fullPage: true });
    
    // Click to expand
    await problemToggle.click();
    await page.waitForTimeout(500);
    
    // Problem content should be visible again
    await expect(problemContent).toBeVisible();
    await page.screenshot({ path: 'test-results/mobile-screenshots/coding-problem-expanded.png', fullPage: true });
  });

  test('Code editor panel should be collapsible on mobile', async ({ page }) => {
    await page.goto('/coding');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Click on first challenge
    const firstChallenge = page.getByTestId('challenge-card-0');
    await firstChallenge.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Find the code collapse toggle (only visible on mobile)
    const codeToggle = page.getByTestId('code-collapse-toggle');
    await expect(codeToggle).toBeVisible();
    
    // Code content should be visible initially
    const codeContent = page.getByTestId('code-content');
    await expect(codeContent).toBeVisible();
    
    // Click to collapse
    await codeToggle.click();
    await page.waitForTimeout(500);
    
    // Code content should be hidden
    await expect(codeContent).not.toBeVisible();
    await page.screenshot({ path: 'test-results/mobile-screenshots/coding-code-collapsed.png', fullPage: true });
    
    // Click to expand
    await codeToggle.click();
    await page.waitForTimeout(500);
    
    // Code content should be visible again
    await expect(codeContent).toBeVisible();
    await page.screenshot({ path: 'test-results/mobile-screenshots/coding-code-expanded.png', fullPage: true });
  });

  test('Both panels can be collapsed independently', async ({ page }) => {
    await page.goto('/coding');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Click on first challenge
    const firstChallenge = page.getByTestId('challenge-card-0');
    await firstChallenge.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const problemToggle = page.getByTestId('problem-collapse-toggle');
    const codeToggle = page.getByTestId('code-collapse-toggle');
    const problemContent = page.getByTestId('problem-content');
    const codeContent = page.getByTestId('code-content');
    
    // Both should be visible initially
    await expect(problemContent).toBeVisible();
    await expect(codeContent).toBeVisible();
    
    // Collapse problem only
    await problemToggle.click();
    await page.waitForTimeout(300);
    await expect(problemContent).not.toBeVisible();
    await expect(codeContent).toBeVisible();
    
    // Collapse code too
    await codeToggle.click();
    await page.waitForTimeout(300);
    await expect(problemContent).not.toBeVisible();
    await expect(codeContent).not.toBeVisible();
    await page.screenshot({ path: 'test-results/mobile-screenshots/coding-both-collapsed.png', fullPage: true });
    
    // Expand problem only
    await problemToggle.click();
    await page.waitForTimeout(300);
    await expect(problemContent).toBeVisible();
    await expect(codeContent).not.toBeVisible();
    
    // Expand code too
    await codeToggle.click();
    await page.waitForTimeout(300);
    await expect(problemContent).toBeVisible();
    await expect(codeContent).toBeVisible();
  });

  test('Hints section should be collapsible', async ({ page }) => {
    await page.goto('/coding');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Click on first challenge
    const firstChallenge = page.getByTestId('challenge-card-0');
    await firstChallenge.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Find hints toggle
    const hintsToggle = page.getByTestId('hints-toggle');
    
    if (await hintsToggle.isVisible()) {
      // Initially hints should be collapsed
      const hintsContainer = page.getByTestId('hints-container');
      await expect(hintsContainer).not.toBeVisible();
      
      // Click to expand
      await hintsToggle.click();
      await page.waitForTimeout(500);
      
      // Hints should now be visible
      await expect(hintsContainer).toBeVisible();
      await page.screenshot({ path: 'test-results/mobile-screenshots/coding-hints-expanded.png', fullPage: true });
      
      // Click to collapse
      await hintsToggle.click();
      await page.waitForTimeout(500);
      
      // Hints should be hidden again
      await expect(hintsContainer).not.toBeVisible();
    }
  });

  test('Action buttons should be accessible on mobile', async ({ page }) => {
    await page.goto('/coding');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Click on first challenge
    const firstChallenge = page.getByTestId('challenge-card-0');
    await firstChallenge.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check all action buttons are visible and accessible
    const copyBtn = page.getByTestId('copy-btn');
    const resetBtn = page.getByTestId('reset-btn');
    const runBtn = page.getByTestId('run-tests-btn');
    const revealBtn = page.getByTestId('reveal-solution-btn');
    
    // All buttons should be visible
    await expect(copyBtn).toBeVisible();
    await expect(resetBtn).toBeVisible();
    await expect(runBtn).toBeVisible();
    await expect(revealBtn).toBeVisible();
    
    // Check button sizes are touch-friendly
    for (const btn of [copyBtn, resetBtn, runBtn, revealBtn]) {
      const box = await btn.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(30);
        expect(box.height).toBeGreaterThanOrEqual(30);
      }
    }
    
    await page.screenshot({ path: 'test-results/mobile-screenshots/coding-action-buttons.png', fullPage: true });
  });

  test('Collapsible toggle buttons should be touch-friendly', async ({ page }) => {
    await page.goto('/coding');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Click on first challenge
    const firstChallenge = page.getByTestId('challenge-card-0');
    await firstChallenge.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check toggle buttons are touch-friendly (min 44px height for accessibility)
    const problemToggle = page.getByTestId('problem-collapse-toggle');
    const codeToggle = page.getByTestId('code-collapse-toggle');
    
    for (const toggle of [problemToggle, codeToggle]) {
      const box = await toggle.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40); // Touch-friendly height
        expect(box.width).toBeGreaterThanOrEqual(300); // Should span most of the width
      }
    }
  });
});
