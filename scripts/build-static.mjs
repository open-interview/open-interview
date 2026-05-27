#!/usr/bin/env node
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const VERBOSE = process.argv.includes('--verbose');

function run(script, label, optional = false) {
  const cmd = `node ${script}`;
  console.log(`\n=== ${label} ===`);
  if (VERBOSE) console.log(`  $ ${cmd}`);
  const start = Date.now();
  try {
    execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\u2705 ${label} completed (${elapsed}s)`);
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const detail = err.status != null ? `exit code ${err.status}` : `signal ${err.signal}`;
    if (optional) {
      console.warn(`\u26a0\ufe0f ${label} skipped (optional, ${detail}, ${elapsed}s)`);
    } else {
      console.error(`\u274c ${label} FAILED (${detail}, ${elapsed}s)`);
      process.exit(1);
    }
  }
}

function runVite() {
  const cmd = `pnpm exec vite build`;
  console.log(`\n=== Vite Build ===`);
  if (VERBOSE) console.log(`  $ NODE_OPTIONS=--max-old-space-size=1800 ${cmd}`);
  const start = Date.now();
  try {
    execSync('NODE_OPTIONS=--max-old-space-size=1800 pnpm exec vite build', {
      cwd: ROOT,
      stdio: 'inherit',
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\u2705 Vite build completed (${elapsed}s)`);
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const detail = err.status != null ? `exit code ${err.status}` : `signal ${err.signal}`;
    console.error(`\u274c Vite build FAILED (${detail}, ${elapsed}s)`);
    process.exit(1);
  }
}

const totalStart = Date.now();

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

const totalElapsed = ((Date.now() - totalStart) / 1000).toFixed(1);
console.log(`\n\u2705 Static build pipeline complete (${totalElapsed}s)`);
