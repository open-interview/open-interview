#!/usr/bin/env node
/**
 * Fix Monitor Loop — runs content generation scripts with automatic retry
 *
 * Runs the script, captures failed items, and retries them in a loop
 * until all succeed or max retries exhausted.
 *
 * Usage:
 *   node script/run-with-monitor-loop.js [--script gen-questions-batch] [--max-retries 3] [--per-channel 5]
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const scriptArg = args.find(a => a.startsWith('--script='))?.split('=')[1] || 'gen-questions-batch';
const maxRetries = parseInt(args.find(a => a.startsWith('--max-retries='))?.split('=')[1] || '3');
const perChannel = parseInt(args.find(a => a.startsWith('--per-channel='))?.split('=')[1] || process.env.PER_CHANNEL || '5');
const concurrency = parseInt(args.find(a => a.startsWith('--concurrency='))?.split('=')[1] || process.env.CONCURRENCY || '20');

const scriptPath = path.join(__dirname, `${scriptArg}.js`);
if (!fs.existsSync(scriptPath)) {
  console.error(`❌ Script not found: ${scriptPath}`);
  process.exit(1);
}

async function runScript(envOverrides = {}, label = '') {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const childEnv = {
      ...process.env,
      PER_CHANNEL: String(perChannel),
      CONCURRENCY: String(concurrency),
      ...envOverrides,
    };

    const proc = spawn('node', [scriptPath], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: childEnv,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      const str = data.toString();
      stdout += str;
      process.stdout.write(str);
    });
    proc.stderr.on('data', (data) => {
      const str = data.toString();
      stderr += str;
      process.stderr.write(str);
    });

    proc.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      resolve({
        code,
        stdout,
        stderr,
        duration,
        label,
      });
    });

    proc.on('error', (err) => {
      resolve({ code: -1, stdout, stderr, duration: '0', label, error: err.message });
    });
  });
}

function extractFailedChannels(stdout) {
  // Look for patterns like: "❌ channel-name: error message" or "attempt X failed"
  const failures = [];
  const lines = stdout.split('\n');
  for (const line of lines) {
    // Match failure patterns in gen-questions-batch output
    const msgMatch = line.match(/❌\s+(\S+):\s+(.+)/);
    if (msgMatch) {
      failures.push({ channel: msgMatch[1], reason: msgMatch[2].trim() });
    }
  }
  return failures;
}

function countSuccesses(stdout) {
  const addedMatches = stdout.match(/Total added:\s+(\d+)/);
  return addedMatches ? parseInt(addedMatches[1]) : 0;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔄 Fix Monitor Loop');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Script:      ${scriptArg}.js`);
  console.log(`Max retries: ${maxRetries}`);
  console.log(`Per channel: ${perChannel}`);
  console.log(`Concurrency: ${concurrency}\n`);

  let attempt = 0;
  let totalGenerated = 0;
  const allFailedChannels = new Set();
  let lastStdout = '';

  while (attempt <= maxRetries) {
    attempt++;
    const label = attempt === 1 ? 'Initial run' : `Retry ${attempt - 1}`;
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📦 ${label} (attempt ${attempt}/${maxRetries + 1})`);
    console.log(`${'─'.repeat(60)}\n`);

    // If we have known failures from previous run, target only those channels
    const envOverrides = {};
    if (allFailedChannels.size > 0) {
      envOverrides.CHANNELS = [...allFailedChannels].join(',');
      console.log(`🎯 Targeting ${allFailedChannels.size} failed channels: ${[...allFailedChannels].join(', ')}\n`);
    }

    const result = await runScript(envOverrides, label);
    lastStdout = result.stdout;

    // Parse results
    const newFailures = extractFailedChannels(lastStdout);
    const added = countSuccesses(lastStdout);
    totalGenerated += added;

    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📊 ${label} complete: +${added} generated, ${newFailures.length} failed (${result.duration}s)`);

    if (result.code !== 0 && !result.error) {
      console.log(`⚠️  Script exited with code ${result.code}`);
    }

    if (newFailures.length === 0) {
      console.log('\n✅ All items succeeded! No more retries needed.');
      break;
    }

    // Update failed channels for next retry
    allFailedChannels.clear();
    for (const f of newFailures) {
      allFailedChannels.add(f.channel);
    }

    console.log(`\n❌ Failed channels: ${[...allFailedChannels].join(', ')}`);
    console.log(`   Reasons: ${newFailures.map(f => f.reason).join('; ')}`);

    if (attempt > maxRetries) {
      console.log(`\n⚠️  Max retries (${maxRetries}) exhausted. ${allFailedChannels.size} channels still failing.`);
    } else {
      console.log(`\n🔄 Retrying in 2s...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Final summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 FINAL MONITOR LOOP SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total generated: ${totalGenerated}`);
  if (allFailedChannels.size > 0) {
    console.log(`Still failing:   ${[...allFailedChannels].join(', ')}`);
  } else {
    console.log(`✅ All items generated successfully!`);
  }
  console.log(`Attempts:        ${attempt}`);
  console.log('═'.repeat(60) + '\n');
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
