/**
 * Standalone Blog Generator
 * Generates blog posts with SVGs from question data files (no DB required).
 *
 * Usage:
 *   node script/generate-blog-standalone.js [--count=3] [--channel=system-design]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateBlogSVG, detectScene } from './ai/utils/svg-integration.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(process.cwd(), 'blog-output');
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');

const channels = {
  'system-design': { file: 'data/questions/system-design.json', label: 'System Design' },
  'database': { file: 'data/questions/database.json', label: 'Database' },
  'security': { file: 'data/questions/security.json', label: 'Security' },
  'devops': { file: 'data/questions/devops.json', label: 'DevOps' },
  'frontend': { file: 'data/questions/frontend.json', label: 'Frontend' },
  'backend': { file: 'data/questions/backend.json', label: 'Backend' },
  'kubernetes': { file: 'data/questions/kubernetes.json', label: 'Kubernetes' },
  'aws': { file: 'data/questions/aws.json', label: 'AWS' },
  'machine-learning': { file: 'data/questions/machine-learning.json', label: 'Machine Learning' },
  'networking': { file: 'data/questions/networking.json', label: 'Networking' },
};

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { count: 3, channels: Object.keys(channels) };
  for (const arg of args) {
    if (arg.startsWith('--count=')) opts.count = parseInt(arg.split('=')[1], 10) || 3;
    if (arg.startsWith('--channel=')) opts.channels = [arg.split('=')[1]];
  }
  return opts;
}

function loadQuestions(channel) {
  const info = channels[channel];
  if (!info) return [];
  try {
    const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), info.file), 'utf-8'));
    return data.filter(q => (q.answer || '').length > 100);
  } catch { return []; }
}

function generateContent(question) {
  const title = question.question || question.title || 'Technical Deep Dive';
  const answer = question.answer || question.description || '';
  const difficulty = question.difficulty || 'intermediate';
  const tags = [question.channel || 'general'];

  const sections = [];
  const paragraphs = answer.split('\n').filter(p => p.trim().length > 0);
  const chunkSize = Math.max(1, Math.floor(paragraphs.length / 3));

  // Key Points
  const keyPoints = paragraphs.slice(0, Math.min(3, paragraphs.length))
    .map(p => p.replace(/^[-*#]+\s*/, '').substring(0, 80));

  // Sections
  if (paragraphs.length > 2) {
    sections.push({ heading: 'Understanding the Core Concepts', content: paragraphs.slice(0, chunkSize).join('\n\n') });
    sections.push({ heading: 'Implementation Details', content: paragraphs.slice(chunkSize, chunkSize * 2).join('\n\n') });
  }
  if (paragraphs.length > chunkSize * 2) {
    sections.push({ heading: 'Best Practices & Pitfalls', content: paragraphs.slice(chunkSize * 2, chunkSize * 3).join('\n\n') });
  }

  const remaining = paragraphs.slice(chunkSize * 3);
  if (remaining.length > 0) {
    sections.push({ heading: 'Advanced Considerations', content: remaining.join('\n\n') });
  }

  return { title, difficulty, tags, sections, keyPoints };
}

function generateHTML(post, svgPath) {
  const title = post.title;
  const imgTag = svgPath
    ? `<figure class="article-image"><img src="/images/${path.basename(svgPath)}" alt="${title}" loading="lazy" decoding="async"></figure>`
    : '';

  const sectionsHtml = post.sections.map(s => `
    <section class="article-section">
      <h2>${s.heading}</h2>
      ${s.content.split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('\n      ')}
    </section>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
           background: #0d1117; color: #e6edf3; line-height: 1.7; }
    .container { max-width: 800px; margin: 0 auto; padding: 2rem 1.5rem; }
    header { border-bottom: 1px solid #30363d; padding-bottom: 1.5rem; margin-bottom: 2rem; }
    h1 { font-size: 2rem; font-weight: 600; margin-bottom: 0.5rem; }
    .meta { color: #8b949e; font-size: 0.9rem; display: flex; gap: 1rem; }
    .meta span { background: #21262d; padding: 0.2rem 0.6rem; border-radius: 6px; }
    .article-image { margin: 2rem 0; text-align: center; }
    .article-image img { max-width: 100%; border-radius: 12px; border: 1px solid #30363d; }
    section { margin: 2rem 0; }
    h2 { font-size: 1.4rem; font-weight: 600; margin-bottom: 1rem; color: #58a6ff; }
    p { margin-bottom: 1rem; color: #c9d1d9; }
    .key-points { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 1rem; margin: 1.5rem 0; }
    .key-points h3 { color: #3fb950; margin-bottom: 0.5rem; }
    .key-points li { margin: 0.5rem 0; padding-left: 1.5rem; color: #c9d1d9; list-style: none; }
    .key-points li::before { content: "▸"; color: #58a6ff; margin-right: 0.5rem; margin-left: -1.5rem; }
    footer { border-top: 1px solid #30363d; padding-top: 1.5rem; margin-top: 3rem;
             text-align: center; color: #8b949e; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${title}</h1>
      <div class="meta">
        <span>${post.difficulty}</span>
        ${post.tags.map(t => `<span>${t}</span>`).join('')}
      </div>
    </header>

    ${imgTag}

    <div class="key-points">
      <h3>Key Points</h3>
      <ul>${post.keyPoints.map(p => `<li>${p}</li>`).join('')}</ul>
    </div>

    ${sectionsHtml}

    <footer>
      <p>Generated with AI • ${new Date().toISOString().split('T')[0]}</p>
    </footer>
  </div>
</body>
</html>`;
}

function generateIndexHTML(posts) {
  const items = posts.map((p, i) => `
    <li><a href="post-${i + 1}.html">${p.title}</a>
      <span class="meta-tags">${p.tags.join(', ')}</span></li>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Blog Posts</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           background: #0d1117; color: #e6edf3; max-width: 700px; margin: 0 auto; padding: 2rem; }
    h1 { margin-bottom: 1.5rem; }
    ul { list-style: none; padding: 0; }
    li { padding: 0.75rem 0; border-bottom: 1px solid #21262d; }
    a { color: #58a6ff; text-decoration: none; font-size: 1.1rem; }
    a:hover { text-decoration: underline; }
    .meta-tags { color: #8b949e; font-size: 0.8rem; margin-left: 0.5rem; }
  </style>
</head>
<body>
  <h1>📝 Generated Blog Posts</h1>
  <ul>${items}</ul>
</body>
</html>`;
}

async function main() {
  const opts = parseArgs();
  console.log(`\n=== Generating ${opts.count} blog posts from channels: ${opts.channels.join(', ')} ===\n`);
  
  await fs.promises.mkdir(IMAGES_DIR, { recursive: true });
  
  const posts = [];

  for (const channel of opts.channels) {
    const questions = loadQuestions(channel).slice(0, opts.count);
    console.log(`  ${channel}: ${questions.length} questions loaded`);
    
    for (const q of questions) {
      const post = generateContent(q);
      const scene = detectScene(post.title, post.sections.map(s => s.content).join(' '));
      
      console.log(`\n  📄 "${post.title.substring(0, 60)}..."`);
      console.log(`     Scene: ${scene}`);

      // Generate SVG
      try {
        const result = await generateBlogSVG(post.title, post.sections.map(s => s.content).join(' '), { preferred: 'd3' });
        console.log(`     SVG: ${result.filename} [${result.generator}]`);
        posts.push({ ...post, svgPath: result.path });
      } catch (err) {
        console.log(`     SVG: FAILED - ${err.message}`);
        posts.push({ ...post, svgPath: null });
      }
    }
  }

  // Write HTML posts
  console.log('\n--- Generating HTML ---');
  for (let i = 0; i < posts.length; i++) {
    const html = generateHTML(posts[i], posts[i].svgPath);
    const filename = `post-${i + 1}.html`;
    fs.writeFileSync(path.join(OUTPUT_DIR, filename), html);
    console.log(`  ✓ ${filename}: ${posts[i].title.substring(0, 50)}...`);
  }

  const indexHtml = generateIndexHTML(posts);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHtml);
  console.log(`  ✓ index.html (${posts.length} posts)`);

  const svgCount = posts.filter(p => p.svgPath).length;
  console.log(`\n=== Done! ${posts.length} posts, ${svgCount} SVGs generated in ${OUTPUT_DIR}/ ===`);
  console.log(`Open: file://${OUTPUT_DIR}/index.html`);
}

main().catch(err => { console.error(err); process.exit(1); });
