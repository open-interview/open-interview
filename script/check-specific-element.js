#!/usr/bin/env node

/**
 * Check specific element that user reported as not visible
 */

import { chromium } from 'playwright';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkElement() {
  log('\n🔍 Checking Specific Element', 'cyan');
  log('═'.repeat(60), 'cyan');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
  });
  
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:5003', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Check the specific element path
    const selector = '/html/body/div/div[1]/nav/div/div/button[3]/div';
    
    log(`\n📍 Checking element: ${selector}`, 'blue');
    
    // Try to find it
    const element = page.locator(`xpath=${selector}`);
    const count = await element.count();
    
    log(`Found ${count} element(s)`, count > 0 ? 'green' : 'red');
    
    if (count > 0) {
      // Get all the details
      const details = await element.first().evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const styles = window.getComputedStyle(el);
        
        // Get parent button
        const button = el.closest('button');
        const buttonRect = button ? button.getBoundingClientRect() : null;
        const buttonText = button ? button.textContent : '';
        
        // Get SVG inside
        const svg = el.querySelector('svg');
        const svgRect = svg ? svg.getBoundingClientRect() : null;
        
        return {
          element: {
            tagName: el.tagName,
            className: el.className,
            rect: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
              top: rect.top,
              left: rect.left,
              bottom: rect.bottom,
              right: rect.right,
            },
            styles: {
              width: styles.width,
              height: styles.height,
              padding: styles.padding,
              margin: styles.margin,
              overflow: styles.overflow,
              display: styles.display,
              visibility: styles.visibility,
              opacity: styles.opacity,
              transform: styles.transform,
              borderRadius: styles.borderRadius,
              background: styles.background,
            },
            computed: {
              isVisible: rect.width > 0 && rect.height > 0 && styles.visibility !== 'hidden' && styles.opacity !== '0',
              isInViewport: rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth,
            }
          },
          button: button ? {
            text: buttonText.trim(),
            rect: {
              x: buttonRect.x,
              y: buttonRect.y,
              width: buttonRect.width,
              height: buttonRect.height,
            }
          } : null,
          svg: svg ? {
            rect: {
              x: svgRect.x,
              y: svgRect.y,
              width: svgRect.width,
              height: svgRect.height,
            },
            viewBox: svg.getAttribute('viewBox'),
            strokeWidth: svg.getAttribute('stroke-width'),
          } : null,
        };
      });
      
      log('\n📊 Element Details:', 'yellow');
      log(`  Tag: ${details.element.tagName}`, 'reset');
      log(`  Classes: ${details.element.className}`, 'reset');
      log(`  Position: (${details.element.rect.x.toFixed(1)}, ${details.element.rect.y.toFixed(1)})`, 'reset');
      log(`  Size: ${details.element.rect.width.toFixed(1)}x${details.element.rect.height.toFixed(1)}px`, 'reset');
      log(`  Visibility: ${details.element.styles.visibility}`, 'reset');
      log(`  Opacity: ${details.element.styles.opacity}`, 'reset');
      log(`  Display: ${details.element.styles.display}`, 'reset');
      log(`  Overflow: ${details.element.styles.overflow}`, 'reset');
      log(`  Transform: ${details.element.styles.transform}`, 'reset');
      
      log('\n🔍 Computed State:', 'yellow');
      log(`  Is Visible: ${details.element.computed.isVisible ? '✅' : '❌'}`, details.element.computed.isVisible ? 'green' : 'red');
      log(`  In Viewport: ${details.element.computed.isInViewport ? '✅' : '❌'}`, details.element.computed.isInViewport ? 'green' : 'red');
      
      if (details.button) {
        log('\n🔘 Parent Button:', 'yellow');
        log(`  Text: "${details.button.text}"`, 'reset');
        log(`  Size: ${details.button.rect.width.toFixed(1)}x${details.button.rect.height.toFixed(1)}px`, 'reset');
      }
      
      if (details.svg) {
        log('\n🎨 SVG Icon:', 'yellow');
        log(`  Position: (${details.svg.rect.x.toFixed(1)}, ${details.svg.rect.y.toFixed(1)})`, 'reset');
        log(`  Size: ${details.svg.rect.width.toFixed(1)}x${details.svg.rect.height.toFixed(1)}px`, 'reset');
        log(`  ViewBox: ${details.svg.viewBox}`, 'reset');
        log(`  Stroke Width: ${details.svg.strokeWidth}`, 'reset');
        
        // Check if SVG is clipped by container
        if (details.svg.rect.x < details.element.rect.x) {
          log(`  ❌ CLIPPED LEFT by ${(details.element.rect.x - details.svg.rect.x).toFixed(2)}px`, 'red');
        }
        if (details.svg.rect.y < details.element.rect.y) {
          log(`  ❌ CLIPPED TOP by ${(details.element.rect.y - details.svg.rect.y).toFixed(2)}px`, 'red');
        }
        if (details.svg.rect.x + details.svg.rect.width > details.element.rect.x + details.element.rect.width) {
          log(`  ❌ CLIPPED RIGHT by ${(details.svg.rect.x + details.svg.rect.width - (details.element.rect.x + details.element.rect.width)).toFixed(2)}px`, 'red');
        }
        if (details.svg.rect.y + details.svg.rect.height > details.element.rect.y + details.element.rect.height) {
          log(`  ❌ CLIPPED BOTTOM by ${(details.svg.rect.y + details.svg.rect.height - (details.element.rect.y + details.element.rect.height)).toFixed(2)}px`, 'red');
        }
      }
      
      // Take screenshot
      log('\n📸 Taking screenshot...', 'blue');
      await element.first().screenshot({ path: 'test-results/specific-element.png' });
      log('✅ Screenshot saved to test-results/specific-element.png', 'green');
      
      // Also check if overflow is causing issues
      const overflowIssue = await element.first().evaluate((el) => {
        const styles = window.getComputedStyle(el);
        const svg = el.querySelector('svg');
        
        if (!svg) return null;
        
        const containerRect = el.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();
        
        // Check if SVG extends beyond container
        const extendsLeft = svgRect.left < containerRect.left;
        const extendsRight = svgRect.right > containerRect.right;
        const extendsTop = svgRect.top < containerRect.top;
        const extendsBottom = svgRect.bottom > containerRect.bottom;
        
        return {
          overflow: styles.overflow,
          overflowX: styles.overflowX,
          overflowY: styles.overflowY,
          extends: {
            left: extendsLeft,
            right: extendsRight,
            top: extendsTop,
            bottom: extendsBottom,
            any: extendsLeft || extendsRight || extendsTop || extendsBottom,
          },
          containerRect: {
            left: containerRect.left,
            right: containerRect.right,
            top: containerRect.top,
            bottom: containerRect.bottom,
          },
          svgRect: {
            left: svgRect.left,
            right: svgRect.right,
            top: svgRect.top,
            bottom: svgRect.bottom,
          }
        };
      });
      
      if (overflowIssue) {
        log('\n⚠️  Overflow Analysis:', 'yellow');
        log(`  Overflow: ${overflowIssue.overflow}`, 'reset');
        log(`  Overflow-X: ${overflowIssue.overflowX}`, 'reset');
        log(`  Overflow-Y: ${overflowIssue.overflowY}`, 'reset');
        
        if (overflowIssue.extends.any) {
          log('\n  ❌ SVG EXTENDS BEYOND CONTAINER:', 'red');
          if (overflowIssue.extends.left) log(`    - Extends LEFT`, 'red');
          if (overflowIssue.extends.right) log(`    - Extends RIGHT`, 'red');
          if (overflowIssue.extends.top) log(`    - Extends TOP`, 'red');
          if (overflowIssue.extends.bottom) log(`    - Extends BOTTOM`, 'red');
          
          log('\n  Container bounds:', 'reset');
          log(`    Left: ${overflowIssue.containerRect.left.toFixed(2)}`, 'reset');
          log(`    Right: ${overflowIssue.containerRect.right.toFixed(2)}`, 'reset');
          log(`    Top: ${overflowIssue.containerRect.top.toFixed(2)}`, 'reset');
          log(`    Bottom: ${overflowIssue.containerRect.bottom.toFixed(2)}`, 'reset');
          
          log('\n  SVG bounds:', 'reset');
          log(`    Left: ${overflowIssue.svgRect.left.toFixed(2)}`, 'reset');
          log(`    Right: ${overflowIssue.svgRect.right.toFixed(2)}`, 'reset');
          log(`    Top: ${overflowIssue.svgRect.top.toFixed(2)}`, 'reset');
          log(`    Bottom: ${overflowIssue.svgRect.bottom.toFixed(2)}`, 'reset');
          
          if (overflowIssue.overflow !== 'visible') {
            log('\n  🔧 FIX NEEDED: Set overflow to "visible"', 'yellow');
          }
        } else {
          log('  ✅ SVG fits within container', 'green');
        }
      }
      
    } else {
      log('❌ Element not found!', 'red');
      
      // Try to find all buttons in nav
      log('\n🔍 Looking for all nav buttons...', 'blue');
      const buttons = await page.locator('nav.fixed.bottom-0 button').all();
      log(`Found ${buttons.length} buttons`, 'cyan');
      
      for (let i = 0; i < buttons.length; i++) {
        const text = await buttons[i].textContent();
        log(`  Button ${i + 1}: "${text?.trim()}"`, 'reset');
      }
    }
    
    log('\n═'.repeat(60), 'cyan');
    log('Press Ctrl+C to close browser', 'yellow');
    
    // Keep browser open for manual inspection
    await page.waitForTimeout(60000);
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await browser.close();
  }
}

checkElement().catch(console.error);
