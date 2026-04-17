import { test, expect, setupUser, waitForPageReady } from './fixtures';

test.describe('Performance & PWA', () => {
  test('home page loads within 5 seconds', async ({ page }) => {
    await setupUser(page);
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const elapsed = Date.now() - start;
    expect.soft(elapsed).toBeLessThan(5000);
  });

  test('no JavaScript errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await setupUser(page);
    await page.goto('/');
    await waitForPageReady(page);
    expect.soft(errors).toHaveLength(0);
  });

  test('manifest.json is accessible', async ({ page }) => {
    const response = await page.request.get('/manifest.json');
    expect.soft(response.status()).toBe(200);
    const body = await response.json().catch(() => null);
    expect.soft(body).not.toBeNull();
    expect.soft(body?.name || body?.short_name).toBeTruthy();
  });

  test('service worker registers successfully', async ({ page }) => {
    await setupUser(page);
    await page.goto('/');
    await waitForPageReady(page);

    const swResponse = await page.request.get('/sw.js');
    expect.soft(swResponse.status()).toBe(200);

    const registered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      try {
        const reg = await navigator.serviceWorker.getRegistration('/');
        return !!reg;
      } catch {
        return false;
      }
    });
    expect.soft(registered).toBe(true);
  });

  test('critical resources load (CSS, JS)', async ({ page }) => {
    const failed: string[] = [];
    page.on('response', (res) => {
      const url = res.url();
      if ((url.endsWith('.css') || url.endsWith('.js')) && res.status() >= 400) {
        failed.push(`${res.status()} ${url}`);
      }
    });
    await setupUser(page);
    await page.goto('/');
    await page.waitForLoadState('load');
    expect.soft(failed).toHaveLength(0);
  });

  test('images load without 404 errors', async ({ page }) => {
    const broken: string[] = [];
    page.on('response', (res) => {
      const url = res.url();
      if (/\.(png|jpg|jpeg|gif|svg|webp|ico)(\?.*)?$/.test(url) && res.status() === 404) {
        broken.push(url);
      }
    });
    await setupUser(page);
    await page.goto('/');
    await page.waitForLoadState('load');
    expect.soft(broken).toHaveLength(0);
  });

  test('no console errors on channels page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    await setupUser(page);
    await page.goto('/channels');
    await waitForPageReady(page);
    expect.soft(errors).toHaveLength(0);
  });

  test('no console errors on voice interview page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    await setupUser(page);
    await page.goto('/voice-interview');
    await waitForPageReady(page);
    expect.soft(errors).toHaveLength(0);
  });

  test('page title is set correctly', async ({ page }) => {
    await setupUser(page);
    await page.goto('/');
    await waitForPageReady(page);
    const title = await page.title();
    expect.soft(title.length).toBeGreaterThan(0);
    expect.soft(title).not.toBe('');
  });

  test('meta description exists', async ({ page }) => {
    await setupUser(page);
    await page.goto('/');
    await waitForPageReady(page);
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute('content')
      .catch(() => null);
    expect.soft(description).toBeTruthy();
  });

  test('favicon loads', async ({ page }) => {
    const response = await page.request.get('/favicon.ico').catch(() => null);
    const ok = response ? response.status() < 400 : false;
    expect.soft(ok).toBe(true);
  });

  test('404 page exists and renders', async ({ page }) => {
    await setupUser(page);
    await page.goto('/this-route-does-not-exist-404xyz');
    await waitForPageReady(page);
    const bodyText = await page.locator('body').textContent().catch(() => '');
    const has404Content =
      (bodyText?.includes('404') ||
        bodyText?.includes('Not Found') ||
        bodyText?.includes('not found') ||
        bodyText?.includes("doesn't exist")) ??
      false;
    expect.soft(has404Content).toBe(true);
  });
});
