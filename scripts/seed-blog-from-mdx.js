/**
 * Seed Blog Posts from MDX Files
 * Reads MDX files from content/posts/ and inserts them into the blog_posts table.
 * Skips posts that already exist (by question_id).
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { dbClient as client } from '../script/db/pg-client.js';

const POSTS_DIR = path.join(process.cwd(), 'content/posts');

/**
 * Parse YAML frontmatter (regex-based, no external deps)
 */
function parseYamlFrontmatter(yaml) {
  const result = {};
  const lines = yaml.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Block scalar (diagram: |)
    const blockMatch = line.match(/^(\w+):\s*\|(.*)$/);
    if (blockMatch) {
      const key = blockMatch[1];
      const blockLines = [];
      let indent = null;
      i++;
      while (i < lines.length) {
        const bl = lines[i];
        if (bl.trim() !== '' && /^[\w-]+:/.test(bl)) break;
        if (indent === null) indent = bl.match(/^(\s+)/)?.[1]?.length || 0;
        blockLines.push(bl.slice(indent));
        i++;
      }
      result[key] = blockLines.join('\n');
      continue;
    }

    // Array block (key:\n  - item)
    const arrayKeyMatch = line.match(/^(\w+):\s*$/);
    if (arrayKeyMatch && lines[i + 1] && /^\s+-/.test(lines[i + 1])) {
      const key = arrayKeyMatch[1];
      const items = [];
      i++;
      while (i < lines.length && /^\s+-/.test(lines[i])) {
        const itemLine = lines[i].replace(/^\s+-\s*/, '');
        if (/^\w+:/.test(itemLine)) {
          const obj = {};
          const parseKV = (s) => {
            const m = s.match(/^(\w+):\s*(.*)$/);
            if (m) obj[m[1]] = m[2].replace(/^["']|["']$/g, '');
          };
          parseKV(itemLine);
          i++;
          while (i < lines.length && /^\s{4,}\w+:/.test(lines[i])) {
            parseKV(lines[i].trim());
            i++;
          }
          items.push(obj);
        } else {
          items.push(itemLine.replace(/^["']|["']$/g, ''));
          i++;
        }
      }
      result[key] = items;
      continue;
    }

    // Inline array: key: [a, b, c]
    const inlineArrayMatch = line.match(/^(\w+):\s*\[(.+)\]$/);
    if (inlineArrayMatch) {
      result[inlineArrayMatch[1]] = inlineArrayMatch[2]
        .split(',')
        .map(s => s.trim().replace(/^["']|["']$/g, ''));
      i++;
      continue;
    }

    // Key: "quoted value" or key: plain value
    const kvMatch = line.match(/^(\w+):\s*(.+)$/);
    if (kvMatch) {
      result[kvMatch[1]] = kvMatch[2].replace(/^["']|["']$/g, '');
    }
    i++;
  }
  return result;
}

/**
 * Parse a single MDX file and extract structured data
 */
function parseMdxFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) {
    return null;
  }

  const fm = parseYamlFrontmatter(fmMatch[1]);
  const body = fmMatch[2];

  // Extract introduction from first blockquote
  const introMatch = body.match(/^>\s*(.+)/m);
  const introduction = introMatch
    ? introMatch[1].replace(/^\*\*(?:Picture this:|[^*]+)\*\*\s*/, '').trim()
    : '';

  // Extract sections from ## headings (exclude Conclusion/Wrapping Up)
  const sectionParts = body.split(/^(?=## )/m);
  const sections = [];
  let conclusion = '';

  for (const part of sectionParts) {
    const headingMatch = part.match(/^## (.+)\n([\s\S]*)/);
    if (!headingMatch) continue;
    const heading = headingMatch[1].trim();
    const content = headingMatch[2].trim();
    if (/^(wrapping up|conclusion)$/i.test(heading)) {
      conclusion = content;
    } else if (content) {
      sections.push({ heading, content });
    }
  }

  const fileId = fm.id || path.basename(filePath).replace('.mdx', '').split('--')[0];

  return {
    id: crypto.randomUUID(),
    question_id: fileId,
    title: fm.title || '',
    slug: fm.slug || '',
    channel: fm.channel || '',
    difficulty: fm.difficulty || '',
    tags: Array.isArray(fm.tags) ? fm.tags : [],
    createdAt: fm.createdAt || new Date().toISOString(),
    introduction,
    sections,
    conclusion,
    metaDescription: fm.metaDescription || fm.description || '',
    diagram: fm.diagram || null,
    funFact: fm.funFact || null,
    images: Array.isArray(fm.images) ? fm.images : [],
    sources: Array.isArray(fm.sources) ? fm.sources : [],
  };
}

/**
 * Main seed function
 */
async function seed() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error(`❌ Directory not found: ${POSTS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.mdx'));

  if (files.length === 0) {
    console.log('⚠️ No MDX files found in content/posts/');
    process.exit(0);
  }

  console.log(`Seeding ${files.length} posts...\n`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  // Build a set of existing question_ids for fast lookup
  const existingResult = await client.execute('SELECT question_id FROM blog_posts');
  const existingIds = new Set(existingResult.rows.map(r => r.question_id));

  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);

    try {
      const post = parseMdxFile(filePath);

      if (!post) {
        console.log(`⚠️ Skipped (invalid MDX): ${file}`);
        errors++;
        continue;
      }

      if (existingIds.has(post.question_id)) {
        console.log(`⏭️ Skipped (exists): ${post.title}`);
        skipped++;
        continue;
      }

      await client.execute({
        sql: `INSERT INTO blog_posts
          (id, question_id, title, slug, introduction, sections, conclusion,
           meta_description, channel, difficulty, tags, diagram,
           fun_fact, images, sources, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          post.id,
          post.question_id,
          post.title,
          post.slug,
          post.introduction,
          JSON.stringify(post.sections),
          post.conclusion,
          post.metaDescription,
          post.channel,
          post.difficulty,
          JSON.stringify(post.tags),
          post.diagram,
          post.funFact,
          JSON.stringify(post.images),
          JSON.stringify(post.sources),
          post.createdAt,
        ],
      });

      console.log(`✅ Inserted: ${post.title}`);
      inserted++;
      existingIds.add(post.question_id);
    } catch (err) {
      console.error(`❌ Error processing ${file}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n📊 Seed complete: ${inserted} inserted, ${skipped} skipped, ${errors} errors`);
}

seed()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Fatal error:', err.message);
    process.exit(1);
  });
