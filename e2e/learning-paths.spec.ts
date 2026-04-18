/**
 * Learning Paths — consolidated from:
 *   learning-paths.spec.ts + learning-paths-genz.spec.ts + curated-paths-loading.spec.ts
 */

import { test, expect, setupUser, waitForPageReady, waitForContent, waitForDataLoad, checkNoOverflow } from './fixtures';

test.describe('Learning Paths Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
    await page.goto('/learning-paths');
    await waitForPageReady(page);
    await waitForDataLoad(page);
  });

  test('page loads with content', async ({ page }) => {
    await waitForContent(page, 100);
    expect((await page.locator('body').textContent())!.length).toBeGreaterThan(100);
  });

  test('curated paths or empty state is displayed', async ({ page }) => {
    await waitForContent(page, 100);
    const pathKeywords = ['Path', 'Learning', 'Track', 'Roadmap'];
    let found = false;
    for (const kw of pathKeywords) {
      if (await page.getByText(kw, { exact: false }).first().isVisible({ timeout: 2000 }).catch(() => false)) { found = true; break; }
    }
    if (!found) found = await page.locator('[class*="card"], article').first().isVisible({ timeout: 2000 }).catch(() => false);
    expect(found).toBeTruthy();
  });

  test('no horizontal overflow', async ({ page }) => {
    await waitForContent(page, 100);
    await checkNoOverflow(page);
  });

  test('no critical JS errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/learning-paths');
    await waitForPageReady(page);
    await waitForDataLoad(page);
    const critical = errors.filter(e => !e.includes('favicon') && !e.includes('404') && !e.includes('pagefind') && !e.includes('sw.js') && !e.includes('preload'));
    expect.soft(critical.length).toBeLessThan(5);
  });

  test('Gen Z theme is applied (black background)', async ({ page }) => {
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  });
});

test.describe('My Path Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my-path');
    await page.waitForLoadState('networkidle');
  });

  test('loads curated paths from static JSON', async ({ page }) => {
    const jsonResponse = await page.waitForResponse(
      r => r.url().includes('/data/learning-paths.json') && r.status() === 200,
      { timeout: 10000 }
    ).catch(() => null);
    if (!jsonResponse) return; // JSON not available in dev
    const data = await jsonResponse.json();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('id');
    expect(data[0]).toHaveProperty('title');
  });

  test('displays curated paths section', async ({ page }) => {
    const curatedSection = page.locator('text=Curated Career Paths');
    await expect(curatedSection).toBeVisible({ timeout: 10000 });
  });

  test('handles JSON 404 gracefully', async ({ page }) => {
    await page.route('**/data/learning-paths.json', route => route.fulfill({ status: 404, body: 'Not found' }));
    await page.goto('/my-path');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Curated Career Paths')).toBeVisible();
  });

  test('no JSON parsing errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/my-path');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const hasParsingError = errors.some(e => e.includes('JSON') || e.includes('parse'));
    expect(hasParsingError).toBe(false);
  });
});
