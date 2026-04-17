import { test, expect, setupUser, waitForPageReady, waitForContent, waitForDataLoad, checkNoOverflow, hideMascot } from './fixtures';

test.describe('Coding Challenges', () => {
  test.beforeEach(async ({ page }) => {
    await setupUser(page);
    await page.goto('/coding');
    await waitForPageReady(page);
    await waitForDataLoad(page);
    await hideMascot(page);
  });

  test('coding challenges page loads with challenge list', async ({ page }) => {
    await waitForContent(page, 100);

    await expect(page.getByText('ALL CHALLENGES')).toBeVisible({ timeout: 8000 });
    const challengeButtons = page.locator('button').filter({ has: page.locator('h3') });
    const count = await challengeButtons.count();
    expect.soft(count).toBeGreaterThan(0);
  });

  test('challenge cards show title and difficulty', async ({ page }) => {
    await waitForContent(page, 100);
    await page.waitForSelector('text=ALL CHALLENGES', { timeout: 8000 });

    // Each challenge row has a title (h3) and a difficulty badge
    const firstCard = page.locator('button').filter({ has: page.locator('h3') }).first();
    await expect.soft(firstCard).toBeVisible({ timeout: 5000 });

    const title = firstCard.locator('h3');
    await expect.soft(title).toBeVisible();
    const titleText = await title.textContent().catch(() => '');
    expect.soft(titleText?.length).toBeGreaterThan(0);

    // Difficulty badge: EASY or MEDIUM
    const badge = firstCard.locator('span').filter({ hasText: /^(EASY|MEDIUM)$/ }).first();
    await expect.soft(badge).toBeVisible();
  });

  test('clicking a challenge opens the editor', async ({ page }) => {
    await page.waitForSelector('text=ALL CHALLENGES', { timeout: 8000 });

    const firstCard = page.locator('button').filter({ has: page.locator('h3') }).first();
    await firstCard.click();

    // URL should change to /coding/<id>
    await expect(page).toHaveURL(/\/coding\/.+/, { timeout: 8000 });

    // Challenge header with title should appear
    await expect.soft(page.locator('header')).toBeVisible({ timeout: 5000 });
  });

  test('Monaco editor is rendered', async ({ page }) => {
    await page.waitForSelector('text=ALL CHALLENGES', { timeout: 8000 });
    const firstCard = page.locator('button').filter({ has: page.locator('h3') }).first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/coding\/.+/, { timeout: 8000 });

    // Monaco renders inside a .monaco-editor container
    const monacoEditor = page.locator('.monaco-editor').first();
    await expect.soft(monacoEditor).toBeVisible({ timeout: 15000 });
  });

  test('language selector (Python/JavaScript) is present', async ({ page }) => {
    await page.waitForSelector('text=ALL CHALLENGES', { timeout: 8000 });
    const firstCard = page.locator('button').filter({ has: page.locator('h3') }).first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/coding\/.+/, { timeout: 8000 });

    const langSelect = page.locator('select').first();
    await expect.soft(langSelect).toBeVisible({ timeout: 5000 });

    const jsOption = langSelect.locator('option[value="javascript"]');
    const pyOption = langSelect.locator('option[value="python"]');
    await expect.soft(jsOption).toHaveCount(1);
    await expect.soft(pyOption).toHaveCount(1);
  });

  test('run code button is visible', async ({ page }) => {
    await page.waitForSelector('text=ALL CHALLENGES', { timeout: 8000 });
    const firstCard = page.locator('button').filter({ has: page.locator('h3') }).first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/coding\/.+/, { timeout: 8000 });

    const runBtn = page.locator('button').filter({ hasText: /Run Tests/i }).first();
    await expect.soft(runBtn).toBeVisible({ timeout: 5000 });
  });

  test('problem description is shown alongside editor', async ({ page }) => {
    await page.waitForSelector('text=ALL CHALLENGES', { timeout: 8000 });
    const firstCard = page.locator('button').filter({ has: page.locator('h3') }).first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/coding\/.+/, { timeout: 8000 });

    // Left panel has a "Problem" heading
    const problemHeading = page.getByText('Problem', { exact: true }).first();
    await expect.soft(problemHeading).toBeVisible({ timeout: 5000 });

    // And an "Examples" heading
    const examplesHeading = page.getByText('Examples', { exact: true }).first();
    await expect.soft(examplesHeading).toBeVisible({ timeout: 5000 });
  });

  test('test cases section visible', async ({ page }) => {
    await page.waitForSelector('text=ALL CHALLENGES', { timeout: 8000 });
    const firstCard = page.locator('button').filter({ has: page.locator('h3') }).first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/coding\/.+/, { timeout: 8000 });

    // Examples section shows test case inputs/outputs
    await expect.soft(page.getByText('Examples', { exact: true }).first()).toBeVisible({ timeout: 5000 });

    // At least one example block with Input/Output labels
    const inputLabel = page.locator('span').filter({ hasText: /^Input:$/ }).first();
    await expect.soft(inputLabel).toBeVisible({ timeout: 5000 });
    const outputLabel = page.locator('span').filter({ hasText: /^Output:$/ }).first();
    await expect.soft(outputLabel).toBeVisible({ timeout: 5000 });
  });

  test('no overflow on coding challenges page', async ({ page }) => {
    await waitForContent(page, 100);
    await checkNoOverflow(page);
  });

  test('navigation back works', async ({ page }) => {
    await page.waitForSelector('text=ALL CHALLENGES', { timeout: 8000 });
    const firstCard = page.locator('button').filter({ has: page.locator('h3') }).first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/coding\/.+/, { timeout: 8000 });

    // Wait for challenge view header to appear
    await page.waitForSelector('header', { timeout: 5000 });

    // Click the ArrowLeft back button in the challenge header
    const backBtn = page.locator('header button').first();
    await backBtn.click();

    await expect(page).toHaveURL('/coding', { timeout: 5000 });
    await expect.soft(page.getByText('Coding Challenges')).toBeVisible({ timeout: 5000 });
  });
});
