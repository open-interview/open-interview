import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5000',
    headless: true,
    ignoreHTTPSErrors: true,
  },
  projects: [
    { name: 'Chromium', use: { browserName: 'chromium' } },
  ],
});
