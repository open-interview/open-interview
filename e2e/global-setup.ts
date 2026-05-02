/**
 * Global Setup for E2E Tests
 * Runs once before all tests.
 *
 * Uses 'load' (not 'networkidle') to avoid waiting for the many lazy
 * JSON fetches the app makes for channel data, which take 20–30s.
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');

  const baseURL = config.use?.baseURL || 'http://localhost:5000';
  console.log(`⏳ Waiting for server at ${baseURL}...`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the server to respond — use 'load' not 'networkidle'
    await page.goto(baseURL, { waitUntil: 'load', timeout: 60000 });
    console.log('✅ Server is ready');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('✅ Global setup complete\n');
}

export default globalSetup;
