const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });
  
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });
  
  try {
    await page.goto('http://localhost:5173/review', { waitUntil: 'networkidle' });
    
    const title = await page.title();
    console.log('PAGE_TITLE:', title);
    
    await page.screenshot({ path: '/tmp/review-page.png' });
    console.log('SCREENSHOT: /tmp/review-page.png');
    
    const bodyText = await page.locator('body').innerText();
    const hasChipText = bodyText.match(/channel|filter|chip|tag/i) !== null;
    
    console.log('CHANNEL_FILTER_CHIPS_VISIBLE:', hasChipText ? 'YES' : 'NO');
    
    console.log('\n--- CONSOLE MESSAGES ---');
    consoleMessages.forEach(m => console.log(`[${m.type}] ${m.text}`));
    
    console.log('\n--- PAGE ERRORS ---');
    if (pageErrors.length === 0) {
      console.log('No page errors');
    } else {
      pageErrors.forEach(e => console.log(e));
    }
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
})();