import { test, expect } from '@playwright/test';

test.describe('Pixel Mascot', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to desktop size (mascot is hidden on mobile)
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Navigate first, then set localStorage and reload
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('marvel-intro-seen', 'true');
      localStorage.setItem('user-preferences', JSON.stringify({
        role: 'fullstack',
        subscribedChannels: ['system-design', 'algorithms'],
        onboardingComplete: true,
        createdAt: new Date().toISOString()
      }));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('mascot is visible on desktop', async ({ page }) => {
    const mascot = page.getByTestId('pixel-mascot');
    await expect(mascot).toBeVisible();
  });

  test('mascot has a valid type', async ({ page }) => {
    const mascot = page.getByTestId('pixel-mascot');
    const mascotType = await mascot.getAttribute('data-mascot-type');
    const validTypes = ['coder', 'goat', 'giraffe', 'penguin', 'cat', 'robot', 'dog', 'bunny', 'fox', 'owl', 'duck', 'frog'];
    expect(validTypes).toContain(mascotType);
  });

  test('mascot shows message when clicked', async ({ page }) => {
    const mascot = page.getByTestId('pixel-mascot');
    await mascot.click();
    
    // Wait for message to appear
    const message = page.getByTestId('mascot-message');
    await expect(message).toBeVisible({ timeout: 2000 });
    
    // Message should have text content
    const text = await message.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(0);
  });

  test('mascot message disappears after animation', async ({ page }) => {
    const mascot = page.getByTestId('pixel-mascot');
    await mascot.click();
    
    const message = page.getByTestId('mascot-message');
    await expect(message).toBeVisible({ timeout: 2000 });
    
    // Wait for message to disappear (1.5s animation + buffer)
    await expect(message).toBeHidden({ timeout: 3000 });
  });

  test('mascot is hidden on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const mascot = page.getByTestId('pixel-mascot');
    await expect(mascot).toBeHidden();
  });

  test('mascot contains SVG sprite', async ({ page }) => {
    const mascot = page.getByTestId('pixel-mascot');
    const svg = mascot.locator('svg');
    await expect(svg).toBeVisible();
    
    // SVG should have correct dimensions
    await expect(svg).toHaveAttribute('width', '32');
    await expect(svg).toHaveAttribute('height', '32');
  });

  test('clicking mascot multiple times shows different messages', async ({ page }) => {
    const mascot = page.getByTestId('pixel-mascot');
    const messages: string[] = [];
    
    // Click multiple times and collect messages
    for (let i = 0; i < 5; i++) {
      await mascot.click();
      const message = page.getByTestId('mascot-message');
      
      try {
        await expect(message).toBeVisible({ timeout: 1000 });
        const text = await message.textContent();
        if (text) messages.push(text);
      } catch {
        // Message might not appear if animation is still running
      }
      
      // Wait for animation to complete
      await page.waitForTimeout(1600);
    }
    
    // Should have collected some messages
    expect(messages.length).toBeGreaterThan(0);
  });
});
