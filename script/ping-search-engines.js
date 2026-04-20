#!/usr/bin/env node
/**
 * 🔍 Ping Search Engines
 * Notifies Google and Bing about sitemap updates
 * Run after deploying: node script/ping-search-engines.js
 * 
 * Note: The ping endpoints are deprecated by both Google and Bing.
 * Modern approach is to submit sitemaps via Search Console/Webmaster Tools.
 * This script now primarily verifies sitemap accessibility.
 */

import https from 'https';

const SITE_URL = 'https://open-interview.github.io';
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

// Verify sitemap is accessible
async function verifySitemap() {
  return new Promise((resolve) => {
    const req = https.get(SITEMAP_URL, { timeout: 10000 }, (res) => {
      if (res.statusCode === 200) {
        console.log(`✅ Sitemap accessible: ${SITEMAP_URL}`);
        resolve(true);
      } else {
        console.log(`❌ Sitemap not accessible: HTTP ${res.statusCode}`);
        resolve(false);
      }
    });
    
    req.on('error', (err) => {
      console.log(`❌ Sitemap check failed: ${err.message}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log(`⏱️ Sitemap check: Timeout`);
      resolve(false);
    });
  });
}

// Legacy ping endpoints (deprecated but may still work occasionally)
const searchEngines = [
  {
    name: 'Google',
    url: `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`
  },
  {
    name: 'Bing',
    url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`
  }
];

async function pingSearchEngine(engine) {
  return new Promise((resolve) => {
    const req = https.get(engine.url, { timeout: 10000 }, (res) => {
      if (res.statusCode === 200) {
        console.log(`✅ ${engine.name}: Pinged successfully`);
        resolve(true);
      } else {
        // 404/410 are expected - these endpoints are deprecated
        console.log(`⚠️ ${engine.name}: HTTP ${res.statusCode} (ping endpoint deprecated)`);
        resolve(false);
      }
    });
    
    req.on('error', (err) => {
      console.log(`⚠️ ${engine.name}: ${err.message}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log(`⏱️ ${engine.name}: Timeout`);
      resolve(false);
    });
  });
}

async function main() {
  console.log('=== 🔍 Search Engine Sitemap Check ===\n');
  
  // First verify sitemap is accessible
  const sitemapOk = await verifySitemap();
  
  if (!sitemapOk) {
    console.log('\n❌ Sitemap is not accessible. Please check deployment.');
    process.exit(1);
  }
  
  console.log('\n📡 Attempting legacy ping endpoints (may be deprecated)...');
  for (const engine of searchEngines) {
    await pingSearchEngine(engine);
  }
  
  console.log('\n📋 Manual Steps for Better Indexing:');
  console.log('');
  console.log('🔵 Google Search Console:');
  console.log('   1. Go to: https://search.google.com/search-console');
  console.log('   2. Add property: https://open-interview.github.io');
  console.log('   3. Submit sitemap: sitemap.xml');
  console.log('   4. Use URL Inspection to request indexing');
  console.log('');
  console.log('🟠 Bing Webmaster Tools:');
  console.log('   1. Go to: https://www.bing.com/webmasters');
  console.log('   2. Add site: https://open-interview.github.io');
  console.log('   3. Verify with BingSiteAuth.xml (already deployed)');
  console.log('   4. Submit sitemap: sitemap.xml');
  console.log('\n=== Done ===');
}

main();
