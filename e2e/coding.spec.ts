/**
 * Coding Challenges — consolidated from:
 *   coding.spec.ts + coding-challenges-comprehensive.spec.ts
 *   + coding-challenges-genz.spec.ts + coding-cta.spec.ts
 */

import { test, expect, setupUser, waitForPageReady, waitForContent, waitForDataLoad, checkNoOverflow, hideMascot } from './fixtures';

test.describe('Coding Challenges List', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
    await page.goto('/coding');
    await waitForPageReady(page);
    await waitForDataLoad(page);
    await hideMascot(page);
  });

  test('page loads with content', async ({ page }) => {
    await waitForContent(page, 100);
    expect((await page.locator('body').textContent())!.length).toBeGreaterThan(100);
  });

  test('shows ALL CHALLENGES heading', async ({ page }) => {
    await expect(page.getByText('ALL CHALLENGES')).toBeVisible({ timeout: 8000 });
  });

  test('challenge cards show title and difficulty', async ({ page }) => {
    await page.waitForSelector('text=ALL CHALLENGES', { timeout: 8000 });
    const firstCard = page.locator('button').filter({ has: page.locator('h3') }).first();
    await expect.soft(firstCard).toBeVisible({ timeout: 5000 });
    const badge = firstCard.locator('span').filter({ hasText: /^(EASY|MEDIUM)$/ }).first();
    await expect.soft(badge).toBeVisible();
  });

  test('quick start buttons are present', async ({ page }) => {
    await expect.soft(page.locator('text=Random Challenge')).toBeVisible({ timeout: 5000 });
    await expect.soft(page.locator('text=Easy Mode')).toBeVisible({ timeout: 5000 });
  });

  test('no overflow on list page', async ({ page }) => {
    await waitForContent(page, 100);
    await checkNoOverflow(page);
  });
});

test.describe('Coding Challenge Editor', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
    await page.goto('/coding');
    await waitForPageReady(page);
    await page.waitForSelector('text=ALL CHALLENGES', { timeout: 8000 });
    const firstCard = page.locator('button').filter({ has: page.locator('h3') }).first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/coding\/.+/, { timeout: 8000 });
  });

  test('Monaco editor is rendered', async ({ page }) => {
    await expect.soft(page.locator('.monaco-editor').first()).toBeVisible({ timeout: 15000 });
  });

  test('language selector has Python and JavaScript', async ({ page }) => {
    const langSelect = page.locator('select').first();
    await expect.soft(langSelect).toBeVisible({ timeout: 5000 });
    await expect.soft(langSelect.locator('option[value="javascript"]')).toHaveCount(1);
    await expect.soft(langSelect.locator('option[value="python"]')).toHaveCount(1);
  });

  test('problem description and examples are shown', async ({ page }) => {
    await expect.soft(page.getByText('Problem', { exact: true }).first()).toBeVisible({ timeout: 5000 });
    await expect.soft(page.getByText('Examples', { exact: true }).first()).toBeVisible({ timeout: 5000 });
  });

  test('run tests button is visible', async ({ page }) => {
    await expect.soft(page.locator('button').filter({ hasText: /Run Tests/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test('back button returns to list', async ({ page }) => {
    const backBtn = page.locator('header button').first();
    await backBtn.click();
    await expect(page).toHaveURL('/coding', { timeout: 5000 });
  });

  test('can switch to Python', async ({ page }) => {
    const langSelect = page.locator('select').first();
    if (await langSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await langSelect.selectOption('python');
      await expect(langSelect).toHaveValue('python');
    }
  });
});
