#!/usr/bin/env node
/**
 * Data Quality Validator — runs against all channel JSON files
 * Usage: node script/validate-data-quality.js [--fix]
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = 'client/public/data';
const FIX = process.argv.includes('--fix');
const SKIP = new Set(['all-questions','blog-posts','bot-activity','bot-monitor','curated-paths',
  'learning-paths','similar-questions','sitemap-data','tests','testing','channels-config',
  'changelog','channels','certifications','stats','github-analytics','coding-challenges']);
const VALID_DIFFICULTIES = new Set(['beginner','intermediate','advanced']);

let totalQ = 0, totalIssues = 0, filesChanged = 0;
const report = {};

for (const file of readdirSync(DATA_DIR).sort()) {
  if (!file.endsWith('.json')) continue;
  const name = file.replace('.json', '');
  if (SKIP.has(name)) continue;

  let raw, data;
  try {
    raw = readFileSync(join(DATA_DIR, file), 'utf8');
    data = JSON.parse(raw);
  } catch (e) { console.error(`PARSE ERROR ${name}: ${e.message}`); continue; }

  const questions = Array.isArray(data) ? data : (data.questions ?? []);
  if (!Array.isArray(questions)) continue;

  let changed = false;
  const chIssues = [];

  for (const q of questions) {
    const qi = [];

    // Structure
    if (!q.id)                    qi.push('missing_id');
    if (!q.question?.trim())      qi.push('missing_question');
    if (!q.answer?.trim())        qi.push('missing_answer');
    if (!q.difficulty)            qi.push('missing_difficulty');
    if (!q.channel)               qi.push('missing_channel');

    // Quality
    if (q.question?.trim().length < 20)   qi.push('question_too_short');
    if (q.answer?.trim().length < 30)     qi.push('answer_too_short');
    if (q.difficulty && !VALID_DIFFICULTIES.has(q.difficulty)) qi.push(`invalid_difficulty:${q.difficulty}`);
    if (q.channel && q.channel !== name)  qi.push(`channel_mismatch:${q.channel}`);
    if (q.question?.trim() === q.answer?.trim() && q.question) qi.push('question_equals_answer');

    // voiceKeywords must be array
    if (!Array.isArray(q.voiceKeywords)) {
      qi.push('voiceKeywords_not_array');
      if (FIX) {
        q.voiceKeywords = typeof q.voiceKeywords === 'string' && q.voiceKeywords.trim()
          ? q.voiceKeywords.split(',').map(k => k.trim()).filter(Boolean)
          : [];
        changed = true;
      }
    }

    // tags must be array
    if (!Array.isArray(q.tags)) {
      qi.push('tags_not_array');
      if (FIX) { q.tags = []; changed = true; }
    }

    if (qi.length) chIssues.push({ id: q.id, issues: qi });
  }

  totalQ += questions.length;
  totalIssues += chIssues.length;
  if (chIssues.length) report[name] = chIssues;

  if (FIX && changed) {
    if (!Array.isArray(data)) data.questions = questions;
    writeFileSync(join(DATA_DIR, file), JSON.stringify(data, null, 2) + '\n');
    filesChanged++;
  }
}

console.log(`\nScanned: ${totalQ} questions across ${Object.keys(report).length + (Object.keys(report).length === 0 ? 0 : 0)} channels`);
console.log(`Issues:  ${totalIssues}`);
if (FIX) console.log(`Fixed:   ${filesChanged} files`);

if (totalIssues > 0) {
  console.log('\nIssue breakdown:');
  const types = {};
  for (const issues of Object.values(report))
    for (const { issues: qi } of issues)
      for (const i of qi) { const k = i.split(':')[0]; types[k] = (types[k]||0)+1; }
  for (const [k,v] of Object.entries(types).sort((a,b)=>b[1]-a[1]))
    console.log(`  ${k}: ${v}`);
  if (!FIX) { console.log('\nRun with --fix to auto-repair fixable issues.'); process.exit(1); }
} else {
  console.log('✅ All data files pass quality checks.');
}
