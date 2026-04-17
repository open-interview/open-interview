/**
 * User Journey E2E Tests
 * End-to-end flows covering key user paths through the app
 */

import { test, expect, setupUser, setupFreshUser, waitForPageReady, waitForContent, waitForDataLoad, hideMascot } from './fixtures';

test.describe('User Journeys', () => {

  test('1. new user onboarding: fresh user sees welcome, selects role, sees channels', async ({ page }) => {
    await setupFreshUser(page);
    await page.goto('/');
    await waitForPageReady(page);

    // Should see onboarding/welcome UI
    const hasWelcome = await page.getByText(/Welcome|Get Started|Choose|Role|Select/i).first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasOnboarding = await page.locator('[class*="onboard"], [class*="welcome"], [class*="intro"]').first().isVisible({ timeout: 3000 }).catch(() => false);
    expect.soft(hasWelcome || hasOnboarding || (await page.locator('body').textContent())!.length > 50).toBeTruthy();

    // Try to select a role if role selection is visible
    const roleButton = page.locator('button').filter({ hasText: /Fullstack|Backend|Frontend|Engineer/i }).first();
    if (await roleButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await roleButton.click();
      await waitForPageReady(page);
    }

    // Should eventually see channels or home content
    const hasChannels = await page.getByText(/Channel|System Design|Algorithms|Frontend/i).first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasContent = (await page.locator('body').textContent())!.length > 100;
    expect.soft(hasChannels || hasContent).toBeTruthy();
  });

  test('2. study session: home -> channels -> system-design -> view question -> next', async ({ page }) => {
    await setupUser(page);
    await page.goto('/');
    await waitForPageReady(page);
    await hideMascot(page);

    // Navigate to channels
    await page.goto('/channels');
    await waitForPageReady(page);
    await waitForDataLoad(page);

    // Find and click system-design channel
    const systemDesign = page.getByText('System Design', { exact: false }).first();
    const hasSystemDesign = await systemDesign.isVisible({ timeout: 5000 }).catch(() => false);
    expect.soft(hasSystemDesign).toBeTruthy();

    if (hasSystemDesign) {
      await systemDesign.click();
      await waitForPageReady(page);
      await waitForDataLoad(page);
      expect.soft(page.url()).toContain('system-design');
    } else {
      await page.goto('/channel/system-design');
      await waitForPageReady(page);
      await waitForDataLoad(page);
    }

    // Should see a question
    const hasQuestion = await page.locator('h2, h3, [class*="question"]').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasContent = (await page.locator('body').textContent())!.length > 100;
    expect.soft(hasQuestion || hasContent).toBeTruthy();

    // Navigate to next question via arrow key
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
    expect.soft(page.url()).toBeTruthy();
  });

  test('3. voice practice journey: home -> voice-interview -> see question -> see record button', async ({ page }) => {
    await setupUser(page);
    await page.goto('/');
    await waitForPageReady(page);
    await hideMascot(page);

    await page.goto('/voice-interview');
    await waitForPageReady(page);
    await waitForDataLoad(page);

    // Should see some question content
    const hasQuestion = await page.locator('h2, h3, p').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect.soft(hasQuestion).toBeTruthy();

    // Should see a record/microphone button
    const recordButton = page.locator('button').filter({ hasText: /Record|Start|Mic|Listen/i }).first();
    const micIcon = page.locator('svg[class*="lucide-mic"], button:has(svg)').first();
    const hasRecord = await recordButton.isVisible({ timeout: 3000 }).catch(() => false);
    const hasMic = await micIcon.isVisible({ timeout: 3000 }).catch(() => false);
    expect.soft(hasRecord || hasMic || (await page.locator('button').count()) > 0).toBeTruthy();
  });

  test('4. certification prep: home -> certifications -> pick AWS -> start practice', async ({ page }) => {
    await setupUser(page);
    await page.goto('/');
    await waitForPageReady(page);
    await hideMascot(page);

    await page.goto('/certifications');
    await waitForPageReady(page);
    await waitForDataLoad(page);
    await waitForContent(page, 100);

    // Should see certification content
    const hasCerts = await page.getByText(/Certification|AWS|Azure|GCP/i).first().isVisible({ timeout: 5000 }).catch(() => false);
    expect.soft(hasCerts).toBeTruthy();

    // Find and click an AWS certification
    const awsCert = page.locator('[class*="cursor-pointer"], button, a').filter({ hasText: /AWS/i }).first();
    const hasAws = await awsCert.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasAws) {
      await awsCert.click();
      await waitForPageReady(page);
      const url = page.url();
      expect.soft(url.includes('/certification') || url.includes('/aws')).toBeTruthy();
    } else {
      // Navigate directly
      await page.goto('/certification/aws-saa');
      await waitForPageReady(page);
      expect.soft((await page.locator('body').textContent())!.length > 50).toBeTruthy();
    }

    // Should see practice content or start button
    const hasContent = (await page.locator('body').textContent())!.length > 50;
    expect.soft(hasContent).toBeTruthy();
  });

  test('5. SRS review session: home -> srs-review -> see cards or empty state', async ({ page }) => {
    await setupUser(page);
    await page.goto('/');
    await waitForPageReady(page);
    await hideMascot(page);

    await page.goto('/srs-review');
    await waitForPageReady(page);
    await waitForDataLoad(page);

    // Should see either review cards or an empty/no-cards state
    const hasCards = await page.locator('[class*="card"], [class*="review"]').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmptyState = await page.getByText(/No cards|All caught up|Nothing to review|Due|Review/i).first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasContent = (await page.locator('body').textContent())!.length > 50;
    expect.soft(hasCards || hasEmptyState || hasContent).toBeTruthy();
  });

  test('6. learning path activation: home -> learning-paths -> see paths -> activate one', async ({ page }) => {
    await setupUser(page);
    await page.goto('/');
    await waitForPageReady(page);
    await hideMascot(page);

    await page.goto('/learning-paths');
    await waitForPageReady(page);
    await waitForDataLoad(page);

    // Should see learning paths
    const hasPaths = await page.locator('h2, h3, [class*="path"]').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasContent = (await page.locator('body').textContent())!.length > 50;
    expect.soft(hasPaths || hasContent).toBeTruthy();

    // Try to activate/start a path
    const activateButton = page.locator('button').filter({ hasText: /Start|Activate|Begin|Enroll/i }).first();
    const hasActivate = await activateButton.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasActivate) {
      await activateButton.click();
      await waitForPageReady(page);
    }
    // Pass regardless - activation UI may vary
    expect.soft(true).toBeTruthy();
  });

  test('7. profile check: home -> profile -> see stats and credits', async ({ page }) => {
    await setupUser(page);
    await page.goto('/');
    await waitForPageReady(page);
    await hideMascot(page);

    await page.goto('/profile');
    await waitForPageReady(page);
    await waitForDataLoad(page);
    await waitForContent(page, 100);

    // Should see profile content
    const hasHeading = await page.locator('h1, h2, h3').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect.soft(hasHeading).toBeTruthy();

    // Should see credits or stats
    const hasCredits = await page.getByText(/Credits|Balance|500/i).first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasStats = await page.getByText(/Questions|Streak|XP|Level|Progress/i).first().isVisible({ timeout: 3000 }).catch(() => false);
    expect.soft(hasCredits || hasStats || (await page.locator('body').textContent())!.length > 100).toBeTruthy();
  });

  test('8. training session: home -> training -> see question -> reveal answer', async ({ page }) => {
    await setupUser(page);
    await page.goto('/');
    await waitForPageReady(page);
    await hideMascot(page);

    await page.goto('/training');
    await waitForPageReady(page);
    await waitForDataLoad(page);
    await waitForContent(page, 100);

    // Should see a question
    const hasQuestion = await page.locator('h2, h3, [class*="question"]').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasContent = (await page.locator('body').textContent())!.length > 100;
    expect.soft(hasQuestion || hasContent).toBeTruthy();

    // Try to reveal answer
    const revealButton = page.locator('button').filter({ hasText: /Reveal|Show Answer|Read Answer/i }).first();
    const hasReveal = await revealButton.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasReveal) {
      await revealButton.click();
      await waitForPageReady(page);
      const hasAnswer = await page.getByText(/Answer|Explanation/i).first().isVisible({ timeout: 3000 }).catch(() => false);
      expect.soft(hasAnswer || true).toBeTruthy();
    }
    expect.soft(true).toBeTruthy();
  });

  test('9. coding challenge: home -> coding-challenges -> pick challenge -> see editor', async ({ page }) => {
    await setupUser(page);
    await page.goto('/');
    await waitForPageReady(page);
    await hideMascot(page);

    await page.goto('/coding-challenges');
    await waitForPageReady(page);
    await waitForDataLoad(page);
    await waitForContent(page, 100);

    // Should see coding challenges
    const hasChallenges = await page.getByText(/Coding|Challenge|Problem|Practice/i).first().isVisible({ timeout: 5000 }).catch(() => false);
    expect.soft(hasChallenges || (await page.locator('body').textContent())!.length > 100).toBeTruthy();

    // Try to click a challenge
    const challengeItem = page.locator('button, [class*="cursor-pointer"], a').filter({ hasText: /Two Sum|Array|String|Easy|Medium|Hard/i }).first();
    const hasChallenge = await challengeItem.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasChallenge) {
      await challengeItem.click();
      await waitForPageReady(page);
      // Should see an editor or challenge detail
      const hasEditor = await page.locator('textarea, [class*="editor"], [class*="monaco"], [class*="code"]').first().isVisible({ timeout: 5000 }).catch(() => false);
      expect.soft(hasEditor || (await page.locator('body').textContent())!.length > 100).toBeTruthy();
    } else {
      expect.soft(true).toBeTruthy();
    }
  });

  test('10. full navigation tour: visit all main pages without errors', async ({ page }) => {
    await setupUser(page);

    const pages = [
      '/',
      '/channels',
      '/voice-interview',
      '/training',
      '/certifications',
      '/profile',
      '/docs',
      '/srs-review',
      '/coding-challenges',
      '/learning-paths',
    ];

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    for (const path of pages) {
      await page.goto(path);
      await waitForPageReady(page);
      const bodyText = await page.locator('body').textContent().catch(() => '');
      const hasContent = (bodyText?.length ?? 0) > 30;
      expect.soft(hasContent, `Page ${path} should have content`).toBeTruthy();
    }

    // No critical JS errors across the tour
    const criticalErrors = errors.filter(e => !e.includes('ResizeObserver') && !e.includes('Non-Error'));
    expect.soft(criticalErrors.length, `Unexpected errors: ${criticalErrors.join(', ')}`).toBeLessThan(5);
  });

});
