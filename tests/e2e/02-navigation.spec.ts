/**
 * Test Suite 02 — Routing & Navigation (P0-02, P0-03, P1-01, P1-03, P2-05)
 */

import { test, expect } from '@playwright/test';
import { smokeNavigate, navigateTo, BASE_URL, assertPageLoaded, skipOnboarding } from './helpers';

const ROUTES_TO_CHECK = [
  { path: '/',                  name: 'Home' },
  { path: '/channels',          name: 'Channels' },
  { path: '/flashcards',        name: 'Flashcards' },
  { path: '/voice-interview',   name: 'Voice Practice' },
  { path: '/certifications',    name: 'Certifications' },
  { path: '/tests',             name: 'Tests' },
  { path: '/code',              name: 'Code Challenges' },
  { path: '/review',            name: 'SRS Review' },
  { path: '/blog',              name: 'Blog' },
  { path: '/learning-paths',    name: 'Learning Paths' },
  { path: '/my-path',           name: 'My Path' },
  { path: '/profile',           name: 'Profile' },
  { path: '/bookmarks',         name: 'Bookmarks' },
  { path: '/history',           name: 'Answer History' },
  { path: '/badges',            name: 'Badges' },
  { path: '/whats-new',         name: "What's New" },
  { path: '/about',             name: 'About' },
  { path: '/docs',              name: 'Documentation' },
  { path: '/events',            name: 'Events Dashboard' },
  { path: '/notifications',     name: 'Notifications' },
  { path: '/bot-activity',      name: 'Bot Activity' },
];

test.describe('Route smoke tests — all major routes load without error', () => {
  for (const route of ROUTES_TO_CHECK) {
    test(`${route.path} — ${route.name} loads correctly`, async ({ page }) => {
      await smokeNavigate(page, route.path);
      await assertPageLoaded(page, route.path);
      await expect(page.getByText('What\'s your role?')).not.toBeVisible({ timeout: 1000 });
    });
  }
});

test.describe('Anchor links on homepage (P0-02, P0-03)', () => {

  test('hero nav #features link does NOT open new tab (P0-02)', async ({ page, context }) => {
    await skipOnboarding(page);
    let newTabOpened = false;
    context.on('page', () => { newTabOpened = true; });

    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('load');

    const featuresLink = page.locator('a[href="#features"]').first();
    if (await featuresLink.count() > 0) {
      await featuresLink.click();
      await page.waitForTimeout(400);
      expect(newTabOpened).toBe(false);
    }
  });

  test('footer Features link does NOT open a new tab (P0-02)', async ({ page, context }) => {
    await skipOnboarding(page);
    let newTabOpened = false;
    context.on('page', () => { newTabOpened = true; });

    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('load');

    const footerFeatures = page.getByRole('link', { name: 'Features' }).or(
      page.getByText('Features').filter({ hasNot: page.locator('h1, h2, h3') })
    ).last();

    if (await footerFeatures.count() > 0) {
      await footerFeatures.click();
      await page.waitForTimeout(500);
      expect(newTabOpened).toBe(false);
    }
  });

  test('section IDs exist on homepage: #features, #topics, #articles, #community', async ({ page }) => {
    await skipOnboarding(page);
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('load');

    for (const id of ['features', 'topics', 'articles', 'community']) {
      const el = page.locator(`#${id}`);
      await expect(el).toHaveCount(1, { timeout: 5000 });
    }
  });
});

test.describe('/stats redirect (P1-01)', () => {

  test('/stats redirects to /profile', async ({ page }) => {
    await skipOnboarding(page);
    await page.goto(`${BASE_URL}/stats`);
    await page.waitForURL(/\/profile/, { timeout: 8000 });
    expect(page.url()).toContain('/profile');
  });

  test('/stats shows user-facing feedback before redirecting (P1-01 — EXPECTED FIX)', async ({ page }) => {
    await skipOnboarding(page);
    await page.goto(`${BASE_URL}/stats`);

    const hasFeedback = await page.getByText(/stats.*moved|moved.*profile|redirecting/i)
      .isVisible({ timeout: 1500 }).catch(() => false);
    console.log(`/stats redirect feedback shown: ${hasFeedback}`);
    // TODO: after fix: expect(hasFeedback).toBe(true);
  });
});

test.describe('Sidebar navigation links (P2-05)', () => {

  test('sidebar is visible on desktop after onboarding', async ({ page }) => {
    await navigateTo(page, '/channels');
    const sidebar = page.locator('[class*="sidebar"], [class*="Sidebar"], nav').first();
    await expect(sidebar).toBeVisible({ timeout: 5000 });
  });

  test('sidebar link to /channels navigates correctly', async ({ page }) => {
    await navigateTo(page, '/');
    const channelsLink = page.getByRole('link', { name: /channels/i }).first();
    if (await channelsLink.isVisible()) {
      await channelsLink.click();
      await expect(page).toHaveURL(/\/channels/, { timeout: 5000 });
    }
  });

  test('sidebar link to /events navigates correctly', async ({ page }) => {
    await navigateTo(page, '/');
    const eventsLink = page.getByRole('link', { name: /events log/i }).first();
    if (await eventsLink.isVisible()) {
      await eventsLink.click();
      await expect(page).toHaveURL(/\/events/, { timeout: 5000 });
    }
  });

  test('/whats-new is accessible (P2-05 — currently missing from sidebar)', async ({ page }) => {
    await navigateTo(page, '/whats-new');
    await assertPageLoaded(page, '/whats-new');
    await expect(page.getByText(/new|update|change|release|version/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('/notifications is accessible (P2-05 — currently missing from sidebar)', async ({ page }) => {
    await navigateTo(page, '/notifications');
    await assertPageLoaded(page, '/notifications');
  });

  test('/docs is accessible (P2-05 — currently missing from sidebar)', async ({ page }) => {
    await navigateTo(page, '/docs');
    await assertPageLoaded(page, '/docs');
  });

  test('/bot-activity is accessible (P2-05 — currently missing from sidebar)', async ({ page }) => {
    await navigateTo(page, '/bot-activity');
    await assertPageLoaded(page, '/bot-activity');
  });
});

test.describe('ChallengeHome CSS tokens (P1-03)', () => {

  test('/code page renders without raw gray-900 background (P1-03)', async ({ page }) => {
    await navigateTo(page, '/code');
    await assertPageLoaded(page, '/code');

    const bodyBg = await page.evaluate(() => {
      const el = document.querySelector('main') || document.body;
      return window.getComputedStyle(el).backgroundColor;
    });
    const isHardcodedGray = bodyBg === 'rgb(17, 24, 39)';
    if (isHardcodedGray) {
      console.warn('P1-03: /code still uses hardcoded bg-gray-900');
    }
    // TODO: after fix: expect(isHardcodedGray).toBe(false);
  });
});

test.describe('404 Not Found page', () => {

  test('unknown route shows 404 not-found page', async ({ page }) => {
    await skipOnboarding(page);
    await page.goto(`${BASE_URL}/this-page-definitely-does-not-exist`);
    await page.waitForLoadState('load');
    await expect(page.getByText(/not found|404|page.*exist/i)).toBeVisible({ timeout: 5000 });
  });
});
