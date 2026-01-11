import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'html',
  timeout: 20000, // Reduced from 30s
  expect: {
    timeout: 5000, // Reduced from 10s
  },
  use: {
    baseURL: 'http://localhost:5001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10000, // Reduced from 15s
    navigationTimeout: 20000, // Reduced from 30s
    // Optimize for speed
    video: 'off',
    launchOptions: {
      args: ['--disable-gpu', '--no-sandbox'],
    },
  },
  outputDir: 'test-results',
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
      testIgnore: ['**/mobile.spec.ts'],
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
        hasTouch: true,
      },
      testIgnore: ['**/mobile.spec.ts'],
    },
  ],
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:5001',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
