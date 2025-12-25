import { test, expect } from '@playwright/test';

/**
 * Coding Challenges Tests
 * Tests for the coding challenge feature
 */

test.describe('Coding Challenges Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('marvel-intro-seen', 'true');
      localStorage.setItem('user-preferences', JSON.stringify({
        role: 'fullstack',
        subscribedChannels: ['algorithms'],
        onboardingComplete: true,
        createdAt: new Date().toISOString()
      }));
    });
  });

  test('displays page title', async ({ page }) => {
    await page.goto('/coding');
    await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 15000 });
  });

  test('shows stats grid', async ({ page }) => {
    await page.goto('/coding');
    await expect(page.getByTestId('stats-grid')).toBeVisible({ timeout: 15000 });
  });

  test('shows challenge list', async ({ page }) => {
    await page.goto('/coding');
    await expect(page.getByTestId('challenge-list')).toBeVisible({ timeout: 15000 });
  });

  test('navigates to challenge on click', async ({ page }) => {
    await page.goto('/coding');
    await expect(page.getByTestId('challenge-list')).toBeVisible({ timeout: 15000 });
    
    const firstChallenge = page.getByTestId('challenge-card-0');
    if (await firstChallenge.isVisible()) {
      await firstChallenge.click();
      await page.waitForTimeout(1000);
      await expect(page.getByTestId('challenge-view')).toBeVisible();
    }
  });
});

test.describe('Coding Challenge Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('marvel-intro-seen', 'true');
      localStorage.setItem('user-preferences', JSON.stringify({
        role: 'fullstack',
        subscribedChannels: ['algorithms'],
        onboardingComplete: true,
        createdAt: new Date().toISOString()
      }));
    });
  });

  test('displays code editor', async ({ page }) => {
    await page.goto('/coding');
    await expect(page.getByTestId('challenge-list')).toBeVisible({ timeout: 15000 });
    
    await page.getByTestId('challenge-card-0').click();
    await page.waitForTimeout(1000);
    
    await page.waitForSelector('[data-testid="monaco-editor"]', { timeout: 10000 });
    await expect(page.getByTestId('monaco-editor')).toBeVisible();
  });

  test('has run tests button', async ({ page }) => {
    await page.goto('/coding');
    await expect(page.getByTestId('challenge-list')).toBeVisible({ timeout: 15000 });
    
    await page.getByTestId('challenge-card-0').click();
    await page.waitForTimeout(1000);
    
    await expect(page.getByTestId('run-tests-btn')).toBeVisible();
  });

  test('has copy and reset buttons', async ({ page }) => {
    await page.goto('/coding');
    await expect(page.getByTestId('challenge-list')).toBeVisible({ timeout: 15000 });
    
    await page.getByTestId('challenge-card-0').click();
    await page.waitForTimeout(1000);
    
    await expect(page.getByTestId('copy-btn')).toBeVisible();
    await expect(page.getByTestId('reset-btn')).toBeVisible();
  });
});

test.describe('Coding Challenge Test Execution', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('marvel-intro-seen', 'true');
      localStorage.setItem('user-preferences', JSON.stringify({
        role: 'fullstack',
        subscribedChannels: ['algorithms'],
        onboardingComplete: true,
        createdAt: new Date().toISOString()
      }));
    });
  });

  test('runs tests and shows results', async ({ page }) => {
    await page.goto('/coding');
    await expect(page.getByTestId('challenge-list')).toBeVisible({ timeout: 15000 });
    
    await page.getByTestId('challenge-card-0').click();
    await page.waitForTimeout(500);
    
    await page.getByTestId('run-tests-btn').click();
    await page.waitForTimeout(1000);
    
    await expect(page.getByTestId('test-results')).toBeVisible();
    await expect(page.getByTestId('test-summary')).toBeVisible();
  });
});
