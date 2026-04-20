#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_FILE = path.join(__dirname, '../data/blog-posts.json');
const OUT_DIR = path.join(__dirname, '../content/posts');

// Quote a YAML string value if it contains special chars
function yamlStr(val) {
  if (!val) return '""';
  const s = String(val);
  if (/[:#\[\]{}&*!|>'"%@`,]/.test(s) || s.includes('\n') || s.startsWith(' ') || s.endsWith(' ')) {
    return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  }
  return s;
}

// Decode HTML entities
function decodeHtml(str) {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'");
}

// Build YAML frontmatter
function buildFrontmatter(p) {
  const lines = ['---'];
  lines.push(`id: ${p.id}`);
  lines.push(`title: ${yamlStr(p.blogTitle)}`);
  lines.push(`slug: ${p.blogSlug}`);
  lines.push(`channel: ${p.channel}`);
  lines.push(`difficulty: ${p.difficulty}`);

  const tags = (p.tags || []).map(t => JSON.stringify(t)).join(', ');
  lines.push(`tags: [${tags}]`);

  lines.push(`createdAt: ${p.createdAt}`);

  if (p.funFact) {
    lines.push(`funFact: ${yamlStr(p.funFact)}`);
  }

  if (p.diagram) {
    lines.push('diagram: |');
    p.diagram.split('\n').forEach(l => lines.push('  ' + l));
  }

  if (p.images && p.images.length) {
    lines.push('images:');
    p.images.forEach(img => {
      lines.push(`  - url: ${img.url}`);
      lines.push(`    alt: ${yamlStr(img.alt || '')}`);
      lines.push(`    placement: ${img.placement || 'after-intro'}`);
    });
  } else {
    lines.push('images: []');
  }

  if (p.sources && p.sources.length) {
    lines.push('sources:');
    p.sources.forEach(s => {
      lines.push(`  - title: ${yamlStr(s.title)}`);
      lines.push(`    url: ${s.url}`);
      lines.push(`    type: ${s.type}`);
    });
  } else {
    lines.push('sources: []');
  }

  lines.push('---');
  return lines.join('\n');
}

// Build markdown body from sections
function buildBody(p) {
  const parts = [];

  if (p.blogIntro) {
    parts.push(`> **Picture this:** ${decodeHtml(p.blogIntro)}\n`);
  }

  (p.blogSections || []).forEach(sec => {
    parts.push(`## ${sec.heading}\n`);
    parts.push(decodeHtml(sec.content) + '\n');
  });

  if (p.blogConclusion) {
    parts.push(`## Conclusion\n`);
    parts.push(decodeHtml(p.blogConclusion) + '\n');
  }

  return parts.join('\n');
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const posts = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
let created = 0, skipped = 0;

for (const post of posts) {
  const filename = `${post.id}--${post.blogSlug}.mdx`;
  const outPath = path.join(OUT_DIR, filename);

  if (fs.existsSync(outPath)) {
    console.log(`SKIP  ${filename}`);
    skipped++;
    continue;
  }

  const content = buildFrontmatter(post) + '\n\n' + buildBody(post);
  fs.writeFileSync(outPath, content, 'utf8');
  console.log(`WRITE ${filename}`);
  created++;
}

console.log(`\nDone: ${created} created, ${skipped} skipped.`);
