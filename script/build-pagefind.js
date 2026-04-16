#!/usr/bin/env node
/**
 * Build Pagefind search index from generated HTML files
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const sourceDir = path.join(rootDir, 'dist/public/_pagefind-source');
const outputDir = path.join(rootDir, 'dist/public');

// Check if source directory exists
if (!fs.existsSync(sourceDir)) {
  console.log('⚠️  Pagefind source directory not found. Run generate-pagefind-index.js first.');
  process.exit(1);
}

console.log('🔍 Building Pagefind search index...');

try {
  // Run Pagefind
  execSync(`npx pagefind --site "${sourceDir}" --output-path "${path.join(outputDir, 'pagefind')}"`, {
    stdio: 'inherit',
    cwd: rootDir
  });
  
  // Clean up source HTML files - not needed in deployment
  fs.rmSync(sourceDir, { recursive: true, force: true });
  
  console.log('✅ Pagefind index built successfully!');
  console.log(`📁 Index location: ${path.join(outputDir, 'pagefind')}`);
} catch (error) {
  console.error('❌ Failed to build Pagefind index:', error.message);
  process.exit(1);
}
