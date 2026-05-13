import { defineConfig, devices } from '@playwright/test';

/**
 * Optimized Playwright Configuration
 * - Parallel execution for speed
 * - Mobile-first testing (iPhone 13)
 * - Performance monitoring
 * - Accessibility testing
 */

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 4 : 4,
  
  // Enhanced reporting
  reporter: process.env.CI 
    ? [
        ['line'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
      ]
    : [
        ['html', { open: 'on-failure' }],
        ['list'],
      ],
  
  // Timeouts — pages load many JSON files in background; 'load' state is used throughout
  timeout: 45000, // 45s per test
  expect: {
    timeout: 8000, // 8s for assertions
  },
  
  use: {
    baseURL: 'http://localhost:5000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 20000,
    
    // Performance optimizations
    launchOptions: {
      args: [
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
      ],
    },
  },
  
  outputDir: 'test-results',
  
  projects: [
    // Desktop Chrome - Primary (ONLY THIS FOR SPEED)
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
      testMatch: /.*\.(spec|test)\.ts$/,
      // Temporarily ignore slow/problematic tests
      testIgnore: [
        '**/mobile-only.spec.ts',
      ],
    },
    
    // Lighthouse performance audits — runs against built/served app
    {
      name: 'lighthouse',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/lighthouse.spec.ts',
      timeout: 120_000, // Lighthouse takes ~30-60s per page
    },

    // iPhone 13 UI Audit - Separate project for mobile testing
    {
      name: 'iphone13-audit',
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
      testMatch: '**/iphone13-ui-audit.spec.ts',
    },

    // Audit project — accessibility, contrast, keyboard, Lighthouse
    // Previously silently ignored in chromium-desktop; now explicitly targeted
    {
      name: 'audit',
      use: { ...devices['Desktop Chrome'] },
      testMatch: [
        '**/aria-audit.spec.ts',
        '**/screen-reader-audit.spec.ts',
        '**/keyboard-navigation-audit.spec.ts',
        '**/color-contrast-audit.spec.ts',
        '**/touch-target-audit.spec.ts',
        '**/reduced-motion.spec.ts',
        '**/custom-checks.spec.ts',
        '**/about.spec.ts',
        '**/answer-panel-theme.spec.ts',
        '**/audit-engine.spec.ts',
        '**/blog-a11y.spec.ts',
      ],
    },
  ],
  
  webServer: {
    command: 'pnpm run dev:server',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  
  // Global setup/teardown
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
});
