import { test, expect } from '@playwright/test';

test.describe('Curated Paths Loading', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my-path');
    await page.waitForLoadState('networkidle');
  });

  test('should load curated paths from static JSON', async ({ page }) => {
    // Wait for JSON file to load
    const jsonResponse = await page.waitForResponse(
      response => response.url().includes('/data/learning-paths.json') && response.status() === 200,
      { timeout: 10000 }
    );
    
    const data = await jsonResponse.json();
    console.log('JSON Response:', {
      status: jsonResponse.status(),
      pathCount: data.length,
      samplePath: data[0] ? {
        id: data[0].id,
        title: data[0].title,
        pathType: data[0].pathType,
        channelsType: typeof data[0].channels,
        channelsValue: data[0].channels,
      } : null
    });
    
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('id');
    expect(data[0]).toHaveProperty('title');
    expect(data[0]).toHaveProperty('pathType');
  });

  test('should display curated paths section', async ({ page }) => {
    // Wait for the section to appear
    const curatedSection = page.locator('text=Curated Career Paths');
    await expect(curatedSection).toBeVisible({ timeout: 10000 });
  });

  test('should display at least one curated path card', async ({ page }) => {
    // Wait for JSON response
    await page.waitForResponse(
      response => response.url().includes('/data/learning-paths.json'),
      { timeout: 10000 }
    );
    
    // Wait a bit for React to render
    await page.waitForTimeout(2000);
    
    // Check if any path cards are rendered
    const pathCards = page.locator('.rounded-\\[24px\\]').filter({ hasText: /Frontend|Backend|AWS|Google|Kubernetes/ });
    const count = await pathCards.count();
    
    console.log('Path cards found:', count);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/curated-paths-debug.png', fullPage: true });
    
    expect(count).toBeGreaterThan(0);
  });

  test('should show correct path count in header', async ({ page }) => {
    // Wait for paths to load
    await page.waitForResponse(
      response => response.url().includes('/data/learning-paths.json'),
      { timeout: 10000 }
    );
    
    await page.waitForTimeout(1000);
    
    // Check the header text
    const header = page.locator('text=/\\d+ curated/');
    await expect(header).toBeVisible({ timeout: 5000 });
    
    const text = await header.textContent();
    console.log('Header text:', text);
    
    // Should show more than 0 curated paths
    expect(text).toMatch(/[1-9]\d* curated/);
  });

  test('should handle file not found gracefully', async ({ page }) => {
    // Intercept JSON file and return 404
    await page.route('**/data/learning-paths.json', route => {
      route.fulfill({
        status: 404,
        body: 'Not found'
      });
    });
    
    await page.goto('/my-path');
    await page.waitForLoadState('networkidle');
    
    // Should still show the section but with no paths
    const curatedSection = page.locator('text=Curated Career Paths');
    await expect(curatedSection).toBeVisible();
  });

  test('should log console errors', async ({ page }) => {
    const consoleMessages: string[] = [];
    const errors: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      if (msg.type() === 'error') {
        errors.push(text);
      }
    });
    
    await page.goto('/my-path');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('Console messages:', consoleMessages.filter(m => m.includes('curated') || m.includes('path')));
    console.log('Console errors:', errors);
    
    // Check for specific errors
    const hasParsingError = errors.some(e => e.includes('JSON') || e.includes('parse'));
    const hasNetworkError = errors.some(e => e.includes('fetch') || e.includes('Failed to load'));
    
    if (hasParsingError) {
      console.error('❌ JSON parsing error detected!');
    }
    if (hasNetworkError) {
      console.error('❌ Network error detected!');
    }
    
    expect(hasParsingError).toBe(false);
  });
});
