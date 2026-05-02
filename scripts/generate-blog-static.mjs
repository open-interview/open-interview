/**
 * Generates client/public/blog-data.json from data/blog-posts.json.
 * This static file is used by the frontend when the Express API is
 * unavailable (e.g. GitHub Pages static deployment).
 *
 * Run: node scripts/generate-blog-static.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const INPUT  = path.join(ROOT, 'data', 'blog-posts.json');
const OUTPUT = path.join(ROOT, 'client', 'public', 'blog-data.json');

const rawData = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));

// ── Process posts (mirrors server/blog-storage-local.ts) ─────────────────────
const posts = rawData.map((entry) => {
  const id          = entry.id || '';
  const blogTitle   = entry.blogTitle || '';
  const blogSlug    = entry.blogSlug || '';
  const blogIntro   = entry.blogIntro || '';
  const blogSections = entry.blogSections || [];
  const channel     = entry.channel || 'General';

  let tags = [];
  if (Array.isArray(entry.tags)) {
    tags = entry.tags;
  } else if (typeof entry.tags === 'string') {
    try { tags = JSON.parse(entry.tags); } catch { tags = []; }
  }

  // Build content identical to how the server does it
  const contentParts = [];
  if (blogIntro) contentParts.push(blogIntro);
  for (const section of blogSections) {
    const heading = section.heading ? `## ${section.heading}\n\n` : '';
    contentParts.push(`${heading}${section.content || ''}`);
  }
  const content = contentParts.join('\n\n');

  let publishedAt = '';
  const idMatch = id.match(/^blog-(\d+)-/);
  if (idMatch) {
    const ts = parseInt(idMatch[1], 10);
    if (!isNaN(ts)) publishedAt = new Date(ts).toISOString();
  }
  if (!publishedAt) publishedAt = new Date().toISOString();

  const readingTimeMinutes = Math.max(1, Math.ceil(content.length / 1000));

  return {
    id,
    slug: blogSlug,
    title: blogTitle,
    excerpt: blogIntro || '',
    content,
    coverImage: undefined,
    author: 'TechExpert AI',
    category: channel,
    tags,
    publishedAt,
    readingTimeMinutes,
    featured: false,
    status: 'published',
  };
});

// Sort newest first (same as server)
posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

// ── Categories ────────────────────────────────────────────────────────────────
const categoryMap = new Map();
for (const post of posts) {
  if (!categoryMap.has(post.category)) {
    const name = post.category.charAt(0).toUpperCase() + post.category.slice(1);
    categoryMap.set(post.category, { id: post.category, name, slug: post.category });
  }
}
const categories = Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));

// ── Tags ──────────────────────────────────────────────────────────────────────
const tagSet = new Set();
for (const post of posts) {
  for (const tag of post.tags) tagSet.add(tag);
}
const tags = Array.from(tagSet).sort();

// ── Write output ──────────────────────────────────────────────────────────────
const output = { posts, categories, tags };
fs.writeFileSync(OUTPUT, JSON.stringify(output));

const kb = Math.round(fs.statSync(OUTPUT).size / 1024);
console.log(`✓ Generated ${OUTPUT} (${kb} KB, ${posts.length} posts)`);
