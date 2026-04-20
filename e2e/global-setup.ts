/**
 * Global Setup for E2E Tests
 * Runs once before all tests
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for server to be ready
    const baseURL = config.use?.baseURL || 'http://localhost:5000';
    console.log(`⏳ Waiting for server at ${baseURL}...`);
    
    await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 60000 });
    console.log('✅ Server is ready');

    // Pre-warm cache by visiting key pages
    console.log('🔥 Pre-warming cache...');
    await page.goto(`${baseURL}/channels`);
    await page.goto(`${baseURL}/channel/react`);
    console.log('✅ Cache pre-warmed');

    // Clear any existing test data
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    console.log('✅ Test data cleared');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('✅ Global setup complete\n');
}

export default globalSetup;
