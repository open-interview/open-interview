/**
 * Export blog-data.json → Astro content collection markdown files
 *
 * Usage:
 *   node scripts/export-to-astro.mjs
 *   node scripts/export-to-astro.mjs --clean   (wipe output dir first)
 *
 * Output: blog-astro/src/content/blog/{slug}.md (121 files)
 *
 * Each file has YAML frontmatter + the cleaned markdown body from the
 * transformed blog-data.json (mermaid fenced, Key Takeaways, bullets, etc.)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DATA_FILE   = path.join(ROOT, 'client', 'public', 'blog-data.json');
const OUTPUT_DIR  = path.join(ROOT, 'blog-astro', 'src', 'content', 'blog');
const CLEAN       = process.argv.includes('--clean');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeYamlValue(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return '[\n' + value.map(v => `  ${safeYamlValue(v)}`).join(',\n') + '\n]';
  }
  // Escape string: wrap in double-quotes, escape inner quotes
  const escaped = String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
    .trim();
  return `"${escaped}"`;
}

function buildFrontmatter(post) {
  const date = post.publishedAt
    ? new Date(post.publishedAt).toISOString()
    : new Date().toISOString();

  const lines = [
    `title: ${safeYamlValue(post.title)}`,
    `excerpt: ${safeYamlValue((post.excerpt || '').slice(0, 250))}`,
    `category: ${safeYamlValue(post.category || 'general')}`,
    `tags: ${safeYamlValue(Array.isArray(post.tags) ? post.tags : [])}`,
    `publishedAt: ${safeYamlValue(date)}`,
    `difficulty: ${safeYamlValue(post.difficulty || 'intermediate')}`,
    `readingTimeMinutes: ${post.readingTimeMinutes || estimateReadingTime(post.content || '')}`,
    `featured: ${post.featured ? 'true' : 'false'}`,
    `author: ${safeYamlValue(
      typeof post.author === 'object'
        ? (post.author?.name ?? 'TechExpert AI')
        : (post.author ?? 'TechExpert AI')
    )}`,
  ];

  if (post.coverImage) lines.push(`coverImage: ${safeYamlValue(post.coverImage)}`);

  return `---\n${lines.join('\n')}\n---`;
}

function estimateReadingTime(content) {
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('📖 Loading blog-data.json...');

  if (!fs.existsSync(DATA_FILE)) {
    console.error(`❌  Not found: ${DATA_FILE}`);
    process.exit(1);
  }

  const { posts } = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  console.log(`   ${posts.length} posts loaded\n`);

  // Optionally wipe output directory
  if (CLEAN && fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
    console.log('🗑️  Cleaned output directory\n');
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let ok = 0, skip = 0, errors = 0;

  for (const post of posts) {
    const slug = post.slug;
    if (!slug) { skip++; continue; }

    const outPath = path.join(OUTPUT_DIR, `${slug}.md`);

    try {
      const frontmatter = buildFrontmatter(post);
      const body = (post.content || '').trim();
      const file = `${frontmatter}\n\n${body}\n`;
      fs.writeFileSync(outPath, file, 'utf8');
      ok++;
    } catch (err) {
      console.error(`  ✗ ${slug}: ${err.message}`);
      errors++;
    }
  }

  console.log('════════════════════════════════════════');
  console.log('📊 EXPORT REPORT');
  console.log('════════════════════════════════════════');
  console.log(`  Exported:  ${ok}`);
  console.log(`  Skipped:   ${skip}`);
  console.log(`  Errors:    ${errors}`);
  console.log(`  Output:    blog-astro/src/content/blog/`);
  console.log('════════════════════════════════════════\n');

  if (errors > 0) process.exit(1);
  console.log('✅  Export complete. Next steps:');
  console.log('   cd blog-astro && npm install && npm run build\n');
}

main().catch(err => { console.error(err); process.exit(1); });
