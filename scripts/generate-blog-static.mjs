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

// ── Content builder (mirrors server/blog-storage-local.ts) ────────────────────
function buildContent(entry) {
  const blogIntro      = entry.blogIntro      || '';
  const blogSections   = entry.blogSections   || [];
  const blogConclusion = entry.blogConclusion || '';
  const diagram        = entry.diagram        || '';
  const images         = entry.images         || [];

  const parts = [];

  // 1. Intro
  if (blogIntro) parts.push(blogIntro);

  // 2. After-intro images
  for (const img of images) {
    if (img.placement === 'after-intro' && img.url) {
      const alt = img.alt || img.caption || '';
      parts.push(`![${alt}](${img.url})`);
      if (img.caption) parts.push(`*${img.caption}*`);
    }
  }

  // 3. Sections
  for (const section of blogSections) {
    const heading = section.heading ? `## ${section.heading}\n\n` : '';
    parts.push(`${heading}${section.content || ''}`);
  }

  // 4. Architecture diagram (Mermaid)
  if (diagram && diagram.trim().length > 10) {
    parts.push(`## Architecture Diagram\n\n\`\`\`mermaid\n${diagram.trim()}\n\`\`\``);
  }

  // 5. Conclusion
  if (blogConclusion && blogConclusion.trim().length > 10) {
    parts.push(`## Conclusion\n\n${blogConclusion.trim()}`);
  }

  return parts.join('\n\n');
}

// ── Process posts ─────────────────────────────────────────────────────────────
const posts = rawData.map((entry) => {
  const id          = entry.id || '';
  const blogTitle   = entry.blogTitle || '';
  const blogSlug    = entry.blogSlug || '';
  const blogIntro   = entry.blogIntro || '';
  const channel     = entry.channel || 'General';
  const difficulty  = entry.difficulty || undefined;

  let tags = [];
  if (Array.isArray(entry.tags)) {
    tags = entry.tags;
  } else if (typeof entry.tags === 'string') {
    try { tags = JSON.parse(entry.tags); } catch { tags = []; }
  }

  const content = buildContent(entry);

  let publishedAt = '';
  const idMatch = id.match(/^blog-(\d+)-/);
  if (idMatch) {
    const ts = parseInt(idMatch[1], 10);
    if (!isNaN(ts)) publishedAt = new Date(ts).toISOString();
  }
  if (!publishedAt) publishedAt = entry.createdAt || new Date().toISOString();

  const readingTimeMinutes = Math.max(1, Math.ceil(content.length / 1000));

  return {
    id,
    slug: blogSlug,
    title: blogTitle,
    excerpt: blogIntro ? blogIntro.slice(0, 250) : '',
    content,
    coverImage: null,
    author: 'TechExpert AI',
    category: channel,
    tags,
    publishedAt,
    readingTimeMinutes,
    featured: false,
    status: 'published',
    difficulty: difficulty || null,
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
console.log(`✓ Generated ${OUTPUT} (${kb} KB, ${posts.length} posts, ${categories.length} categories, ${tags.length} tags)`);
