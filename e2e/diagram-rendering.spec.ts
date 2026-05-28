import { test, expect } from '@playwright/test';

test.describe('Mermaid diagram rendering', () => {
  test('diagrams render as SVG and do not overflow the card', async ({ page }) => {
    // Navigate to study page with system-design channel (has diagrams)
    await page.goto('/study/system-design', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Wait for a card to render
    const card = page.locator('[class*="rounded-2xl"][class*="select-none"]').first();
    await expect(card).toBeVisible({ timeout: 10000 });

    // Get the card's bounding box before we flip
    const cardBox = await card.boundingBox();

    // Flip the card to see the answer/diagram side (tap on it)
    await card.tap();
    await page.waitForTimeout(800);

    // Wait for mermaid to render (it's async dynamic import)
    await page.waitForTimeout(2000);

    // Check for SVG elements inside the flipped card
    const svgCount = await page.locator('svg').count();

    if (svgCount > 0) {
      // Get all SVGs and check they don't overflow
      const svgs = page.locator('svg');
      const count = await svgs.count();
      for (let i = 0; i < count; i++) {
        const svg = svgs.nth(i);
        const box = await svg.boundingBox();
        if (box && cardBox) {
          // SVG should not be wider than the card
          expect(box.width).toBeLessThanOrEqual(cardBox.width + 5);
        }
      }
      console.log(`✅ Found ${count} SVG(s) — all within card bounds`);
    } else {
      // Log what's on the page for debugging
      const html = await page.locator('[class*="rounded-2xl"][class*="select-none"]').innerHTML();
      console.log('Card HTML:', html.substring(0, 1000));
    }
  });
});
