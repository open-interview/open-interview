#!/usr/bin/env node

/**
 * Test history button on actual question pages
 */

import { chromium } from 'playwright';

async function testHistoryOnQuestionPage() {
  console.log('\n🔍 Testing History on Question Pages\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Go to home page first
    console.log('📡 Loading home page...');
    await page.goto('http://localhost:5001', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    await page.waitForTimeout(2000);
    
    // Look for a channel to click
    console.log('📊 Looking for channels...');
    const channelButtons = await page.$$('button:has-text("Practice"), a:has-text("Practice")');
    
    if (channelButtons.length > 0) {
      console.log(`Found ${channelButtons.length} channel buttons`);
      console.log('Clicking first channel...');
      await channelButtons[0].click();
      await page.waitForTimeout(3000);
      
      // Now look for history buttons
      console.log('\n📊 Looking for history buttons on question page...');
      const historyButtons = await page.$$('button');
      
      let historyButtonCount = 0;
      for (const btn of historyButtons) {
        const title = await btn.getAttribute('title');
        const text = await btn.textContent();
        if (title?.includes('history') || title?.includes('History') || text?.includes('history')) {
          historyButtonCount++;
          console.log(`  Found history button: title="${title}", text="${text?.trim()}"`);
        }
      }
      
      console.log(`\nTotal history buttons found: ${historyButtonCount}`);
      
      if (historyButtonCount > 0) {
        // Find and click a history button
        const historyBtn = await page.$('button[title*="history"], button[title*="History"]');
        if (historyBtn) {
          console.log('\n📊 Clicking history button...');
          await historyBtn.click();
          await page.waitForTimeout(2000);
          
          // Check if modal opened
          const modalText = await page.evaluate(() => {
            return document.body.textContent;
          });
          
          if (modalText.includes('Question History')) {
            console.log('✅ History modal opened!');
            if (modalText.includes('No History Available')) {
              console.log('⚠️  But shows "No History Available"');
            } else {
              console.log('✅ History data is displayed!');
            }
          } else {
            console.log('❌ History modal did not open');
          }
        }
      } else {
        console.log('\n⚠️  No history buttons found on question page');
        
        // Take screenshot for debugging
        await page.screenshot({ path: 'test-results/no-history-buttons.png' });
        console.log('📸 Screenshot saved to test-results/no-history-buttons.png');
      }
    } else {
      console.log('❌ No channel buttons found');
    }
    
    console.log('\nKeeping browser open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testHistoryOnQuestionPage().catch(console.error);
