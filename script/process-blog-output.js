/**
 * Blog Output Processor
 *
 * Takes generated blog content and:
 *   1. Writes MDX files to content/posts/
 *   2. Generates blog-data.json for frontend consumption
 *
 * Can run standalone or as part of the generation pipeline.
 *
 * Usage:
 *   node script/process-blog-output.js          # Regenerate from data/blog-posts.json
 *   node script/process-blog-output.js --clean   # Regenerate and clean orphans
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = 'content/posts';
const BLOG_DATA_FILE = 'data/blog-posts.json';
const BLOG_DATA_DIR = 'data/blog-posts';

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .substring(0, 80);
}

/**
 * Write generated blog content to MDX files
 */
export function processBlogOutput(generatedPosts, options = {}) {
  const outputDir = options.outputDir || OUTPUT_DIR;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let count = 0;
  for (const post of generatedPosts) {
    const blog = post.blogContent;
    if (!blog) continue;

    const slug = blog.blogSlug || slugify(blog.blogTitle || 'untitled');
    const filename = `${blog.id || slug}--${slug}.mdx`;
    const filepath = path.join(outputDir, filename);

    const content = post.mdxContent || buildSimpleMDX(blog);
    fs.writeFileSync(filepath, content, 'utf-8');
    count++;
    console.log(`   📄 ${filename}`);
  }

  return count;
}

/**
 * Build a simple MDX string from blog data (fallback if md-serializer wasn't used)
 */
function buildSimpleMDX(blog) {
  const tags = Array.isArray(blog.tags) ? blog.tags.map(t => `"${t}"`).join(', ') : '';
  const date = blog.createdAt ? String(blog.createdAt).slice(0, 10) : new Date().toISOString().slice(0, 10);

  const lines = ['---'];
  lines.push(`id: ${blog.id || ''}`);
  lines.push(`title: "${(blog.blogTitle || '').replace(/"/g, '\\"')}"`);
  lines.push(`slug: ${blog.blogSlug || ''}`);
  lines.push(`date: "${date}"`);
  lines.push(`channel: ${blog.channel || ''}`);
  lines.push(`difficulty: ${blog.difficulty || ''}`);
  if (tags) lines.push(`tags: [${tags}]`);
  lines.push(`---\n`);

  if (blog.blogIntro) lines.push(blog.blogIntro, '');
  if (blog.realWorldExample?.company) {
    lines.push(`> ### Real-World Case — ${blog.realWorldExample.company}\n`);
    if (blog.realWorldExample.scenario) lines.push(`> ${blog.realWorldExample.scenario}\n`);
  }

  if (Array.isArray(blog.blogSections)) {
    for (const section of blog.blogSections) {
      if (section.heading) lines.push(`## ${section.heading}\n`);
      if (section.content) lines.push(section.content, '');
    }
  }

  if (blog.diagram) {
    lines.push(`\`\`\`mermaid\n${blog.diagram}\n\`\`\``, '');
  }

  if (blog.blogConclusion) lines.push(`## Conclusion\n\n${blog.blogConclusion}`, '');
  if (Array.isArray(blog.sources) && blog.sources.length > 0) {
    lines.push('## References\n');
    blog.sources.forEach((s, i) => {
      lines.push(`${i + 1}. [${s.title}](${s.url}) — ${s.type || 'article'}`);
    });
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

/**
 * Generate blog-data.json for frontend
 */
export function generateBlogDataJson(options = {}) {
  const outputDir = options.outputDir || OUTPUT_DIR;
  const blogDataFile = options.blogDataFile || BLOG_DATA_FILE;
  const blogDataDir = options.blogDataDir || BLOG_DATA_DIR;

  if (!fs.existsSync(blogDataDir)) {
    fs.mkdirSync(blogDataDir, { recursive: true });
  }

  const posts = [];
  const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));

  for (const file of files) {
    const filepath = path.join(outputDir, file);
    const content = fs.readFileSync(filepath, 'utf-8');

    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) continue;

    const fm = fmMatch[1];
    const body = content.substring(fmMatch[0].length).trim();

    const idMatch = fm.match(/^id:\s*(.+)$/m);
    const titleMatch = fm.match(/^title:\s*(.+)$/m);
    const slugMatch = fm.match(/^slug:\s*(.+)$/m);
    const channelMatch = fm.match(/^channel:\s*(.+)$/m);
    const difficultyMatch = fm.match(/^difficulty:\s*(.+)$/m);
    const dateMatch = fm.match(/^date:\s*"(.+)"$/m);

    const id = idMatch ? idMatch[1].trim() : file.replace(/\.(md|mdx)$/, '');
    const title = titleMatch ? titleMatch[1].trim().replace(/^"(.*)"$/, '$1') : 'Untitled';
    const slug = slugMatch ? slugMatch[1].trim() : file.replace(/\.(md|mdx)$/, '');
    const channel = channelMatch ? channelMatch[1].trim() : 'General';
    const difficulty = difficultyMatch ? difficultyMatch[1].trim() : null;
    const publishedAt = dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString();

    let tags = [];
    const tagsMatch = fm.match(/^tags:\s*\[([^\]]*)\]/m);
    if (tagsMatch) {
      try {
        tags = JSON.parse(`[${tagsMatch[1]}]`);
      } catch {
        tags = tagsMatch[1].split(',').map(t => t.trim().replace(/"/g, '')).filter(Boolean);
      }
    }

    const excerpt = body.replace(/```[\s\S]*?```/g, '').replace(/[#*`>\[\]]/g, '').substring(0, 250).trim();
    const readingTimeMinutes = Math.max(1, Math.ceil(body.length / 1000));

    posts.push({
      id,
      slug,
      title,
      excerpt,
      content: body,
      coverImage: null,
      author: 'Satishkumar Dhule',
      category: channel,
      tags,
      publishedAt,
      readingTimeMinutes,
      featured: false,
      status: 'published',
      difficulty: difficulty || null,
    });
  }

  posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const categoryMap = new Map();
  for (const post of posts) {
    const cat = post.category;
    const name = cat.charAt(0).toUpperCase() + cat.slice(1);
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, { id: cat, name, slug: cat });
    }
  }
  const categories = Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  const tagSet = new Set();
  for (const post of posts) {
    for (const tag of post.tags) tagSet.add(tag);
  }
  const tags = Array.from(tagSet).sort();

  const output = { posts, categories, tags };

  const blogDataDirPath = path.dirname(blogDataFile);
  if (!fs.existsSync(blogDataDirPath)) {
    fs.mkdirSync(blogDataDirPath, { recursive: true });
  }

  fs.writeFileSync(blogDataFile, JSON.stringify(output, null, 2));
  console.log(`   ✅ Generated ${blogDataFile} (${posts.length} posts, ${categories.length} categories, ${tags.length} tags)`);

  const clientFile = 'client/public/blog-data.json';
  const clientDir = path.dirname(clientFile);
  if (!fs.existsSync(clientDir)) {
    fs.mkdirSync(clientDir, { recursive: true });
  }
  fs.writeFileSync(clientFile, JSON.stringify(output));
  console.log(`   ✅ Synced to ${clientFile}`);

  return output;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const clean = process.argv.includes('--clean');
  console.log(`\n🔄 Regenerating blog-data.json from ${OUTPUT_DIR}/...`);
  generateBlogDataJson({ outputDir: OUTPUT_DIR, blogDataFile: BLOG_DATA_FILE });
  console.log('✅ Done\n');
}
