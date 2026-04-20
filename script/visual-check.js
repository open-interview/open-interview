#!/usr/bin/env node

/**
 * Visual check - take screenshot and measure actual clipping
 */

import { chromium } from 'playwright';
import fs from 'fs';

async function visualCheck() {
  console.log('🔍 Visual Check - Taking Screenshot\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
  });
  
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:5003', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Get ALL computed styles for the entire chain
    const analysis = await page.evaluate(() => {
      const nav = document.querySelector('nav.fixed.bottom-0');
      const practiceBtn = Array.from(document.querySelectorAll('nav.fixed.bottom-0 button'))
        .find(btn => btn.textContent?.includes('Practice'));
      
      if (!nav || !practiceBtn) return null;
      
      const iconContainer = practiceBtn.querySelector('div[class*="rounded-2xl"]');
      const svg = iconContainer?.querySelector('svg');
      
      const getFullStyles = (el) => {
        const styles = window.getComputedStyle(el);
        return {
          overflow: styles.overflow,
          overflowX: styles.overflowX,
          overflowY: styles.overflowY,
          position: styles.position,
          zIndex: styles.zIndex,
          transform: styles.transform,
          clipPath: styles.clipPath,
          display: styles.display,
          width: styles.width,
          height: styles.height,
          margin: styles.margin,
          padding: styles.padding,
        };
      };
      
      const navRect = nav.getBoundingClientRect();
      const btnRect = practiceBtn.getBoundingClientRect();
      const containerRect = iconContainer?.getBoundingClientRect();
      const svgRect = svg?.getBoundingClientRect();
      
      return {
        nav: {
          styles: getFullStyles(nav),
          rect: { top: navRect.top, bottom: navRect.bottom, height: navRect.height },
          className: nav.className,
        },
        navInner: {
          styles: getFullStyles(nav.children[0]),
          className: nav.children[0].className,
        },
        flexContainer: {
          styles: getFullStyles(nav.children[0].children[0]),
          className: nav.children[0].children[0].className,
        },
        button: {
          styles: getFullStyles(practiceBtn),
          rect: { top: btnRect.top, bottom: btnRect.bottom, height: btnRect.height },
          className: practiceBtn.className,
        },
        iconContainer: iconContainer ? {
          styles: getFullStyles(iconContainer),
          rect: { 
            top: containerRect.top, 
            bottom: containerRect.bottom, 
            height: containerRect.height,
            left: containerRect.left,
            right: containerRect.right,
          },
          className: iconContainer.className,
        } : null,
        svg: svg ? {
          rect: { 
            top: svgRect.top, 
            bottom: svgRect.bottom, 
            height: svgRect.height,
            left: svgRect.left,
            right: svgRect.right,
          },
          viewBox: svg.getAttribute('viewBox'),
        } : null,
        clipping: {
          navTop: navRect.top,
          containerTop: containerRect?.top,
          svgTop: svgRect?.top,
          isContainerAboveNav: containerRect && containerRect.top < navRect.top,
          isSvgAboveNav: svgRect && svgRect.top < navRect.top,
          clippedAmount: containerRect && containerRect.top < navRect.top ? navRect.top - containerRect.top : 0,
        }
      };
    });
    
    console.log('📊 ANALYSIS:\n');
    console.log('NAV Element:');
    console.log('  Overflow:', analysis.nav.styles.overflow);
    console.log('  Classes:', analysis.nav.className);
    console.log('  Top:', analysis.nav.rect.top);
    
    console.log('\nNAV Inner Div:');
    console.log('  Overflow:', analysis.navInner.styles.overflow);
    console.log('  Classes:', analysis.navInner.className);
    
    console.log('\nFlex Container:');
    console.log('  Overflow:', analysis.flexContainer.styles.overflow);
    console.log('  Classes:', analysis.flexContainer.className);
    
    console.log('\nButton:');
    console.log('  Overflow:', analysis.button.styles.overflow);
    console.log('  Top:', analysis.button.rect.top);
    
    console.log('\nIcon Container:');
    console.log('  Overflow:', analysis.iconContainer.styles.overflow);
    console.log('  Top:', analysis.iconContainer.rect.top);
    console.log('  Margin:', analysis.iconContainer.styles.margin);
    console.log('  Transform:', analysis.iconContainer.styles.transform);
    
    console.log('\nSVG:');
    console.log('  Top:', analysis.svg.rect.top);
    console.log('  ViewBox:', analysis.svg.viewBox);
    
    console.log('\n🚨 CLIPPING DETECTION:');
    console.log('  Nav top:', analysis.clipping.navTop);
    console.log('  Container top:', analysis.clipping.containerTop);
    console.log('  SVG top:', analysis.clipping.svgTop);
    console.log('  Container above nav?', analysis.clipping.isContainerAboveNav ? '❌ YES - CLIPPED!' : '✅ No');
    console.log('  SVG above nav?', analysis.clipping.isSvgAboveNav ? '❌ YES - CLIPPED!' : '✅ No');
    if (analysis.clipping.clippedAmount > 0) {
      console.log('  ❌ CLIPPED BY:', analysis.clipping.clippedAmount.toFixed(2), 'px');
    }
    
    // Take screenshots
    console.log('\n📸 Taking screenshots...');
    
    if (!fs.existsSync('test-results/visual-check')) {
      fs.mkdirSync('test-results/visual-check', { recursive: true });
    }
    
    await page.screenshot({
      path: 'test-results/visual-check/full-screen.png',
      fullPage: false,
    });
    
    const nav = page.locator('nav.fixed.bottom-0');
    await nav.screenshot({
      path: 'test-results/visual-check/nav-bar.png',
    });
    
    const practiceBtn = page.locator('nav.fixed.bottom-0 button').filter({ hasText: 'Practice' });
    await practiceBtn.screenshot({
      path: 'test-results/visual-check/practice-button.png',
    });
    
    console.log('✅ Screenshots saved to test-results/visual-check/\n');
    
    // Keep browser open for inspection
    console.log('Browser will stay open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

visualCheck().catch(console.error);
