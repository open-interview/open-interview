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
  console.log('⚠️  Pagefind source directory not found. Skipping search index build.');
  process.exit(0);
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
  console.warn('⚠️  Pagefind index build skipped (no indexable content):', error.message);
  process.exit(0);
}
