#!/usr/bin/env node

/**
 * Test if question history is loading correctly in the browser
 */

import { chromium } from 'playwright';

async function testHistoryLoading() {
  console.log('\n🔍 Testing Question History Loading\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      console.log(`[Browser ${type}]:`, msg.text());
    }
  });
  
  // Listen for network failures
  page.on('requestfailed', request => {
    console.log(`❌ Request failed: ${request.url()}`);
    console.log(`   Failure: ${request.failure()?.errorText}`);
  });
  
  try {
    console.log('📡 Loading page...');
    await page.goto('http://localhost:5001', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    await page.waitForTimeout(2000);
    
    console.log('✅ Page loaded\n');
    
    // Test fetching history index
    console.log('📊 Testing history index fetch...');
    const indexResponse = await page.evaluate(async () => {
      try {
        const res = await fetch('/data/history/index.json');
        if (!res.ok) {
          return { success: false, status: res.status, error: `HTTP ${res.status}` };
        }
        const data = await res.json();
        return { 
          success: true, 
          totalQuestions: data.totalQuestions,
          totalEvents: data.totalEvents,
          sampleQuestions: Object.keys(data.questions).slice(0, 5)
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    if (indexResponse.success) {
      console.log('✅ History index loaded successfully');
      console.log(`   Total questions: ${indexResponse.totalQuestions}`);
      console.log(`   Total events: ${indexResponse.totalEvents}`);
      console.log(`   Sample questions: ${indexResponse.sampleQuestions.join(', ')}\n`);
    } else {
      console.log('❌ Failed to load history index');
      console.log(`   Error: ${indexResponse.error}\n`);
    }
    
    // Test fetching a specific question history
    const testQuestionId = 'gh-1';
    console.log(`📊 Testing specific question history (${testQuestionId})...`);
    const questionResponse = await page.evaluate(async (qid) => {
      try {
        const res = await fetch(`/data/history/${qid}.json`);
        if (!res.ok) {
          return { success: false, status: res.status, error: `HTTP ${res.status}` };
        }
        const data = await res.json();
        return { 
          success: true, 
          questionId: data.questionId,
          totalEvents: data.totalEvents,
          latestEvent: data.latestEvent,
          historyCount: data.history?.length || 0
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, testQuestionId);
    
    if (questionResponse.success) {
      console.log('✅ Question history loaded successfully');
      console.log(`   Question ID: ${questionResponse.questionId}`);
      console.log(`   Total events: ${questionResponse.totalEvents}`);
      console.log(`   History records: ${questionResponse.historyCount}`);
      console.log(`   Latest event: ${questionResponse.latestEvent?.eventType} at ${questionResponse.latestEvent?.createdAt}\n`);
    } else {
      console.log('❌ Failed to load question history');
      console.log(`   Error: ${questionResponse.error}\n`);
    }
    
    // Navigate to a page with questions and check if history icon appears
    console.log('📊 Checking if history icons appear on questions...');
    await page.goto('http://localhost:5001/#/channels', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    await page.waitForTimeout(2000);
    
    // Look for history buttons
    const historyButtons = await page.$$('button[title*="history"]');
    console.log(`Found ${historyButtons.length} history buttons\n`);
    
    if (historyButtons.length > 0) {
      console.log('✅ History buttons are present');
      
      // Click the first one and check if modal opens
      console.log('📊 Testing history modal...');
      await historyButtons[0].click();
      await page.waitForTimeout(1000);
      
      // Check if modal appeared
      const modalVisible = await page.evaluate(() => {
        const modal = document.querySelector('[class*="fixed inset-0 z-"]');
        return modal !== null;
      });
      
      if (modalVisible) {
        console.log('✅ History modal opened successfully');
        
        // Check modal content
        const modalContent = await page.evaluate(() => {
          const title = document.querySelector('h2')?.textContent;
          const noHistory = document.querySelector('p')?.textContent?.includes('No History');
          return { title, noHistory };
        });
        
        console.log(`   Modal title: ${modalContent.title}`);
        if (modalContent.noHistory) {
          console.log('   ⚠️  Modal shows "No History Available"');
        } else {
          console.log('   ✅ Modal shows history data');
        }
      } else {
        console.log('❌ History modal did not open');
      }
    } else {
      console.log('⚠️  No history buttons found on the page');
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('Test complete!');
    console.log('═'.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testHistoryLoading().catch(console.error);
