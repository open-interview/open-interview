#!/usr/bin/env node
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function run(script, label, optional = false) {
  console.log(`\n=== ${label} ===`);
  try {
    execSync(`node ${script}`, { cwd: ROOT, stdio: 'inherit' });
    console.log(`\u2705 ${label} completed`);
  } catch (err) {
    if (optional) {
      console.warn(`\u26a0\ufe0f ${label} failed (optional): ${err.message}`);
    } else {
      console.error(`\u274c ${label} failed: ${err.message}`);
      process.exit(1);
    }
  }
}

function runVite() {
  console.log(`\n=== Vite Build ===`);
  try {
    execSync('NODE_OPTIONS=--max-old-space-size=1800 npx vite build', { cwd: ROOT, stdio: 'inherit' });
    console.log('\u2705 Vite build completed');
  } catch (err) {
    console.error(`\u274c Vite build failed: ${err.message}`);
    process.exit(1);
  }
}

console.log('\ud83d\ude80 Starting static build pipeline...\n');

run('script/fetch-questions-for-build.js', 'Fetch questions');
run('script/generate-tests-from-channels.js', 'Generate tests');
run('script/fetch-question-history.js', 'Fetch question history');
run('script/generate-curated-paths.js', 'Generate curated paths');
run('script/export-voice-sessions.js', 'Export voice sessions', true);
run('script/generate-interview-intelligence.js', 'Generate interview intelligence', true);
run('script/generate-rss.js', 'Generate RSS', true);
run('script/generate-sitemap.js', 'Generate sitemap', true);
runVite();
run('script/generate-route-shells.mjs', 'Generate static route shells');
run('script/generate-pagefind-index.js', 'Generate Pagefind index');
run('script/build-pagefind.js', 'Build Pagefind');

console.log('\n\u2705 Static build pipeline complete!');
