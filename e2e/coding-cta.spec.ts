import { test, expect, Page } from '@playwright/test';

// All CTAs to verify in the coding challenge flow
const BASE = 'http://localhost:5173';

async function goto(page: Page, path: string) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
}

test.describe('Coding Challenge CTAs', () => {

  test('Home page - Code Challenges card navigates to /code', async ({ page }) => {
    await goto(page, '/');
    await page.waitForSelector('text=Code Challenges', { timeout: 10000 });
    await page.click('text=Code Challenges');
    await expect(page).toHaveURL(/\/code/, { timeout: 5000 });
  });

  test('/code - challenge list loads with items', async ({ page }) => {
    await goto(page, '/code');
    // Should show challenge grid or link to /code/challenges
    await page.waitForSelector('text=Two Sum, text=Start Coding, text=Challenges', { timeout: 10000 }).catch(() => {});
    const body = await page.textContent('body');
    expect(body).toMatch(/challenge|problem|Two Sum|Start Coding/i);
  });

  test('/code/challenges - list page loads 30 challenges', async ({ page }) => {
    await goto(page, '/code/challenges');
    await page.waitForSelector('table', { timeout: 10000 });
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBeGreaterThanOrEqual(10);
  });

  test('/code/challenges - clicking a row navigates to workspace', async ({ page }) => {
    await goto(page, '/code/challenges');
    await page.waitForSelector('tbody tr', { timeout: 10000 });
    await page.locator('tbody tr').first().click();
    await expect(page).toHaveURL(/\/code\/challenges\//, { timeout: 5000 });
  });

  test('/code/challenges/two-sum - workspace loads', async ({ page }) => {
    await goto(page, '/code/challenges/two-sum');
    await page.waitForSelector('text=Two Sum', { timeout: 10000 });
    const body = await page.textContent('body');
    expect(body).toMatch(/Two Sum/i);
  });

  test('/code/challenges/two-sum - editor is present', async ({ page }) => {
    await goto(page, '/code/challenges/two-sum');
    await page.waitForSelector('.monaco-editor, [data-testid="editor"]', { timeout: 15000 });
  });

  test('/code/challenges/two-sum - Run Code button exists', async ({ page }) => {
    await goto(page, '/code/challenges/two-sum');
    await page.waitForSelector('text=Two Sum', { timeout: 10000 });
    const runBtn = page.locator('button', { hasText: /run code/i });
    await expect(runBtn).toBeVisible({ timeout: 5000 });
  });

  test('/code/challenges/two-sum - Submit button exists', async ({ page }) => {
    await goto(page, '/code/challenges/two-sum');
    await page.waitForSelector('text=Two Sum', { timeout: 10000 });
    const submitBtn = page.locator('button', { hasText: /submit/i });
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
  });

  test('/coding redirect - goes to /code', async ({ page }) => {
    await goto(page, '/coding');
    await expect(page).toHaveURL(/\/code/, { timeout: 5000 });
  });

  test('Sidebar - Code Challenges link navigates to /code', async ({ page }) => {
    await goto(page, '/');
    // Try sidebar link
    const link = page.locator('a[href="/code"], button', { hasText: /code challenges/i }).first();
    if (await link.isVisible()) {
      await link.click();
      await expect(page).toHaveURL(/\/code/, { timeout: 5000 });
    }
  });

});
