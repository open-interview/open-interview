#!/usr/bin/env node
/**
 * Elite Blog Generator
 *
 * Orchestrates the full blog generation pipeline:
 *   1. Discovery → Topics from question bank
 *   2. Enrichment → Real-world case finding via LangGraph
 *   3. Generation → Blog content creation via LangGraph
 *   4. Quality Gates → Validation at every stage
 *   5. Output → MDX files + blog-data.json regeneration
 *
 * Designed to run as a standalone script or GitHub Actions job.
 *
 * Usage:
 *   node script/generate-elite-blog.js [--count=10] [--channel=...] [--force]
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { discoverTopics } from './agents/blog-topic-agent.js';
import { generateEliteBlogPost } from './ai/graphs/elite-blog-graph.js';
import { processBlogOutput, generateBlogDataJson } from './process-blog-output.js';

const OUTPUT_DIR = 'content/posts';
const BLOG_DATA_DIR = 'data/blog-posts';
const BLOG_DATA_FILE = 'data/blog-posts.json';

const BLOG_CHANNELS = [
  'system-design', 'backend', 'frontend', 'devops', 'database',
  'ai-ml', 'security', 'cloud', 'performance-testing', 'engineering',
];

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { count: 10, channels: BLOG_CHANNELS, force: false };
  for (const arg of args) {
    if (arg.startsWith('--count=')) opts.count = parseInt(arg.split('=')[1], 10) || 10;
    if (arg.startsWith('--channel=')) opts.channels = [arg.split('=')[1]];
    if (arg === '--force' || arg === '-f') opts.force = true;
  }
  return opts;
}

function ensureDirs() {
  for (const dir of [OUTPUT_DIR, BLOG_DATA_DIR]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`   Created directory: ${dir}`);
    }
  }
}

function loadExistingSlugs() {
  const slugs = new Set();
  if (fs.existsSync(OUTPUT_DIR)) {
    const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
    files.forEach(f => {
      const slug = f.replace(/\.(md|mdx)$/, '');
      const parts = slug.split('--');
      if (parts.length > 1) slugs.add(parts[1]);
      else slugs.add(slug);
    });
  }
  return slugs;
}

async function main() {
  const opts = parseArgs();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🏆 ELITE BLOG GENERATION SYSTEM`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Target: ${opts.count} posts`);
  console.log(`Channels: ${opts.channels.join(', ')}`);
  console.log(`Force: ${opts.force}`);
  console.log(`${'='.repeat(60)}\n`);

  ensureDirs();

  const existingSlugs = opts.force ? new Set() : loadExistingSlugs();
  console.log(`📁 Found ${existingSlugs.size} existing blog posts`);

  console.log(`\n🔍 [PHASE 1] Discovering worthy topics...`);
  const topics = await discoverTopics({
    count: opts.count,
    channels: opts.channels,
    minScore: 25,
  });

  if (topics.length === 0) {
    console.log('❌ No suitable topics found. Try lowering the minScore threshold.');
    process.exit(1);
  }

  const generated = [];
  const skipped = [];
  const failed = [];

  console.log(`\n📝 [PHASE 2] Generating ${Math.min(topics.length, opts.count)} blog posts...`);

  for (let i = 0; i < Math.min(topics.length, opts.count); i++) {
    const topic = topics[i];
    const slug = topic.question.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 60);

    if (existingSlugs.has(slug)) {
      console.log(`\n⏭️  [${i + 1}/${opts.count}] Skipping existing: ${topic.question.substring(0, 50)}...`);
      skipped.push({ topic, reason: 'Already exists' });
      continue;
    }

    console.log(`\n📄 [${i + 1}/${opts.count}] ${topic.channel}: ${topic.question.substring(0, 60)}...`);

    const result = await generateEliteBlogPost(topic);

    if (result.success) {
      generated.push({
        topic,
        blogContent: result.blogContent,
        mdxContent: result.mdxContent,
        qualityResults: result.qualityResults,
        qualityPassed: result.qualityPassed,
      });
      console.log(`   ✅ Generated successfully (quality: ${result.qualityPassed ? 'PASS' : 'FAIL'})`);
    } else {
      failed.push({ topic, error: result.error });
      console.log(`   ❌ Failed: ${result.error}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 GENERATION SUMMARY`);
  console.log(`${'='.repeat(60)}`);
  console.log(`   Generated: ${generated.length}`);
  console.log(`   Skipped:   ${skipped.length}`);
  console.log(`   Failed:    ${failed.length}`);

  if (generated.length === 0) {
    console.log('\n⚠️ No posts were generated. Check the logs above for details.');
    process.exit(0);
  }

  console.log(`\n💾 [PHASE 3] Writing output files...`);
  const written = processBlogOutput(generated, { outputDir: OUTPUT_DIR });
  console.log(`   ✅ Wrote ${written} MDX files to ${OUTPUT_DIR}/`);

  console.log(`\n📚 [PHASE 4] Regenerating blog-data.json...`);
  generateBlogDataJson({ outputDir: OUTPUT_DIR, blogDataDir: BLOG_DATA_DIR, blogDataFile: BLOG_DATA_FILE });

  console.log(`\n✅ ALL DONE!`);
  console.log(`   MDX files: content/posts/`);
  console.log(`   Blog data: data/blog-posts.json`);
  console.log(`   Run 'pnpm run build' to rebuild the frontend with new posts.\n`);
}

main().catch(err => {
  console.error(`\n❌ Fatal error:`, err);
  process.exit(1);
});
