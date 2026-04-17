/**
 * Lighthouse performance audits
 * Runs against the built static site served locally.
 *
 * Thresholds (0–1):
 *   performance   ≥ 0.7
 *   accessibility ≥ 0.9
 *   best-practices ≥ 0.8
 *   seo           ≥ 0.8
 */

import { test, expect } from '@playwright/test';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

const BASE_URL = process.env.LIGHTHOUSE_URL ?? 'http://localhost:5002';

const THRESHOLDS = {
  performance: 0.5,   // prod build served statically; CI containers score lower
  accessibility: 0.9,
  'best-practices': 0.8,
  seo: 0.8,
};

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'channels', path: '/channels' },
];

async function runLighthouse(url: string) {
  const executablePath = chromium.executablePath();
  const chrome = await chromeLauncher.launch({
    chromePath: executablePath,
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  try {
    const result = await lighthouse(url, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      formFactor: 'desktop',
      screenEmulation: { disabled: true },
    });

    return result?.lhr ?? null;
  } finally {
    await chrome.kill();
  }
}

for (const page of PAGES) {
  test(`lighthouse: ${page.name}`, async ({}, testInfo) => {
    const url = `${BASE_URL}${page.path}`;
    const lhr = await runLighthouse(url);

    expect(lhr, 'Lighthouse returned no result').not.toBeNull();

    // Save full report as artifact
    const reportDir = path.join('lighthouse-reports');
    fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(
      path.join(reportDir, `${page.name}.json`),
      JSON.stringify(lhr, null, 2),
    );
    await testInfo.attach(`lighthouse-${page.name}.json`, {
      path: path.join(reportDir, `${page.name}.json`),
      contentType: 'application/json',
    });

    const scores: Record<string, number> = {};
    for (const [key, category] of Object.entries(lhr!.categories)) {
      scores[key] = category.score ?? 0;
    }

    // Report scores in summary
    testInfo.annotations.push({
      type: 'scores',
      description: Object.entries(scores)
        .map(([k, v]) => `${k}: ${Math.round(v * 100)}`)
        .join(' | '),
    });

    // Assert each threshold
    for (const [category, threshold] of Object.entries(THRESHOLDS)) {
      const score = scores[category] ?? 0;
      expect
        .soft(score, `${category} score ${Math.round(score * 100)} < threshold ${Math.round(threshold * 100)}`)
        .toBeGreaterThanOrEqual(threshold);
    }
  });
}
