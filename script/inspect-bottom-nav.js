#!/usr/bin/env node

/**
 * Bottom Navigation Inspector
 * Deep inspection of the Practice icon to identify clipping issues
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

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

async function inspectBottomNav() {
  log('\n🔍 Bottom Navigation Deep Inspection', 'cyan');
  log('═'.repeat(60), 'cyan');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
  });
  
  const page = await context.newPage();
  
  try {
    log('\n📱 Loading page at mobile viewport (390x844)...', 'blue');
    await page.goto('http://localhost:5003', { waitUntil: 'networkidle' });
    
    // Wait for bottom nav
    await page.waitForSelector('nav.fixed.bottom-0', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(1000); // Let animations settle
    
    log('✅ Page loaded\n', 'green');
    
    // Find Practice button
    log('🎯 Locating Practice button...', 'blue');
    const practiceButton = page.locator('nav.fixed.bottom-0 button').filter({ hasText: 'Practice' });
    
    if (await practiceButton.count() === 0) {
      log('❌ Practice button not found!', 'red');
      return;
    }
    
    log('✅ Practice button found\n', 'green');
    
    // Get detailed information
    const info = await practiceButton.evaluate((btn) => {
      const buttonRect = btn.getBoundingClientRect();
      const buttonStyles = window.getComputedStyle(btn);
      
      // Find the icon container (rounded-2xl div)
      const container = btn.querySelector('div[class*="rounded-2xl"]');
      const containerRect = container ? container.getBoundingClientRect() : null;
      const containerStyles = container ? window.getComputedStyle(container) : null;
      
      // Find the SVG icon
      const icon = container ? container.querySelector('svg') : null;
      const iconRect = icon ? icon.getBoundingClientRect() : null;
      const iconStyles = icon ? window.getComputedStyle(icon) : null;
      
      // Get all SVG paths to check if they extend beyond viewBox
      const paths = icon ? Array.from(icon.querySelectorAll('path, circle, rect, line')).map(el => {
        const bbox = el.getBBox();
        return {
          tag: el.tagName,
          x: bbox.x,
          y: bbox.y,
          width: bbox.width,
          height: bbox.height,
        };
      }) : [];
      
      return {
        button: {
          rect: {
            x: buttonRect.x,
            y: buttonRect.y,
            width: buttonRect.width,
            height: buttonRect.height,
          },
          styles: {
            padding: buttonStyles.padding,
            display: buttonStyles.display,
            flexDirection: buttonStyles.flexDirection,
            alignItems: buttonStyles.alignItems,
            justifyContent: buttonStyles.justifyContent,
          },
        },
        container: container ? {
          rect: {
            x: containerRect.x,
            y: containerRect.y,
            width: containerRect.width,
            height: containerRect.height,
          },
          styles: {
            width: containerStyles.width,
            height: containerStyles.height,
            padding: containerStyles.padding,
            margin: containerStyles.margin,
            marginTop: containerStyles.marginTop,
            borderRadius: containerStyles.borderRadius,
            overflow: containerStyles.overflow,
            display: containerStyles.display,
            alignItems: containerStyles.alignItems,
            justifyContent: containerStyles.justifyContent,
            background: containerStyles.background,
            boxShadow: containerStyles.boxShadow,
          },
          classes: container.className,
        } : null,
        icon: icon ? {
          rect: {
            x: iconRect.x,
            y: iconRect.y,
            width: iconRect.width,
            height: iconRect.height,
          },
          styles: {
            width: iconStyles.width,
            height: iconStyles.height,
            strokeWidth: icon.getAttribute('stroke-width'),
            stroke: iconStyles.stroke,
            fill: iconStyles.fill,
          },
          viewBox: icon.getAttribute('viewBox'),
          paths: paths,
        } : null,
      };
    });
    
    // Analyze the data
    log('📊 ANALYSIS RESULTS', 'cyan');
    log('═'.repeat(60), 'cyan');
    
    // Button analysis
    log('\n🔘 Button Container:', 'yellow');
    log(`  Position: (${info.button.rect.x.toFixed(1)}, ${info.button.rect.y.toFixed(1)})`, 'reset');
    log(`  Size: ${info.button.rect.width.toFixed(1)}x${info.button.rect.height.toFixed(1)}px`, 'reset');
    log(`  Padding: ${info.button.styles.padding}`, 'reset');
    
    // Icon container analysis
    if (info.container) {
      log('\n📦 Icon Container:', 'yellow');
      log(`  Position: (${info.container.rect.x.toFixed(1)}, ${info.container.rect.y.toFixed(1)})`, 'reset');
      log(`  Size: ${info.container.rect.width.toFixed(1)}x${info.container.rect.height.toFixed(1)}px`, 'reset');
      log(`  Expected: 56x56px (w-14 h-14)`, 'reset');
      log(`  Padding: ${info.container.styles.padding}`, 'reset');
      log(`  Margin: ${info.container.styles.margin}`, 'reset');
      log(`  Margin Top: ${info.container.styles.marginTop}`, 'reset');
      log(`  Border Radius: ${info.container.styles.borderRadius}`, 'reset');
      log(`  Overflow: ${info.container.styles.overflow}`, 'reset');
      log(`  Classes: ${info.container.classes}`, 'reset');
      
      // Check if size matches expected
      const expectedSize = 56;
      const actualWidth = info.container.rect.width;
      const actualHeight = info.container.rect.height;
      
      if (Math.abs(actualWidth - expectedSize) > 2 || Math.abs(actualHeight - expectedSize) > 2) {
        log(`  ⚠️  WARNING: Container size mismatch!`, 'yellow');
        log(`     Expected: ${expectedSize}x${expectedSize}px`, 'yellow');
        log(`     Actual: ${actualWidth.toFixed(1)}x${actualHeight.toFixed(1)}px`, 'yellow');
      } else {
        log(`  ✅ Container size correct`, 'green');
      }
    }
    
    // Icon analysis
    if (info.icon) {
      log('\n🎨 SVG Icon:', 'yellow');
      log(`  Position: (${info.icon.rect.x.toFixed(1)}, ${info.icon.rect.y.toFixed(1)})`, 'reset');
      log(`  Size: ${info.icon.rect.width.toFixed(1)}x${info.icon.rect.height.toFixed(1)}px`, 'reset');
      log(`  Expected: 24x24px (w-6 h-6)`, 'reset');
      log(`  ViewBox: ${info.icon.viewBox}`, 'reset');
      log(`  Stroke Width: ${info.icon.styles.strokeWidth}`, 'reset');
      log(`  Stroke: ${info.icon.styles.stroke}`, 'reset');
      
      // Check if icon is centered
      if (info.container) {
        const containerCenterX = info.container.rect.x + info.container.rect.width / 2;
        const containerCenterY = info.container.rect.y + info.container.rect.height / 2;
        const iconCenterX = info.icon.rect.x + info.icon.rect.width / 2;
        const iconCenterY = info.icon.rect.y + info.icon.rect.height / 2;
        
        const offsetX = Math.abs(iconCenterX - containerCenterX);
        const offsetY = Math.abs(iconCenterY - containerCenterY);
        
        log(`\n  Centering:`, 'reset');
        log(`    Horizontal offset: ${offsetX.toFixed(2)}px`, 'reset');
        log(`    Vertical offset: ${offsetY.toFixed(2)}px`, 'reset');
        
        if (offsetX > 3 || offsetY > 3) {
          log(`    ⚠️  WARNING: Icon not properly centered!`, 'yellow');
        } else {
          log(`    ✅ Icon properly centered`, 'green');
        }
        
        // Check if icon extends beyond container
        const iconLeft = info.icon.rect.x;
        const iconRight = info.icon.rect.x + info.icon.rect.width;
        const iconTop = info.icon.rect.y;
        const iconBottom = info.icon.rect.y + info.icon.rect.height;
        
        const containerLeft = info.container.rect.x;
        const containerRight = info.container.rect.x + info.container.rect.width;
        const containerTop = info.container.rect.y;
        const containerBottom = info.container.rect.y + info.container.rect.height;
        
        log(`\n  Clipping Check:`, 'reset');
        log(`    Icon bounds: (${iconLeft.toFixed(1)}, ${iconTop.toFixed(1)}) to (${iconRight.toFixed(1)}, ${iconBottom.toFixed(1)})`, 'reset');
        log(`    Container bounds: (${containerLeft.toFixed(1)}, ${containerTop.toFixed(1)}) to (${containerRight.toFixed(1)}, ${containerBottom.toFixed(1)})`, 'reset');
        
        const clippedLeft = iconLeft < containerLeft;
        const clippedRight = iconRight > containerRight;
        const clippedTop = iconTop < containerTop;
        const clippedBottom = iconBottom > containerBottom;
        
        if (clippedLeft) log(`    ❌ CLIPPED LEFT by ${(containerLeft - iconLeft).toFixed(2)}px`, 'red');
        if (clippedRight) log(`    ❌ CLIPPED RIGHT by ${(iconRight - containerRight).toFixed(2)}px`, 'red');
        if (clippedTop) log(`    ❌ CLIPPED TOP by ${(containerTop - iconTop).toFixed(2)}px`, 'red');
        if (clippedBottom) log(`    ❌ CLIPPED BOTTOM by ${(iconBottom - containerBottom).toFixed(2)}px`, 'red');
        
        if (!clippedLeft && !clippedRight && !clippedTop && !clippedBottom) {
          log(`    ✅ Icon NOT clipped - fully visible`, 'green');
        }
        
        // Calculate available space
        const spaceLeft = iconLeft - containerLeft;
        const spaceRight = containerRight - iconRight;
        const spaceTop = iconTop - containerTop;
        const spaceBottom = containerBottom - iconBottom;
        
        log(`\n  Available Space:`, 'reset');
        log(`    Left: ${spaceLeft.toFixed(2)}px`, 'reset');
        log(`    Right: ${spaceRight.toFixed(2)}px`, 'reset');
        log(`    Top: ${spaceTop.toFixed(2)}px`, 'reset');
        log(`    Bottom: ${spaceBottom.toFixed(2)}px`, 'reset');
        
        const minSpace = Math.min(spaceLeft, spaceRight, spaceTop, spaceBottom);
        if (minSpace < 2) {
          log(`    ⚠️  WARNING: Very tight spacing (${minSpace.toFixed(2)}px)`, 'yellow');
        } else if (minSpace < 5) {
          log(`    ⚠️  Spacing could be better (${minSpace.toFixed(2)}px)`, 'yellow');
        } else {
          log(`    ✅ Good spacing (${minSpace.toFixed(2)}px minimum)`, 'green');
        }
      }
      
      // Analyze SVG paths
      if (info.icon.paths.length > 0) {
        log(`\n  SVG Paths (${info.icon.paths.length} elements):`, 'reset');
        info.icon.paths.forEach((path, i) => {
          log(`    ${i + 1}. ${path.tag}: (${path.x.toFixed(1)}, ${path.y.toFixed(1)}) ${path.width.toFixed(1)}x${path.height.toFixed(1)}`, 'reset');
        });
      }
    }
    
    // Take screenshots
    log('\n📸 Taking screenshots...', 'blue');
    
    const resultsDir = 'test-results/inspection';
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    // Full page screenshot
    await page.screenshot({
      path: path.join(resultsDir, 'full-page.png'),
      fullPage: false,
    });
    
    // Bottom nav screenshot
    const navBar = page.locator('nav.fixed.bottom-0');
    await navBar.screenshot({
      path: path.join(resultsDir, 'bottom-nav.png'),
    });
    
    // Practice button close-up
    await practiceButton.screenshot({
      path: path.join(resultsDir, 'practice-button.png'),
    });
    
    // Icon container close-up
    const iconContainer = practiceButton.locator('div[class*="rounded-2xl"]').first();
    await iconContainer.screenshot({
      path: path.join(resultsDir, 'icon-container.png'),
    });
    
    log(`✅ Screenshots saved to ${resultsDir}/`, 'green');
    
    // Generate HTML report
    const report = `
<!DOCTYPE html>
<html>
<head>
  <title>Bottom Nav Inspection Report</title>
  <style>
    body { font-family: monospace; padding: 20px; background: #1a1a1a; color: #e0e0e0; }
    h1 { color: #00d4ff; }
    h2 { color: #ffa500; margin-top: 30px; }
    .section { background: #2a2a2a; padding: 15px; margin: 10px 0; border-radius: 8px; }
    .good { color: #00ff00; }
    .warning { color: #ffaa00; }
    .error { color: #ff0000; }
    .info { color: #00d4ff; }
    img { max-width: 100%; border: 2px solid #444; border-radius: 8px; margin: 10px 0; }
    table { border-collapse: collapse; width: 100%; margin: 10px 0; }
    th, td { border: 1px solid #444; padding: 8px; text-align: left; }
    th { background: #333; }
  </style>
</head>
<body>
  <h1>🔍 Bottom Navigation Inspection Report</h1>
  <p>Generated: ${new Date().toISOString()}</p>
  
  <h2>📊 Measurements</h2>
  <div class="section">
    <h3>Button Container</h3>
    <table>
      <tr><th>Property</th><th>Value</th></tr>
      <tr><td>Position</td><td>(${info.button.rect.x.toFixed(1)}, ${info.button.rect.y.toFixed(1)})</td></tr>
      <tr><td>Size</td><td>${info.button.rect.width.toFixed(1)}x${info.button.rect.height.toFixed(1)}px</td></tr>
      <tr><td>Padding</td><td>${info.button.styles.padding}</td></tr>
    </table>
    
    <h3>Icon Container</h3>
    <table>
      <tr><th>Property</th><th>Value</th><th>Expected</th></tr>
      <tr><td>Size</td><td>${info.container.rect.width.toFixed(1)}x${info.container.rect.height.toFixed(1)}px</td><td>56x56px</td></tr>
      <tr><td>Padding</td><td>${info.container.styles.padding}</td><td>0</td></tr>
      <tr><td>Margin Top</td><td>${info.container.styles.marginTop}</td><td>-16px</td></tr>
      <tr><td>Overflow</td><td>${info.container.styles.overflow}</td><td>visible</td></tr>
    </table>
    
    <h3>SVG Icon</h3>
    <table>
      <tr><th>Property</th><th>Value</th><th>Expected</th></tr>
      <tr><td>Size</td><td>${info.icon.rect.width.toFixed(1)}x${info.icon.rect.height.toFixed(1)}px</td><td>24x24px</td></tr>
      <tr><td>Stroke Width</td><td>${info.icon.styles.strokeWidth}</td><td>1.5</td></tr>
      <tr><td>ViewBox</td><td>${info.icon.viewBox}</td><td>0 0 24 24</td></tr>
    </table>
  </div>
  
  <h2>📸 Screenshots</h2>
  <div class="section">
    <h3>Full Page</h3>
    <img src="full-page.png" alt="Full page">
    
    <h3>Bottom Navigation</h3>
    <img src="bottom-nav.png" alt="Bottom nav">
    
    <h3>Practice Button</h3>
    <img src="practice-button.png" alt="Practice button">
    
    <h3>Icon Container</h3>
    <img src="icon-container.png" alt="Icon container">
  </div>
  
  <h2>💡 Recommendations</h2>
  <div class="section">
    ${info.container.rect.width < 54 ? '<p class="error">❌ Container too small - increase to w-16 h-16</p>' : '<p class="good">✅ Container size adequate</p>'}
    ${info.icon.rect.width > info.container.rect.width - 10 ? '<p class="warning">⚠️ Icon too large for container - reduce size</p>' : '<p class="good">✅ Icon size appropriate</p>'}
    ${info.container.styles.overflow !== 'visible' ? '<p class="warning">⚠️ Overflow not visible - may clip icon</p>' : '<p class="good">✅ Overflow set to visible</p>'}
  </div>
</body>
</html>
    `;
    
    fs.writeFileSync(path.join(resultsDir, 'report.html'), report);
    log(`✅ HTML report saved to ${resultsDir}/report.html`, 'green');
    
    log('\n═'.repeat(60), 'cyan');
    log('✅ Inspection complete!', 'green');
    log(`\nOpen ${resultsDir}/report.html in your browser to view the full report.`, 'cyan');
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await browser.close();
  }
}

inspectBottomNav().catch(console.error);
