/**
 * E2E Tests: Visual Regression Suite
 * Comprehensive visual testing for all refactored views
 */

import { test, expect } from '@playwright/test';

const VIEWPORTS = {
  mobile: { width: 390, height: 844 }, // iPhone 13
  tablet: { width: 768, height: 1024 }, // iPad
  desktop: { width: 1920, height: 1080 }, // Desktop
};

test.describe('Visual Regression - All Views', () => {
  for (const [device, viewport] of Object.entries(VIEWPORTS)) {
    test.describe(`${device} viewport`, () => {
      test.use({ viewport });

      test('ReviewSessionOptimized - initial state', async ({ page }) => {
        await page.goto('/review');
        await page.waitForLoadState('networkidle');
        
        await expect(page).toHaveScreenshot(`review-session-${device}.png`, {
          maxDiffPixels: 100,
          fullPage: true,
        });
      });

      test('ExtremeQuestionViewer - browse mode', async ({ page }) => {
        await page.goto('/channel/react');
        await page.waitForLoadState('networkidle');
        
        await expect(page).toHaveScreenshot(`question-viewer-${device}.png`, {
          maxDiffPixels: 100,
          fullPage: true,
        });
      });

      test('TestSession - active test', async ({ page }) => {
        await page.goto('/test/react');
        await page.waitForLoadState('networkidle');
        
        await expect(page).toHaveScreenshot(`test-session-${device}.png`, {
          maxDiffPixels: 100,
          fullPage: true,
        });
      });

      test('VoiceInterview - question view', async ({ page }) => {
        await page.goto('/voice-interview');
        await page.waitForLoadState('networkidle');
        
        await expect(page).toHaveScreenshot(`voice-interview-${device}.png`, {
          maxDiffPixels: 100,
          fullPage: true,
        });
      });

      test('CodingChallenge - challenge list', async ({ page }) => {
        await page.goto('/coding');
        await page.waitForLoadState('networkidle');
        
        await expect(page).toHaveScreenshot(`coding-challenge-list-${device}.png`, {
          maxDiffPixels: 100,
          fullPage: true,
        });
      });
    });
  }
});

test.describe('Visual Regression - No Overlaps', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('should not have overlapping elements in ReviewSession', async ({ page }) => {
    await page.goto('/review');
    await page.waitForLoadState('networkidle');
    
    const overlaps = await checkForOverlaps(page);
    expect(overlaps).toBe(0);
  });

  test('should not have overlapping elements in TestSession', async ({ page }) => {
    await page.goto('/test/react');
    await page.waitForLoadState('networkidle');
    
    const overlaps = await checkForOverlaps(page);
    expect(overlaps).toBe(0);
  });

  test('should not have overlapping elements in VoiceInterview', async ({ page }) => {
    await page.goto('/voice-interview');
    await page.waitForLoadState('networkidle');
    
    const overlaps = await checkForOverlaps(page);
    expect(overlaps).toBe(0);
  });
});

test.describe('Visual Regression - No Cutoff', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('should not have horizontal cutoff in ReviewSession', async ({ page }) => {
    await page.goto('/review');
    await page.waitForLoadState('networkidle');
    
    const hasCutoff = await checkForHorizontalCutoff(page);
    expect(hasCutoff).toBe(false);
  });

  test('should not have horizontal cutoff in TestSession', async ({ page }) => {
    await page.goto('/test/react');
    await page.waitForLoadState('networkidle');
    
    const hasCutoff = await checkForHorizontalCutoff(page);
    expect(hasCutoff).toBe(false);
  });

  test('should not have horizontal cutoff in VoiceInterview', async ({ page }) => {
    await page.goto('/voice-interview');
    await page.waitForLoadState('networkidle');
    
    const hasCutoff = await checkForHorizontalCutoff(page);
    expect(hasCutoff).toBe(false);
  });

  test('should not have horizontal cutoff in CodingChallenge', async ({ page }) => {
    await page.goto('/coding');
    await page.waitForLoadState('networkidle');
    
    const hasCutoff = await checkForHorizontalCutoff(page);
    expect(hasCutoff).toBe(false);
  });
});

test.describe('Visual Regression - Compact Spacing', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('should have compact spacing in ReviewSession', async ({ page }) => {
    await page.goto('/review');
    await page.waitForLoadState('networkidle');
    
    const padding = await getContainerPadding(page);
    expect(padding).toBeLessThanOrEqual(16); // px-3 or less
  });

  test('should have compact spacing in TestSession', async ({ page }) => {
    await page.goto('/test/react');
    await page.waitForLoadState('networkidle');
    
    const padding = await getContainerPadding(page);
    expect(padding).toBeLessThanOrEqual(16);
  });

  test('should have compact spacing in VoiceInterview', async ({ page }) => {
    await page.goto('/voice-interview');
    await page.waitForLoadState('networkidle');
    
    const padding = await getContainerPadding(page);
    expect(padding).toBeLessThanOrEqual(16);
  });
});

test.describe('Visual Regression - Single Counter', () => {
  test('should have only one progress counter in ReviewSession', async ({ page }) => {
    await page.goto('/review');
    await page.waitForLoadState('networkidle');
    
    const counters = await page.locator('text=/\\d+\\s*\\/\\s*\\d+/').count();
    expect(counters).toBeLessThanOrEqual(1);
  });

  test('should have only one progress counter in TestSession', async ({ page }) => {
    await page.goto('/test/react');
    await page.waitForLoadState('networkidle');
    
    const counters = await page.locator('text=/\\d+\\s*\\/\\s*\\d+/').count();
    expect(counters).toBeLessThanOrEqual(1);
  });

  test('should have only one progress counter in VoiceInterview', async ({ page }) => {
    await page.goto('/voice-interview');
    await page.waitForLoadState('networkidle');
    
    const counters = await page.locator('text=/\\d+\\s*\\/\\s*\\d+/').count();
    expect(counters).toBeLessThanOrEqual(1);
  });
});

test.describe('Visual Regression - No Timers', () => {
  test('should have no timer in ReviewSession', async ({ page }) => {
    await page.goto('/review');
    await page.waitForLoadState('networkidle');
    
    const timers = await page.locator('text=/\\d+:\\d+/').count();
    expect(timers).toBe(0);
  });

  test('should have no timer in TestSession', async ({ page }) => {
    await page.goto('/test/react');
    await page.waitForLoadState('networkidle');
    
    const timers = await page.locator('text=/\\d+:\\d+/').count();
    expect(timers).toBe(0);
  });

  test('should have no timer in VoiceInterview', async ({ page }) => {
    await page.goto('/voice-interview');
    await page.waitForLoadState('networkidle');
    
    const timers = await page.locator('text=/\\d+:\\d+/').count();
    expect(timers).toBe(0);
  });

  test('should have no timer in CertificationExam', async ({ page }) => {
    await page.goto('/certification/aws-solutions-architect/exam');
    await page.waitForLoadState('networkidle');
    
    const timers = await page.locator('text=/\\d+:\\d+/').count();
    expect(timers).toBe(0);
  });
});

// Helper functions
async function checkForOverlaps(page: any): Promise<number> {
  return await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('button, a, input, select'));
    let overlapCount = 0;
    
    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const rect1 = elements[i].getBoundingClientRect();
        const rect2 = elements[j].getBoundingClientRect();
        
        const overlap = !(
          rect1.right < rect2.left ||
          rect2.right < rect1.left ||
          rect1.bottom < rect2.top ||
          rect2.bottom < rect1.top
        );
        
        if (overlap) {
          const overlapArea = 
            Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left) *
            Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top);
          
          if (overlapArea > 100) { // Significant overlap
            overlapCount++;
          }
        }
      }
    }
    
    return overlapCount;
  });
}

async function checkForHorizontalCutoff(page: any): Promise<boolean> {
  return await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'));
    const viewportWidth = window.innerWidth;
    
    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      if (rect.right > viewportWidth + 5) { // 5px tolerance
        return true;
      }
    }
    
    return false;
  });
}

async function getContainerPadding(page: any): Promise<number> {
  return await page.evaluate(() => {
    const container = document.querySelector('[class*="container"], main, .max-w');
    if (!container) return 0;
    
    const style = window.getComputedStyle(container);
    return parseInt(style.paddingLeft) || 0;
  });
}
