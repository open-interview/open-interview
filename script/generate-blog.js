/**
 * Blog Generator Script
 * Generates 1 new blog post per run from interview questions dataset
 * Maintains a blog_posts table to track converted questions
 * Uses LangGraph pipeline to find real-world cases and generate engaging articles
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { marked } from 'marked';
import { fileURLToPath } from 'url';
import { generateBlogPost } from './ai/graphs/blog-graph.js';
import { generateIllustration, generatePixelIllustration } from './ai/utils/blog-illustration-generator.js';
import { dbClient as client } from './db/pg-client.js';
import { serializeMD } from './ai/utils/md-serializer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_POSTS_DIR = path.join(process.cwd(), 'data', 'blog-posts');

// Author info for credits
const AUTHOR = {
  name: 'Satishkumar Dhule',
  role: 'Software Engineer',
  github: 'https://github.com/satishkumar-dhule',
  linkedin: 'https://linkedin.com/in/satishkumar-dhule',
  website: 'https://satishkumar-dhule.github.io',
  avatar: 'https://github.com/satishkumar-dhule.png'
};

const OUTPUT_DIR = 'blog-output';
const MIN_SOURCES = 8;
const MAX_SKIP_ATTEMPTS = 5; // Max questions to try before giving up
const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID || 'G-47MSM57H95';

/**
 * Validate a URL by checking if it returns a valid response (not 404)
 */
async function validateUrl(url, timeout = 5000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BlogBot/1.0)'
      }
    });
    
    clearTimeout(timeoutId);
    
    // 410 Gone is always invalid
    if (response.status === 410) return false;
    
    // Direct success
    if (response.ok) return true;
    
    // 403/405 likely means Cloudflare/WAF blocking - try GET with real UA
    if (response.status === 403 || response.status === 405) {
      return await validateUrlWithGet(url, timeout);
    }
    
    return false;
  } catch {
    return await validateUrlWithGet(url, timeout);
  }
}

async function validateUrlWithGet(url, timeout = 5000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    clearTimeout(timeoutId);
    return response.ok && response.status !== 410;
  } catch {
    return false;
  }
}

/**
 * Validate all sources and remove invalid ones
 */
async function validateSources(sources) {
  if (!sources || !Array.isArray(sources)) return [];
  
  console.log(`   🔍 Validating ${sources.length} sources...`);
  
  const validationResults = await Promise.all(
    sources.map(async (source) => {
      if (!source.url || !source.title) return null;
      
      const isValid = await validateUrl(source.url);
      if (isValid) {
        console.log(`   ✅ ${source.title.substring(0, 40)}...`);
        return source;
      } else {
        // Determine reason: blocked (403/405) vs missing (404/other)
        try {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 3000);
          const resp = await fetch(source.url, { method: 'HEAD', signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BlogBot/1.0)' } });
          clearTimeout(tid);
          if (resp.status === 403 || resp.status === 405) {
            console.log(`   🚫 Removed (blocked): ${source.url}`);
          } else {
            console.log(`   ❌ Removed (404): ${source.url}`);
          }
        } catch {
          console.log(`   ❌ Removed (unreachable): ${source.url}`);
        }
        return null;
      }
    })
  );
  
  const validatedSources = validationResults.filter(s => s !== null);
  
  console.log(`   📊 Valid sources: ${validatedSources.length}/${sources.length}`);
  return validatedSources;
}

// Theme configurations
const themes = {
  midnight: {
    name: 'Midnight',
    bg: '#0a0a0a', bgSecondary: '#111', bgCard: '#1a1a1a',
    text: '#fff', textSecondary: '#a0a0a0',
    accent: '#22c55e', accentHover: '#16a34a',
    border: '#2a2a2a', gradient: 'linear-gradient(135deg, #22c55e, #4ade80)'
  },
  ocean: {
    name: 'Ocean',
    bg: '#0c1222', bgSecondary: '#131d33', bgCard: '#1a2744',
    text: '#e2e8f0', textSecondary: '#94a3b8',
    accent: '#38bdf8', accentHover: '#0ea5e9',
    border: '#1e3a5f', gradient: 'linear-gradient(135deg, #38bdf8, #818cf8)'
  },
  sunset: {
    name: 'Sunset',
    bg: '#18181b', bgSecondary: '#1f1f23', bgCard: '#27272a',
    text: '#fafafa', textSecondary: '#a1a1aa',
    accent: '#f97316', accentHover: '#ea580c',
    border: '#3f3f46', gradient: 'linear-gradient(135deg, #f97316, #fb923c)'
  },
  forest: {
    name: 'Forest',
    bg: '#0f1a0f', bgSecondary: '#142014', bgCard: '#1a2a1a',
    text: '#ecfdf5', textSecondary: '#86efac',
    accent: '#4ade80', accentHover: '#22c55e',
    border: '#2d4a2d', gradient: 'linear-gradient(135deg, #4ade80, #a3e635)'
  },
  lavender: {
    name: 'Lavender',
    bg: '#13111c', bgSecondary: '#1a1625', bgCard: '#221d2e',
    text: '#f5f3ff', textSecondary: '#c4b5fd',
    accent: '#a78bfa', accentHover: '#8b5cf6',
    border: '#3b2d5c', gradient: 'linear-gradient(135deg, #a78bfa, #f472b6)'
  }
};

const DEFAULT_THEME = 'midnight';

// Channel category mapping
const categoryMap = {
  'System Design': ['system-design'],
  'Algorithms & Data Structures': ['algorithms'],
  'Frontend Development': ['frontend', 'react-native'],
  'Backend Development': ['backend', 'python'],
  'Database & Storage': ['database'],
  'DevOps & Infrastructure': ['devops', 'terraform', 'kubernetes', 'aws', 'aws-devops-pro'],
  'Site Reliability': ['sre'],
  'AI & Machine Learning': ['generative-ai', 'machine-learning', 'llm-ops', 'prompt-engineering', 'nlp', 'computer-vision'],
  'Security': ['security'],
  'Testing & QA': ['testing', 'e2e-testing', 'api-testing', 'performance-testing'],
  'Mobile Development': ['ios', 'android'],
  'Networking & Systems': ['networking', 'linux', 'unix', 'operating-systems'],
  'Leadership & Soft Skills': ['behavioral', 'engineering-management'],
  'Data Engineering': ['data-engineering'],
};


// DEPRECATED: Schema is now managed by Drizzle ORM migrations.
// Run `pnpm db:push` to apply schema changes.
// This function is kept for backwards compatibility only.
async function initBlogPostsTable() {
  console.log('📦 Blog schema managed by Drizzle ORM. Run `pnpm db:push` for migrations.');
}

// Allowed channels for blog generation
const ALLOWED_BLOG_CHANNELS = [
  'sre',
  'devops',
  'kubernetes',
  'aws',
  'terraform',
  'docker',
  'linux',
  'unix',
  'generative-ai',
  'llm-ops',
  'machine-learning',
  'prompt-engineering'
];

// Get next question to convert — reads from data/questions/, skips already-blogged IDs
async function getNextQuestionForBlog(limit = 1) {
  const questionsDir = path.join(process.cwd(), 'data', 'questions');
  fs.mkdirSync(BLOG_POSTS_DIR, { recursive: true });

  // Collect already-blogged question IDs from data/blog-posts/
  const bloggedIds = new Set(
    fs.readdirSync(BLOG_POSTS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => { try { return JSON.parse(fs.readFileSync(path.join(BLOG_POSTS_DIR, f), 'utf8')).questionId; } catch { return null; } })
      .filter(Boolean)
  );

  const candidates = [];
  for (const ch of ALLOWED_BLOG_CHANNELS) {
    const file = path.join(questionsDir, `${ch}.json`);
    if (!fs.existsSync(file)) continue;
    try {
      const qs = JSON.parse(fs.readFileSync(file, 'utf8'));
      for (const q of qs) {
        if (!bloggedIds.has(q.id) && q.explanation && q.explanation.length > 100) {
          candidates.push({ id: q.id, question: q.question, answer: q.answer, explanation: q.explanation, diagram: q.diagram, difficulty: q.difficulty, tags: Array.isArray(q.tags) ? q.tags : [], channel: q.channel, subChannel: q.subChannel, companies: Array.isArray(q.companies) ? q.companies : [] });
        }
      }
    } catch {}
  }

  if (!candidates.length) return [];
  // Shuffle and return limit
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates.slice(0, limit);
}

// Parse YAML frontmatter from MDX files using js-yaml
function parseYamlFrontmatter(content) {
  try {
    const parsed = yaml.load(content);
    return parsed || {};
  } catch (e) {
    console.error('Failed to parse YAML frontmatter:', e.message);
    return {};
  }
}

function loadPostsFromMDX() {
  const postsDir = path.join(process.cwd(), 'content/posts');
  if (!fs.existsSync(postsDir)) return [];
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.mdx'));
  if (!files.length) return [];

  return files.map(file => {
    const raw = fs.readFileSync(path.join(postsDir, file), 'utf-8');
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!fmMatch) return null;

    const fm = parseYamlFrontmatter(fmMatch[1]);
    const body = fmMatch[2];

    // blockquote → blogIntro
    const introMatch = body.match(/^>\s*(.+)/m);
    const blogIntro = introMatch ? introMatch[1].replace(/^\*\*.*?\*\*\s*/, '') : '';

    // ## headings → blogSections (exclude Conclusion/Wrapping Up)
    const sectionParts = body.split(/^(?=## )/m);
    const blogSections = [];
    let conclusionText = '';
    for (const part of sectionParts) {
      const headingMatch = part.match(/^## (.+)\n([\s\S]*)/);
      if (!headingMatch) continue;
      const heading = headingMatch[1].trim();
      const content = headingMatch[2].trim();
      if (/^(wrapping up|conclusion)$/i.test(heading)) {
        conclusionText = content;
      } else if (content) {
        blogSections.push({ heading, content });
      }
    }

    return {
      id: fm.id || file.replace('.mdx', ''),
      blogTitle: fm.title || '',
      blogSlug: fm.slug || '',
      blogIntro,
      blogSections,
      blogConclusion: conclusionText,
      blogMeta: fm.metaDescription || fm.description || '',
      channel: fm.channel || '',
      difficulty: fm.difficulty || '',
      tags: Array.isArray(fm.tags) ? fm.tags : [],
      createdAt: fm.createdAt || '',
      funFact: fm.funFact || '',
      diagram: fm.diagram || '',
      images: Array.isArray(fm.images) ? fm.images.map(img => ({ ...img, placement: img.placement || 'after-intro' })) : [],
      sources: Array.isArray(fm.sources) ? fm.sources : [],
      svgContent: {},
    };
  }).filter(Boolean);
}

// Get all existing blog posts
async function getAllBlogPosts() {
  const jsonPosts = [];
  if (fs.existsSync(BLOG_POSTS_DIR)) {
    const files = fs.readdirSync(BLOG_POSTS_DIR).filter(f => f.endsWith('.json'));
    for (const f of files) {
      try {
        const post = JSON.parse(fs.readFileSync(path.join(BLOG_POSTS_DIR, f), 'utf8'));
        jsonPosts.push(post);
      } catch {}
    }
  }
  jsonPosts.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const jsonIds = new Set(jsonPosts.map(p => p.id));
  const mdxPosts = loadPostsFromMDX().filter(p => !jsonIds.has(p.id));
  if (mdxPosts.length) console.log(`📂 Merged ${mdxPosts.length} MDX-only posts`);
  return [...jsonPosts, ...mdxPosts];
}

// Save blog post as MDX file
function savePostAsMDX(post) {
  const outDir = path.join(process.cwd(), 'content/posts');
  fs.mkdirSync(outDir, { recursive: true });

  const frontmatterObj = {
    id: post.id,
    title: post.blogTitle,
    slug: post.blogSlug,
    channel: post.channel,
    difficulty: post.difficulty,
    tags: post.tags || [],
    createdAt: post.createdAt,
  };
  if (post.funFact) frontmatterObj.funFact = post.funFact;
  if (post.diagram) frontmatterObj.diagram = post.diagram;
  frontmatterObj.images = (post.images && post.images.length) ? post.images : [];
  frontmatterObj.sources = (post.sources && post.sources.length) ? post.sources : [];

  const frontmatter = yaml.dump(frontmatterObj, { lineWidth: -1 });
  const fullFrontmatter = `---\n${frontmatter}---`;

  const parts = [];
  if (post.blogIntro) parts.push(`> **Picture this:** ${post.blogIntro}\n`);
  (post.blogSections || []).forEach(sec => {
    parts.push(`## ${sec.heading}\n`);
    parts.push(sec.content + '\n');
  });
  if (post.funFact) parts.push(`> 💡 **Did you know?** ${post.funFact}\n`);
  if (post.sources && post.sources.length) {
    parts.push('## References\n');
    post.sources.forEach((s, i) => parts.push(`${i + 1}. [${s.title}](${s.url})`));
    parts.push('');
  }
  if (post.blogConclusion) {
    parts.push('## Wrapping Up\n');
    parts.push(post.blogConclusion + '\n');
  }
  const body = parts.join('\n');

  const filename = `${post.id}--${post.blogSlug}.mdx`;
  fs.writeFileSync(path.join(outDir, filename), fullFrontmatter + '\n' + body, 'utf8');
}

async function saveBlogPost(questionId, blogContent, question, svgContent = {}) {
  const now = new Date().toISOString();
  const diagram = blogContent.diagram || question.diagram;
  const id = `blog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const slug = blogContent.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

  fs.mkdirSync(BLOG_POSTS_DIR, { recursive: true });
  const post = {
    id, questionId, blogTitle: blogContent.title, blogSlug: slug,
    channel: question.channel, difficulty: question.difficulty,
    tags: question.tags || [], diagram, diagramType: blogContent.diagramType || null,
    diagramLabel: blogContent.diagramLabel || null,
    blogIntro: blogContent.introduction, blogSections: blogContent.sections,
    blogConclusion: blogContent.conclusion, metaDescription: blogContent.metaDescription,
    quickReference: blogContent.quickReference || [], glossary: blogContent.glossary || [],
    realWorldExample: blogContent.realWorldExample || null, funFact: blogContent.funFact || null,
    sources: blogContent.sources || [], images: blogContent.images || [],
    socialSnippet: blogContent.socialSnippet || null, svgContent,
    status: 'published', createdAt: now,
  };
  fs.writeFileSync(path.join(BLOG_POSTS_DIR, `${id}.json`), JSON.stringify(post, null, 2));
  console.log(`   ✅ Saved blog post: ${id}.json`);

  // Also generate standalone Markdown file
  try {
    const mdPost = {
      id,
      question_id: questionId,
      blogTitle: blogContent.title,
      title: blogContent.title,
      blogSlug: slug,
      slug,
      channel: question.channel,
      difficulty: question.difficulty,
      tags: question.tags,
      createdAt: now,
      funFact: blogContent.funFact || null,
      fun_fact: blogContent.funFact || null,
      diagram: diagram || null,
      diagramLabel: blogContent.diagramLabel || null,
      diagram_label: blogContent.diagramLabel || null,
      images: blogContent.images || [],
      sources: blogContent.sources || [],
      blogIntro: blogContent.introduction,
      introduction: blogContent.introduction,
      blogSections: blogContent.sections,
      sections: blogContent.sections,
      blogConclusion: blogContent.conclusion,
      conclusion: blogContent.conclusion,
      blogMeta: blogContent.metaDescription,
      meta_description: blogContent.metaDescription,
      quickReference: blogContent.quickReference || [],
      quick_reference: blogContent.quickReference || [],
      glossary: blogContent.glossary || [],
      realWorldExample: blogContent.realWorldExample || null,
      real_world_example: blogContent.realWorldExample || null,
      svgContent,
      svg_content: svgContent,
      relatedQuestions: blogContent.relatedQuestions || [],
      category: getCategoryForChannel(question.channel) || '',
    };
    const originalQuestion = { question: question.question, answer: question.answer };
    const mdContent = serializeMD(mdPost, originalQuestion);
    const mdDir = path.resolve('content/posts');
    fs.mkdirSync(mdDir, { recursive: true });
    const mdPath = path.join(mdDir, `${slug}.md`);
    fs.writeFileSync(mdPath, mdContent, 'utf-8');
    console.log(`   📄 Standalone MD: ${mdPath}`);
  } catch (err) {
    console.warn(`   ⚠️ MD write failed (non-fatal): ${err.message}`);
  }
  return id;
}

// Update SVG content for existing blog post
async function updateSvgContent(blogPostId, svgContent) {
  const file = path.join(BLOG_POSTS_DIR, `${blogPostId}.json`);
  if (!fs.existsSync(file)) return;
  try {
    const post = JSON.parse(fs.readFileSync(file, 'utf8'));
    post.svgContent = svgContent;
    fs.writeFileSync(file, JSON.stringify(post, null, 2));
  } catch {}
}

// Get blog stats
async function getBlogStats() {
  if (!fs.existsSync(BLOG_POSTS_DIR)) return { total: 0, byChannel: [] };
  const files = fs.readdirSync(BLOG_POSTS_DIR).filter(f => f.endsWith('.json'));
  const byChannel = {};
  for (const f of files) {
    try { const p = JSON.parse(fs.readFileSync(path.join(BLOG_POSTS_DIR, f), 'utf8')); byChannel[p.channel] = (byChannel[p.channel] || 0) + 1; } catch {}
  }
  return { total: files.length, byChannel: Object.entries(byChannel).map(([channel, count]) => ({ channel, count })) };
}
// Helper functions
function getCategoryForChannel(channel) {
  for (const [category, channels] of Object.entries(categoryMap)) {
    if (channels.includes(channel)) return category;
  }
  return 'Other';
}

function formatChannelName(channel) {
  return channel.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

async function generateUniqueSlug(title) {
  const base = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 80);
  const existingSlugs = new Set();
  if (fs.existsSync(BLOG_POSTS_DIR)) {
    const files = fs.readdirSync(BLOG_POSTS_DIR).filter(f => f.endsWith('.json'));
    for (const f of files) {
      try {
        const post = JSON.parse(fs.readFileSync(path.join(BLOG_POSTS_DIR, f), 'utf8'));
        if (post.blogSlug) existingSlugs.add(post.blogSlug);
      } catch {}
    }
  }
  if (!existingSlugs.has(base)) return base;
  let suffix = 2;
  while (existingSlugs.has(`${base}-${suffix}`)) suffix++;
  return `${base}-${suffix}`;
}

function escapeHtml(text) {
  if (!text) return '';
  if (typeof text !== 'string') text = String(text);
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Escape HTML and convert citation references [1], [2] to clickable links
function escapeHtmlWithCitations(text) {
  if (!text) return '';
  let html = escapeHtml(text);
  // Convert [1], [2], etc. to citation links
  html = html.replace(/\[(\d+)\]/g, '<a href="#source-$1" class="citation" title="View source">$1</a>');
  return html;
}


function markdownToHtml(md, glossary = []) {
  if (!md) return '';
  
  // Configure marked with custom renderer
  const renderer = new marked.Renderer();
  
  // marked v15+ passes token objects instead of (code, language) / (href, title, text)
  renderer.code = (token) => {
    const code = typeof token === 'object' ? (token.text || '') : String(token || '');
    const language = typeof token === 'object' ? (token.lang || '') : '';
    if (language === 'mermaid') {
      return `<div class="mermaid">${code.trim()}</div>`;
    }
    const langClass = language ? ` class="language-${language}"` : '';
    return `<pre><code${langClass}>${escapeHtml(code)}</code></pre>`;
  };

  renderer.link = (token) => {
    const href = typeof token === 'object' ? (token.href || '#') : String(token || '#');
    const title = typeof token === 'object' ? (token.title || '') : '';
    const text = typeof token === 'object' ? (token.text || '') : '';
    return `<a href="${href}"${title ? ` title="${title}"` : ''}>${text}</a>`;
  };
  
  marked.setOptions({ renderer, gfm: true, breaks: true });
  
  let html = marked.parse(md);
  
  // Convert inline citations [1], [2] to clickable links
  html = html.replace(/\[(\d+)\]/g, '<a href="#source-$1" class="citation" title="View source">$1</a>');
  
  // Add glossary tooltips
  if (glossary && glossary.length > 0) {
    for (const term of glossary) {
      const regex = new RegExp(`\\b(${term.term})\\b`, 'gi');
      html = html.replace(regex, `<span class="glossary-term" data-tooltip="${term.definition}">$1</span>`);
    }
  }
  
  return html;
}



// Transform Q&A to blog using LangGraph pipeline
async function transformToBlogArticle(question) {
  console.log('🤖 Running LangGraph blog pipeline...');
  
  const result = await generateBlogPost(question);
  
  if (!result.success) {
    if (result.skipped) {
      console.log(`⏭️ Skipped: ${result.skipReason}`);
      return { skipped: true, skipReason: result.skipReason };
    }
    throw new Error(result.error || 'Blog generation failed');
  }
  
  console.log('✅ LangGraph pipeline complete');
  return result.blogContent;
}

// CSS Generation - reads from the shared design system file
function generateCSS() {
  const cssPath = path.join(process.cwd(), 'blog-output', 'style.css');
  if (fs.existsSync(cssPath)) {
    return fs.readFileSync(cssPath, 'utf-8');
  }
  // Minimal fallback if file not found
  return `
:root {
  /* GitHub-inspired dark mode */
  --bg: #0d1117; --bg-secondary: #161b22; --bg-card: #161b22; --bg-elevated: #21262d;
  --text: #f0f6fc; --text-secondary: #8b949e; --text-muted: #6e7681;
  --accent: #58a6ff; --accent-secondary: #1f6feb; --accent-glow: rgba(88,166,255,0.15);
  --border: #30363d; --border-hover: #58a6ff;
  --gradient: linear-gradient(135deg, #58a6ff 0%, #a371f7 50%, #f778ba 100%);
  --gradient-subtle: linear-gradient(135deg, rgba(88,166,255,0.1) 0%, rgba(163,113,247,0.05) 100%);
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-md: 0 3px 6px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.5), 0 16px 48px rgba(0,0,0,0.4);
  --shadow-glow: 0 0 20px rgba(88,166,255,0.3);
  --radius-sm: 6px; --radius-md: 12px; --radius-lg: 16px; --radius-xl: 24px;
  --success: #3fb950; --warning: #d29922; --error: #f85149;
  --purple: #a371f7; --pink: #f778ba; --cyan: #79c0ff;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); line-height: 1.75; font-size: 16px; -webkit-font-smoothing: antialiased; min-height: 100vh; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

/* Global icon alignment */
[data-lucide] { display: inline-block; vertical-align: -0.125em; }
svg.lucide { display: inline-block; vertical-align: -0.125em; }

/* Header - GitHub glass style */
header { background: rgba(13,17,23,0.8); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); padding: 12px 0; position: fixed; top: 0; left: 0; right: 0; z-index: 1000; }
.header-content { display: flex; align-items: center; justify-content: space-between; }
.logo { font-size: 1.375rem; font-weight: 500; color: var(--text); text-decoration: none; letter-spacing: -0.01em; display: flex; align-items: center; gap: 8px; }
.logo::before { content: '◆'; color: var(--accent); font-size: 1.125rem; }
nav { display: flex; gap: 4px; align-items: center; }
nav a { display: inline-flex; align-items: center; gap: 0.375rem; color: var(--text-secondary); text-decoration: none; font-size: 0.875rem; font-weight: 500; padding: 8px 16px; border-radius: var(--radius-sm); transition: all 0.2s ease; }
nav a svg { width: 1rem; height: 1rem; }
nav a:hover { color: var(--text); background: var(--bg-elevated); }
nav a.nav-cta { background: var(--accent); color: white; }
nav a.nav-cta:hover { background: var(--accent-secondary); }

/* Hero - GitHub style with aurora */
.hero { padding: 140px 0 80px; text-align: center; background: var(--bg); position: relative; overflow: hidden; }
.hero::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(ellipse at 20% 50%, rgba(88,166,255,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(163,113,247,0.12) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(247,120,186,0.1) 0%, transparent 50%); animation: aurora 15s ease-in-out infinite; pointer-events: none; }
@keyframes aurora { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 33% { transform: translate(2%, -2%) rotate(1deg); } 66% { transform: translate(-2%, 2%) rotate(-1deg); } }
.hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(88,166,255,0.1); border: 1px solid rgba(88,166,255,0.3); padding: 6px 16px; border-radius: 100px; font-size: 0.8125rem; color: var(--accent); margin-bottom: 24px; position: relative; z-index: 1; }
.hero-badge .pulse { width: 8px; height: 8px; background: var(--success); border-radius: 50%; animation: pulse 2s ease-in-out infinite; box-shadow: 0 0 8px var(--success); }
@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.95); } }
.hero h1 { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 600; margin-bottom: 20px; letter-spacing: -0.03em; line-height: 1.15; background: linear-gradient(135deg, var(--text) 0%, var(--text-secondary) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; position: relative; z-index: 1; }
.hero p { color: var(--text-secondary); max-width: 560px; margin: 0 auto 32px; font-size: 1.25rem; line-height: 1.7; position: relative; z-index: 1; }
.hero-cta { display: inline-flex; align-items: center; gap: 8px; background: var(--accent); color: var(--bg); padding: 14px 28px; border-radius: var(--radius-sm); text-decoration: none; font-weight: 600; font-size: 0.9375rem; transition: all 0.3s ease; box-shadow: 0 0 20px rgba(88,166,255,0.3); position: relative; z-index: 1; }
.hero-cta:hover { background: var(--cyan); box-shadow: 0 0 30px rgba(88,166,255,0.5); transform: translateY(-2px); }
.hero-cta svg { width: 16px; height: 16px; }
.hero-stats { display: flex; justify-content: center; gap: 48px; margin-top: 48px; padding-top: 32px; border-top: 1px solid var(--border); position: relative; z-index: 1; }
.hero-stat { text-align: center; }
.hero-stat-value { font-size: 2rem; font-weight: 600; background: var(--gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; letter-spacing: -0.02em; }
.hero-stat-label { font-size: 0.8125rem; color: var(--text-muted); margin-top: 4px; }

/* Featured Article - GitHub Bento Style */
.featured { padding: 3rem 0 5rem; }
.featured-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 2.5rem; display: grid; grid-template-columns: 1fr 200px; gap: 2rem; align-items: center; position: relative; overflow: hidden; transition: all 0.4s ease; }
.featured-card:hover { border-color: var(--accent); box-shadow: var(--shadow-glow); }
.featured-card::before { content: ''; position: absolute; top: 0; right: 0; width: 60%; height: 100%; background: radial-gradient(ellipse at 100% 50%, rgba(88,166,255,0.08) 0%, transparent 70%); pointer-events: none; }
.featured-label { display: inline-flex; align-items: center; gap: 0.375rem; background: linear-gradient(135deg, var(--accent), var(--purple)); color: white; padding: 0.375rem 0.875rem; border-radius: 100px; font-size: 0.6875rem; font-weight: 600; margin-bottom: 1.25rem; text-transform: uppercase; letter-spacing: 0.05em; }
.featured-label svg { width: 0.875rem; height: 0.875rem; }
.featured-title { font-size: 1.625rem; font-weight: 600; line-height: 1.35; margin-bottom: 1rem; letter-spacing: -0.02em; }
.featured-title a { color: var(--text); text-decoration: none; transition: color 0.2s; }
.featured-title a:hover { color: var(--accent); }
.featured-excerpt { color: var(--text-secondary); font-size: 0.9375rem; line-height: 1.7; margin-bottom: 1.5rem; }
.featured-meta { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.featured-visual { font-size: 5rem; opacity: 0.9; position: relative; z-index: 1; filter: grayscale(20%); }

/* Category Pills - GitHub style */
.category-pills { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; }
.category-pill { display: flex; align-items: center; gap: 0.5rem; background: var(--bg-elevated); border: 1px solid var(--border); padding: 0.5rem 1rem; border-radius: 100px; text-decoration: none; color: var(--text-secondary); font-size: 0.8125rem; font-weight: 500; transition: all 0.2s ease; }
.category-pill:hover { border-color: var(--accent); color: var(--accent); background: rgba(88,166,255,0.1); box-shadow: 0 0 12px rgba(88,166,255,0.2); }
.category-pill .count { background: var(--bg-secondary); padding: 0.125rem 0.5rem; border-radius: 100px; font-size: 0.6875rem; color: var(--text-muted); }

/* Section Headers */
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.section-title { font-size: 1.25rem; font-weight: 600; letter-spacing: -0.02em; display: flex; align-items: center; gap: 0.5rem; }
.section-title::before { content: ''; width: 4px; height: 20px; background: var(--gradient); border-radius: 2px; }
.section-title svg { width: 1.25rem; height: 1.25rem; color: var(--accent); }
.section-link { color: var(--text-muted); text-decoration: none; font-size: 0.8125rem; font-weight: 500; transition: color 0.2s; }
.section-link:hover { color: var(--accent); }

/* Article Grid - Bento */
.articles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.5rem; }

/* Newsletter CTA - GitHub gradient */
.newsletter { padding: 5rem 0; }
.newsletter-card { background: var(--bg-card); border-radius: var(--radius-xl); padding: 4rem 2rem; text-align: center; position: relative; overflow: hidden; }
.newsletter-card::before { content: ''; position: absolute; inset: 0; border-radius: var(--radius-xl); padding: 1px; background: var(--gradient); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; }
.newsletter-card::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(ellipse at 50% 0%, rgba(88,166,255,0.1) 0%, transparent 60%); pointer-events: none; }
.newsletter-card h2 { font-size: 1.75rem; font-weight: 600; margin-bottom: 0.75rem; letter-spacing: -0.02em; position: relative; z-index: 1; }
.newsletter-card p { color: var(--text-secondary); font-size: 1rem; margin-bottom: 2rem; position: relative; z-index: 1; }
.newsletter-btn { display: inline-flex; align-items: center; gap: 0.5rem; background: var(--text); color: var(--bg); padding: 0.875rem 2rem; border-radius: 100px; text-decoration: none; font-weight: 600; font-size: 0.9375rem; transition: all 0.3s ease; position: relative; z-index: 1; }
.newsletter-btn:hover { transform: scale(1.02); box-shadow: 0 0 30px rgba(240,246,252,0.2); }

/* Article cards - GitHub Card Design */
.article-list { padding: 48px 0; }
.article-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 24px; transition: all 0.3s ease; display: flex; flex-direction: column; position: relative; overflow: hidden; }
.article-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--gradient); opacity: 0; transition: opacity 0.3s ease; }
.article-card:hover { border-color: var(--accent); box-shadow: 0 0 20px rgba(88,166,255,0.15); transform: translateY(-4px); }
.article-card:hover::before { opacity: 1; }
.card-header { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.card-title { font-size: 1.125rem; font-weight: 600; margin-bottom: 12px; line-height: 1.4; flex-grow: 1; }
.card-title a { color: var(--text); text-decoration: none; transition: color 0.2s; }
.card-title a:hover { color: var(--accent); }
.card-excerpt { color: var(--text-muted); font-size: 0.875rem; line-height: 1.7; margin-bottom: 16px; flex-grow: 1; }
.card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 16px; border-top: 1px solid var(--border); }
.card-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.card-link { color: var(--accent); text-decoration: none; font-size: 0.8125rem; font-weight: 600; transition: gap 0.2s; display: flex; align-items: center; gap: 4px; }
.card-link:hover { gap: 8px; }

/* Badge System - GitHub style */
.badge { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; border-radius: 100px; font-weight: 600; font-size: 0.75rem; text-transform: capitalize; letter-spacing: 0.02em; transition: all 0.2s ease; }
.badge svg { width: 0.875rem; height: 0.875rem; flex-shrink: 0; }
.badge-channel { background: linear-gradient(135deg, rgba(88,166,255,0.2), rgba(163,113,247,0.2)); color: var(--accent); border: 1px solid rgba(88,166,255,0.3); }
.badge-difficulty { border: 1.5px solid; background: transparent; }
.badge-beginner { color: var(--success); border-color: var(--success); background: rgba(63,185,80,0.1); }
.badge-intermediate { color: var(--warning); border-color: var(--warning); background: rgba(210,153,34,0.1); }
.badge-advanced { color: var(--error); border-color: var(--error); background: rgba(248,81,73,0.1); }
.badge-tag { background: var(--bg-elevated); color: var(--text-secondary); border: 1px solid var(--border); font-size: 0.6875rem; padding: 4px 10px; }
.badge-tag:hover { border-color: var(--accent); color: var(--accent); background: rgba(88,166,255,0.1); }

/* Legacy support */
.article-meta { display: flex; flex-wrap: wrap; gap: 6px; font-size: 0.75rem; margin-bottom: 12px; }
.tag { background: var(--bg-elevated); color: var(--text-secondary); padding: 4px 10px; border-radius: 100px; font-weight: 500; font-size: 0.75rem; border: 1px solid var(--border); }
.difficulty { padding: 4px 10px; border-radius: 100px; font-weight: 500; font-size: 0.75rem; }
.difficulty.beginner { background: rgba(63,185,80,0.15); color: var(--success); }
.difficulty.intermediate { background: rgba(210,153,34,0.15); color: var(--warning); }
.difficulty.advanced { background: rgba(248,81,73,0.15); color: var(--error); }
.excerpt { color: var(--text-muted); font-size: 0.875rem; line-height: 1.6; }

/* Category Grid */
.category-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
.category-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; transition: all 0.3s ease; }
.category-card:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 0 20px rgba(88,166,255,0.15); }
.category-card h3 { font-size: 1rem; font-weight: 600; margin-bottom: 0.375rem; letter-spacing: -0.01em; }
.category-card p { color: var(--text-muted); font-size: 0.8125rem; }
.category-card a { color: var(--accent); text-decoration: none; font-size: 0.8125rem; font-weight: 500; display: inline-flex; align-items: center; gap: 0.25rem; margin-top: 1rem; transition: gap 0.2s; }
.category-card a:hover { gap: 0.5rem; }
.category-card a::after { content: '→'; }

/* Article Page - Enhanced */
.article { padding: 8rem 0 4rem; max-width: 760px; margin: 0 auto; }
.article-header { margin-bottom: 2.5rem; }
.article-header h1 { font-size: clamp(2rem, 5vw, 2.75rem); font-weight: 500; margin-bottom: 1.75rem; line-height: 1.2; letter-spacing: -0.02em; color: var(--text); }
.article-header .article-meta { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin-top: 1.25rem; }
.article-header .tag { background: var(--bg-elevated); color: var(--text-secondary); padding: 0.375rem 0.875rem; border-radius: 100px; font-weight: 500; font-size: 0.75rem; text-transform: capitalize; letter-spacing: 0.02em; border: 1px solid var(--border); transition: all 0.2s; }
.article-header .tag:hover { border-color: var(--accent); color: var(--text); }
.article-header .difficulty { padding: 0.375rem 0.875rem; border-radius: 100px; font-weight: 600; font-size: 0.75rem; text-transform: capitalize; letter-spacing: 0.02em; }
.article-intro { font-size: 1.125rem; color: var(--text-secondary); line-height: 1.8; margin-bottom: 2rem; padding: 1.5rem; background: var(--bg-secondary); border-radius: var(--radius-md); border-left: 4px solid var(--accent); border: 1px solid var(--border); border-left: 4px solid var(--accent); }

/* Author Card - Credits Section */
.author-card { display: flex; align-items: center; gap: 16px; padding: 20px; background: var(--bg-secondary); border-radius: var(--radius-md); margin: 2rem 0; border: 1px solid var(--border); }
.author-avatar { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border); }
.author-info { flex: 1; }
.author-name { font-weight: 600; color: var(--text); font-size: 1rem; margin-bottom: 2px; }
.author-role { color: var(--text-muted); font-size: 0.875rem; }
.author-links { display: flex; gap: 12px; margin-top: 8px; }
.author-links a { color: var(--text-secondary); text-decoration: none; font-size: 0.8125rem; display: flex; align-items: center; gap: 4px; transition: color 0.2s; }
.author-links a:hover { color: var(--accent); }
.author-links svg { width: 16px; height: 16px; }

/* Article content - GitHub Typography */
.article-content { font-size: 1rem; line-height: 1.85; color: var(--text-secondary); }
.article-content h2 { font-size: 1.375rem; font-weight: 600; margin: 3rem 0 1.25rem; color: var(--text); letter-spacing: -0.02em; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border); }
.article-content h3 { font-size: 1.125rem; font-weight: 600; margin: 2rem 0 1rem; color: var(--text); }
.article-content p { margin-bottom: 1.5rem; }
.article-content strong { color: var(--text); font-weight: 600; }
.article-content a { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
.article-content a:hover { color: var(--cyan); }
.article-content pre { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; overflow-x: auto; margin: 1.5rem 0; font-size: 0.8125rem; }
.article-content code { font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.875em; }
.article-content p code, .article-content li code { background: rgba(88,166,255,0.1); padding: 0.2rem 0.4rem; border-radius: 4px; color: var(--accent); border: 1px solid rgba(88,166,255,0.2); }
.article-content ul, .article-content ol { margin: 1.5rem 0; padding: 0 0 0 1.25rem; list-style: none; }
.article-content li { margin-bottom: 0.625rem; padding-left: 1rem; position: relative; }
.article-content ul > li::before { content: ''; position: absolute; left: -1rem; top: 0.6rem; width: 5px; height: 5px; background: var(--accent); border-radius: 50%; }
.article-content ol { counter-reset: item; }
.article-content ol > li { counter-increment: item; }
.article-content ol > li::before { content: counter(item); position: absolute; left: -1.5rem; top: 0; color: var(--accent); font-weight: 600; font-size: 0.875rem; }
.article-content .mermaid { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 12px; padding: 2rem; margin: 2rem 0; position: relative; overflow-x: auto; }
.article-content .mermaid::before { content: '📊'; position: absolute; top: -14px; left: 20px; background: var(--bg-secondary); padding: 0 8px; font-size: 1.25rem; }
.article-content .mermaid svg { max-width: 100%; height: auto; display: block; margin: 0 auto; }
.article-content .mermaid text { fill: var(--text) !important; font-size: 14px !important; }

/* Premium Table Styling - GitHub dark */
.article-content table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 2rem 0; font-size: 0.875rem; background: var(--bg-card); border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--border); }
.article-content thead { background: linear-gradient(135deg, rgba(88,166,255,0.1), rgba(163,113,247,0.1)); }
.article-content th { padding: 1rem 1.25rem; text-align: left; font-weight: 600; color: var(--text); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); white-space: nowrap; }
.article-content th:first-child { border-top-left-radius: var(--radius-lg); }
.article-content th:last-child { border-top-right-radius: var(--radius-lg); }
.article-content tbody tr { transition: background 0.2s ease; }
.article-content tbody tr:hover { background: rgba(88,166,255,0.05); }
.article-content tbody tr:nth-child(even) { background: rgba(255,255,255,0.02); }
.article-content tbody tr:nth-child(even):hover { background: rgba(88,166,255,0.08); }
.article-content td { padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); color: var(--text-secondary); vertical-align: top; line-height: 1.6; }
.article-content tbody tr:last-child td { border-bottom: none; }
.article-content tbody tr:last-child td:first-child { border-bottom-left-radius: var(--radius-lg); }
.article-content tbody tr:last-child td:last-child { border-bottom-right-radius: var(--radius-lg); }
/* Table cell color coding for comparisons */
.article-content td:first-child { color: var(--text); font-weight: 500; background: rgba(255,255,255,0.02); }
.article-content td code { background: rgba(88,166,255,0.15); color: var(--accent); padding: 0.2em 0.5em; border-radius: 4px; font-size: 0.8125rem; }
/* Table responsive wrapper */
@media (max-width: 768px) {
  .article-content table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .article-content th, .article-content td { padding: 0.75rem 1rem; min-width: 120px; }
}

.article-content blockquote { padding: 1.25rem 1.5rem; margin: 2rem 0; background: var(--bg-card); border-radius: var(--radius-md); border-left: 3px solid var(--accent); color: var(--text-secondary); }

/* Callouts - Modern */
.callout { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; margin: 1.5rem 0; display: flex; gap: 1rem; align-items: flex-start; }
.callout-icon { font-size: 1.25rem; line-height: 1; }
.callout strong { color: var(--text); display: block; margin-bottom: 0.25rem; font-size: 0.875rem; }
.callout p { margin: 0; color: var(--text-secondary); font-size: 0.875rem; line-height: 1.6; }

/* Glossary tooltips - GitHub style */
.glossary-term { border-bottom: 1px dashed rgba(88,166,255,0.5); cursor: help; position: relative; color: var(--text); }
.glossary-term:hover { color: var(--accent); }
.glossary-term::after { content: attr(data-tooltip); position: absolute; top: calc(100% + 8px); left: 0; background: var(--bg-elevated); border: 1px solid var(--border); padding: 0.75rem 1rem; border-radius: var(--radius-sm); font-size: 0.8125rem; max-width: 300px; min-width: 200px; white-space: normal; z-index: 1000; box-shadow: 0 8px 32px rgba(0,0,0,0.5); color: var(--text-secondary); line-height: 1.5; opacity: 0; visibility: hidden; transition: opacity 0.2s, visibility 0.2s; pointer-events: none; }
.glossary-term:hover::after { opacity: 1; visibility: visible; }
.glossary-term::before { content: ''; position: absolute; top: 100%; left: 1rem; border: 6px solid transparent; border-bottom-color: var(--border); opacity: 0; visibility: hidden; transition: opacity 0.2s, visibility 0.2s; z-index: 1001; }
.glossary-term:hover::before { opacity: 1; visibility: visible; }

/* Special sections - GitHub Bento Cards */
.real-world-example { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.75rem; margin: 2rem 0; position: relative; overflow: hidden; }
.real-world-example::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--gradient); }
.real-world-example h3 { color: var(--text-muted); margin-bottom: 0.5rem; font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.1em; display: flex; align-items: center; gap: 0.5rem; }
.real-world-example .company { font-size: 1.25rem; font-weight: 600; color: var(--text); margin-bottom: 0.75rem; }
.real-world-example .scenario { color: var(--text-secondary); font-size: 0.9375rem; line-height: 1.7; margin-bottom: 1rem; }
.real-world-example .lesson { background: var(--bg-elevated); padding: 1rem; border-radius: var(--radius-sm); font-size: 0.875rem; color: var(--text-secondary); border-left: 2px solid var(--accent); }

.fun-fact { background: linear-gradient(135deg, rgba(163,113,247,0.1), rgba(88,166,255,0.05)); border: 1px solid rgba(163,113,247,0.3); border-radius: var(--radius-lg); padding: 1.25rem 1.5rem; margin: 2rem 0; display: flex; gap: 1rem; align-items: center; }
.fun-fact-icon { font-size: 1.75rem; }
.fun-fact p { margin: 0; color: var(--text-secondary); font-size: 0.9375rem; line-height: 1.6; }
.fun-fact strong { color: var(--text); }

.quick-ref { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.75rem; margin: 2rem 0; }
.quick-ref h3 { color: var(--text); margin-bottom: 1rem; font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
.quick-ref ul { margin: 0; padding: 0; list-style: none; }
.quick-ref li { margin-bottom: 0.5rem; padding-left: 1.5rem; position: relative; color: var(--text-secondary); font-size: 0.9375rem; }
.quick-ref li::before { content: '✓'; position: absolute; left: 0; color: var(--success); font-weight: 700; }

/* Sources - Minimal */
.sources { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem 1.5rem; margin: 2rem 0; }
.sources h3 { margin-bottom: 0.875rem; font-size: 0.875rem; color: var(--text); font-weight: 600; }
.sources ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0; }
.sources li { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.875rem; padding: 0.5rem 0; border-bottom: 1px solid var(--border); }
.sources li:last-child { border-bottom: none; }
.sources a { color: var(--accent); text-decoration: none; }
.sources a:hover { text-decoration: underline; }
.sources .source-type { font-size: 0.6875rem; color: var(--text-muted); margin-left: 0.5rem; text-transform: uppercase; letter-spacing: 0.03em; }
.sources .source-num { display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.5rem; background: var(--accent); color: #ffffff; font-size: 0.75rem; font-weight: 700; border-radius: 50%; margin-right: 0.75rem; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

/* Inline Citations */
.citation { display: inline-flex; align-items: center; justify-content: center; min-width: 1.125rem; height: 1.125rem; padding: 0 0.25rem; background: var(--accent); color: #ffffff; font-size: 0.625rem; font-weight: 700; border-radius: 50%; margin: 0 0.125rem; vertical-align: super; cursor: pointer; text-decoration: none; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
.citation:hover { transform: scale(1.15); background: var(--accent-secondary); box-shadow: 0 2px 4px rgba(0,0,0,0.15); }

/* Article Images */
.article-image { margin: 2rem 0; border-radius: var(--radius-lg); overflow: hidden; background: var(--bg-card); border: 1px solid var(--border); }
.article-image img { width: 100%; height: auto; display: block; object-fit: cover; max-height: 400px; }
.article-image figcaption { padding: 0.75rem 1rem; font-size: 0.8125rem; color: var(--text-muted); text-align: center; border-top: 1px solid var(--border); background: var(--bg-secondary); }

/* Share Snippet - GitHub style */
.share-snippet { background: linear-gradient(135deg, var(--bg-card), var(--bg-elevated)); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; margin: 2.5rem 0; position: relative; overflow: hidden; }
.share-snippet::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--gradient); }
.share-snippet-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
.share-snippet-header .share-icon { font-size: 1.25rem; }
.share-snippet-header h3 { flex: 1; font-size: 0.9375rem; font-weight: 600; color: var(--text); margin: 0; }
.share-buttons { display: flex; gap: 0.5rem; }
.share-btn { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-secondary); cursor: pointer; transition: all 0.2s; }
.share-btn svg { width: 16px; height: 16px; }
.share-btn:hover { transform: scale(1.1); }
.share-btn.linkedin:hover { background: #0077b5; color: white; border-color: #0077b5; box-shadow: 0 0 15px rgba(0,119,181,0.4); }
.share-btn.twitter:hover { background: #000; color: white; border-color: #000; }
.share-btn.copy:hover { background: var(--accent); color: var(--bg); border-color: var(--accent); box-shadow: 0 0 15px rgba(88,166,255,0.4); }
.share-snippet-content { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 1.25rem; font-size: 0.9375rem; line-height: 1.7; }
.snippet-hook { font-weight: 600; color: var(--text); margin-bottom: 0.75rem; font-size: 1rem; }
.snippet-body { color: var(--text-secondary); margin-bottom: 0.75rem; white-space: pre-line; }
.snippet-cta { color: var(--accent); font-weight: 500; margin-bottom: 0.5rem; }
.snippet-hashtags { color: var(--purple); font-size: 0.875rem; margin-bottom: 0.5rem; word-wrap: break-word; }
.snippet-link { font-size: 0.8125rem; color: var(--text-muted); word-break: break-all; }

/* CTA - GitHub gradient */
.cta-box { margin-top: 3rem; padding: 2rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); text-align: center; position: relative; overflow: hidden; }
.cta-box::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 0%, rgba(88,166,255,0.1) 0%, transparent 60%); pointer-events: none; }
.cta-box p { margin-bottom: 1rem; font-size: 1.125rem; font-weight: 600; color: var(--text); position: relative; }
.cta-button { display: inline-flex; align-items: center; gap: 0.5rem; background: var(--accent); color: var(--bg); padding: 0.75rem 1.5rem; border-radius: 100px; text-decoration: none; font-weight: 600; font-size: 0.875rem; transition: all 0.3s ease; position: relative; }
.cta-button:hover { transform: scale(1.02); box-shadow: 0 0 25px rgba(88,166,255,0.4); background: var(--cyan); }

/* Footer - GitHub style */
footer { background: var(--bg-secondary); border-top: 1px solid var(--border); padding: 3rem 0; margin-top: 5rem; }
.footer-content { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.footer-brand { font-size: 1.125rem; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 0.5rem; }
.footer-brand::before { content: '◆'; background: var(--gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.footer-links { display: flex; gap: 1.5rem; }
.footer-links a { color: var(--text-muted); text-decoration: none; font-size: 0.8125rem; transition: color 0.2s; }
.footer-links a:hover { color: var(--text); }
.footer-copy { text-align: center; color: var(--text-muted); font-size: 0.8125rem; }
.footer-copy a { color: var(--accent); text-decoration: none; }

/* Responsive */
@media (max-width: 768px) { 
  .container { padding: 0 1.25rem; }
  .hero { padding: 8rem 0 4rem; }
  .hero h1 { font-size: 2rem; } 
  .hero-stats { gap: 2rem; flex-wrap: wrap; }
  .hero-stat-value { font-size: 1.75rem; }
  .featured-card { grid-template-columns: 1fr; padding: 1.5rem; }
  .featured-visual { display: none; }
  .featured-title { font-size: 1.25rem; }
  .article-header h1 { font-size: 1.625rem; color: var(--text); } 
  .article-intro { padding: 2rem 1.5rem 1.5rem 1.5rem; font-size: 1rem; }
  nav { gap: 0.25rem; } 
  nav a { padding: 0.5rem 0.75rem; font-size: 0.8125rem; }
  .category-grid, .articles-grid { grid-template-columns: 1fr; }
  .glossary-term:hover::after { left: 0; transform: none; max-width: 200px; }
  .footer-content { flex-direction: column; gap: 1.5rem; text-align: center; }
  .category-pills { gap: 0.375rem; }
  .category-pill { font-size: 0.75rem; padding: 0.375rem 0.75rem; }
  .hero-stats { flex-direction: column; gap: 1.5rem; border: none; padding-top: 2rem; }
}

/* Animations */
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.article-card, .category-card, .featured-card { animation: fadeIn 0.4s ease-out; }

/* Selection */
::selection { background: rgba(88,166,255,0.3); color: var(--text); }

/* Scrollbar */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--bg-secondary); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

/* Breadcrumb Navigation */
.breadcrumb-nav { margin-bottom: 1.5rem; }
.breadcrumb { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem; list-style: none; padding: 0; margin: 0; font-size: 0.8125rem; }
.breadcrumb li { display: flex; align-items: center; gap: 0.25rem; color: var(--text-muted); }
.breadcrumb li + li::before { content: '/'; margin: 0 0.25rem; color: var(--text-muted); }
.breadcrumb a { color: var(--text-secondary); text-decoration: none; transition: color 0.2s; }
.breadcrumb a:hover { color: var(--accent); }
.breadcrumb li[aria-current="page"] { color: var(--text); font-weight: 500; }

/* Article Date */
.article-date { display: inline-flex; align-items: center; gap: 0.375rem; color: var(--text-muted); font-size: 0.75rem; }
.article-date svg { width: 14px; height: 14px; }

/* Related articles grid */
.related-articles { margin: 2.5rem 0; }
.related-articles h3 { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; color: var(--text); }
.related-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; }
.related-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; text-decoration: none; transition: all 0.2s; display: flex; flex-direction: column; gap: 0.5rem; }
.related-card:hover { border-color: var(--accent); transform: translateY(-2px); }
.related-title { color: var(--text); font-weight: 500; font-size: 0.9375rem; line-height: 1.4; }
.related-meta { color: var(--text-muted); font-size: 0.75rem; text-transform: capitalize; }

/* Article layout with TOC sidebar */
.article-layout { padding: 6rem 0 4rem; max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 240px; gap: 3rem; padding-left: 24px; padding-right: 24px; }
.article-layout > article { min-width: 0; }
.article-toc { position: sticky; top: 5rem; max-height: calc(100vh - 6rem); overflow-y: auto; padding: 1rem 0; }
.toc-title { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem; }
.toc-title svg { width: 14px; height: 14px; }
.toc-list { list-style: none; padding: 0; margin: 0; border-left: 2px solid var(--border); }
.toc-list li { margin: 0; }
.toc-list a { display: block; padding: 0.375rem 0.75rem; color: var(--text-muted); text-decoration: none; font-size: 0.75rem; line-height: 1.5; border-left: 2px solid transparent; margin-left: -2px; transition: all 0.2s; }
.toc-list a:hover { color: var(--text); }
.toc-list a.active { color: var(--accent); border-left-color: var(--accent); font-weight: 500; }

/* Focus states for accessibility */
a:focus-visible, button:focus-visible, input:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 2px; }

/* Skip link for accessibility */
.skip-link { position: absolute; top: -40px; left: 0; background: var(--accent); color: var(--bg); padding: 0.5rem 1rem; z-index: 10000; text-decoration: none; font-weight: 600; }
.skip-link:focus { top: 0; }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
}

/* Print styles */
@media print {
  header, footer, .search-overlay, #back-to-top, .share-snippet, .author-card, .related-articles, .article-toc, .breadcrumb-nav, .newsletter, .hero-actions, .stats-bar, .topics-section, .diff-filters, .featured, nav { display: none !important; }
  body { background: white; color: black; font-size: 12pt; line-height: 1.5; }
  .article-layout { grid-template-columns: 1fr; max-width: 100%; padding: 0; }
  a { color: black; text-decoration: underline; }
  a[href^="http"]::after { content: " (" attr(href) ")"; font-size: 0.9em; color: #666; }
  .article-content pre { border: 1px solid #ccc; background: #f5f5f5; white-space: pre-wrap; word-wrap: break-word; }
  .article-content code { background: #f0f0f0; }
}

/* Responsive - TOC */
@media (max-width: 1024px) {
  .article-layout { grid-template-columns: 1fr; }
  .article-toc { display: none; }
}

/* Search */
.search-container { position: relative; }
.search-btn { background: var(--bg-card); border: 1px solid var(--border); padding: 0.5rem 1rem; border-radius: 100px; color: var(--text-muted); font-size: 0.8125rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; }
.search-btn:hover { border-color: var(--accent); color: var(--text); }
.search-btn kbd { background: var(--bg-elevated); padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.6875rem; font-family: inherit; }
.search-modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(12px); z-index: 2000; align-items: flex-start; justify-content: center; padding-top: 15vh; }
.search-modal.active { display: flex; }
.search-box { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); width: 100%; max-width: 600px; max-height: 70vh; overflow: hidden; box-shadow: 0 16px 70px rgba(0,0,0,0.5); }
.search-input-wrap { display: flex; align-items: center; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); gap: 0.75rem; }
.search-input-wrap svg { width: 20px; height: 20px; color: var(--text-muted); flex-shrink: 0; }
.search-input { flex: 1; background: none; border: none; color: var(--text); font-size: 1rem; outline: none; }
.search-input::placeholder { color: var(--text-muted); }
.search-close { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0.25rem; }
.search-close:hover { color: var(--text); }
.search-results { max-height: calc(70vh - 60px); overflow-y: auto; padding: 0.5rem; }
.search-results:empty::before { content: 'Start typing to search...'; display: block; padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.875rem; }
.search-result { display: block; padding: 1rem; border-radius: var(--radius-sm); text-decoration: none; transition: background 0.15s; }
.search-result:hover { background: var(--bg-elevated); }
.search-result-title { color: var(--text); font-weight: 500; margin-bottom: 0.25rem; }
.search-result-meta { display: flex; gap: 0.5rem; align-items: center; }
.search-result-meta .tag { font-size: 0.625rem; }
.search-result-excerpt { color: var(--text-muted); font-size: 0.8125rem; margin-top: 0.375rem; line-height: 1.5; }
.search-empty { padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.875rem; }
.search-highlight { background: rgba(88,166,255,0.25); color: var(--accent); padding: 0 2px; border-radius: 2px; }

/* Filter tabs */
.filter-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.filter-tab { background: transparent; border: 1px solid var(--border); padding: 0.5rem 1rem; border-radius: 100px; color: var(--text-secondary); font-size: 0.8125rem; cursor: pointer; transition: all 0.2s; font-family: inherit; }
.filter-tab:hover { border-color: var(--accent); color: var(--text); }
.filter-tab.active { background: var(--accent); color: var(--bg); border-color: var(--accent); }

/* Difficulty filter badges */
.diff-filters { display: flex; gap: 0.375rem; }
.diff-filter { padding: 0.375rem 0.75rem; border-radius: 100px; font-size: 0.75rem; cursor: pointer; border: 1px solid transparent; transition: all 0.2s; background: var(--bg-elevated); color: var(--text-secondary); }
.diff-filter.beginner { background: rgba(63,185,80,0.15); color: var(--success); }
.diff-filter.intermediate { background: rgba(210,153,34,0.15); color: var(--warning); }
.diff-filter.advanced { background: rgba(248,81,73,0.15); color: var(--error); }
.diff-filter:hover, .diff-filter.active { border-color: currentColor; box-shadow: 0 0 10px currentColor; }

/* Stats Bar */
.stats-bar { padding: 0; margin-top: -3rem; position: relative; z-index: 10; }
.stats-grid { display: flex; justify-content: center; align-items: center; gap: 2.5rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 1.5rem 3rem; max-width: 700px; margin: 0 auto; box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
.stat-item { text-align: center; }
.stat-value { font-size: 1.75rem; font-weight: 700; background: var(--gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; display: flex; align-items: center; justify-content: center; gap: 0.5rem; letter-spacing: -0.02em; }
.stat-value svg { width: 1.25rem; height: 1.25rem; stroke-width: 2.5; color: var(--accent); -webkit-text-fill-color: initial; }
.stat-label { font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 0.25rem; display: block; }
.stat-divider { width: 1px; height: 40px; background: var(--border); }

/* Featured Grid */
.featured-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 1.25rem; }
.featured-main { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 2rem; position: relative; overflow: hidden; transition: all 0.3s ease; }
.featured-main:hover { border-color: var(--accent); box-shadow: 0 0 30px rgba(88,166,255,0.15); }
.featured-main::before { content: ''; position: absolute; top: 0; right: 0; width: 60%; height: 100%; background: radial-gradient(ellipse at 100% 50%, rgba(88,166,255,0.08) 0%, transparent 70%); pointer-events: none; }
.featured-side { display: flex; flex-direction: column; gap: 1.25rem; }
.featured-side-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.25rem; text-decoration: none; transition: all 0.3s ease; display: flex; flex-direction: column; gap: 0.75rem; flex: 1; }
.featured-side-card:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 0 20px rgba(88,166,255,0.15); }
.featured-side-card .tag { width: fit-content; }
.featured-side-card h3 { font-size: 0.9375rem; font-weight: 600; color: var(--text); line-height: 1.4; margin: 0; letter-spacing: -0.01em; }

/* Topics Section */
.topics-section { padding: 4rem 0 2rem; }
.topics-title { font-size: 1.125rem; font-weight: 600; text-align: center; margin-bottom: 1.5rem; color: var(--text); letter-spacing: -0.02em; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
.topics-title svg { width: 1.25rem; height: 1.25rem; color: var(--accent); }

/* Hero Actions */
.hero-actions { display: flex; gap: 1rem; justify-content: center; align-items: center; position: relative; z-index: 1; }
.hero-cta-secondary { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); text-decoration: none; font-size: 0.9375rem; font-weight: 500; padding: 0.875rem 1.5rem; border: 1px solid var(--border); border-radius: 100px; transition: all 0.2s ease; }
.hero-cta-secondary svg { width: 1rem; height: 1rem; }
.hero-cta-secondary:hover { border-color: var(--accent); color: var(--accent); background: rgba(88,166,255,0.1); }

/* Responsive - Stats & Featured */
@media (max-width: 768px) {
  .stats-grid { flex-wrap: wrap; gap: 1.5rem 2rem; padding: 1.25rem 1.5rem; }
  .stat-divider { display: none; }
  .stat-value { font-size: 1.5rem; }
  .featured-grid { grid-template-columns: 1fr; }
  .featured-side { flex-direction: row; }
  .featured-side-card { flex: 1; }
  .featured-side-card h3 { font-size: 0.8125rem; }
  .hero-actions { flex-direction: column; gap: 0.75rem; }
  .hero-cta, .hero-cta-secondary { width: 100%; max-width: 280px; justify-content: center; }
  .hero::before { opacity: 0.5; }
}
@media (max-width: 480px) {
  .featured-side { flex-direction: column; }
  .stats-grid { gap: 1rem; }
}
`;
}


// HTML Generation
function generateHead(title, description, includeMermaid = false, options = {}) {
  const { isArticle = false, articleUrl = '', imageUrl = '', publishedDate = '', authorName = AUTHOR.name, siteName = 'DevInsights' } = options;
  const baseUrl = process.env.BLOG_BASE_URL || 'https://open-interview.github.io';
  const pageUrl = articleUrl || baseUrl;
  const pageImage = imageUrl || `${baseUrl}/opengraph.jpg`;

  const mermaidScript = includeMermaid ? `
  <script defer src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>mermaid.initialize({startOnLoad:true,theme:'base',themeVariables:{primaryColor:'#e8f4f8',primaryTextColor:'#1a1a1a',primaryBorderColor:'#2c3e50',lineColor:'#2c3e50',secondaryColor:'#ffeaa7',tertiaryColor:'#dfe6e9',background:'#ffffff',mainBkg:'#e8f4f8',nodeBorder:'#2c3e50',clusterBkg:'#f5f5f5',titleColor:'#1a1a1a',edgeLabelBackground:'#ffffff',nodeTextColor:'#1a1a1a',fontSize:'16px'},flowchart:{curve:'basis',padding:20,nodeSpacing:60,rankSpacing:60,htmlLabels:true,useMaxWidth:true}});</script>` : '';
  
  const gaScript = GA_MEASUREMENT_ID ? `
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');</script>` : '';

  const canonicalLink = `<link rel="canonical" href="${escapeHtml(pageUrl)}">`;
  
  const ogTags = `
  <meta property="og:url" content="${escapeHtml(pageUrl)}">
  <meta property="og:image" content="${escapeHtml(pageImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="${escapeHtml(siteName)}">`;

  const twitterTags = `
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${escapeHtml(pageImage)}">`;

  let jsonLd = '';
  if (isArticle && publishedDate) {
    jsonLd = `
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"BlogPosting","headline":"${escapeHtml(title)}","description":"${escapeHtml(description)}","image":"${escapeHtml(pageImage)}","url":"${escapeHtml(pageUrl)}","datePublished":"${publishedDate}","dateModified":"${publishedDate}","author":{"@type":"Person","name":"${escapeHtml(authorName)}","url":"${AUTHOR.github}"},"publisher":{"@type":"Organization","name":"${escapeHtml(siteName)}","logo":{"@type":"ImageObject","url":"${baseUrl}/logo.png"}},"mainEntityOfPage":{"@type":"WebPage","@id":"${escapeHtml(pageUrl)}"}}
  </script>`;
  }
  
  const titleText = title.includes('DevInsights') ? title : `${title} | DevInsights`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="format-detection" content="telephone=no">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>${escapeHtml(titleText)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta name="language" content="English">
  <meta name="rating" content="General">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="${isArticle ? 'article' : 'website'}">${ogTags}
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">${twitterTags}
  <meta name="theme-color" content="#0d1117">${canonicalLink}${gaScript}
  <!-- DNS prefetch for external resources -->
  <link rel="dns-prefetch" href="https://www.googletagmanager.com">
  <link rel="dns-prefetch" href="https://unpkg.com">
  <link rel="dns-prefetch" href="https://illustrations.popsy.co">
  <link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
  <!-- Preconnect to font CDNs -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <!-- Font preloads for critical fonts (Playfair Display + Plus Jakarta Sans + Inter) -->
  <link rel="preload" as="font" href="https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwY.woff2" type="font/woff2" crossorigin>
  <link rel="preload" as="font" href="https://fonts.gstatic.com/s/playfairdisplay/v30/nuFiD-vYSZviVYUb_rj3ij__anPXDTjYgFE_.woff2" type="font/woff2" crossorigin>
  <link rel="preload" as="font" href="https://fonts.gstatic.com/s/plusjakartasans/v8/LDI1apSQOBt_Y29UFOc681ylDyT4X4C2zIEE14db.woff2" type="font/woff2" crossorigin>
  <!-- Google Fonts (non-blocking load) -->
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"></noscript>${mermaidScript}${jsonLd}
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  <link rel="stylesheet" href="/style.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>◆</text></svg>">
</head>
<body data-theme="dark">`;
}

function generateHeader() {
  return `<div id="reading-progress"></div>
<header>
  <div class="container header-content">
    <a href="/" class="logo">
      <div class="logo-icon">◆</div>
      DevInsights
    </a>
    <nav id="mainNav">
      <a href="/"><i data-lucide="home"></i> Home</a>
      <a href="/channels/"><i data-lucide="layers"></i> Topics</a>
      <button class="search-btn" onclick="openSearch()"><i data-lucide="search"></i> Search<kbd>⌘K</kbd></button>
      <a href="https://open-interview.github.io" target="_blank" class="nav-cta"><i data-lucide="play"></i> Practice</a>
    </nav>
    <div style="display:flex;gap:8px;align-items:center;">
      <button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">
        <i data-lucide="sun" class="theme-icon-light"></i>
        <i data-lucide="moon" class="theme-icon-dark"></i>
      </button>
      <button class="nav-toggle" onclick="document.getElementById('mainNav').classList.toggle('open')" aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</header>`;
}

function generateFooter(articles = [], useExternalSearch = true) {
  // Generate search data
  const searchData = articles.map(a => ({
    id: a.id,
    slug: a.blogSlug,
    title: a.blogTitle,
    intro: (a.blogIntro || '').substring(0, 150),
    channel: a.channel,
    difficulty: a.difficulty,
    tags: a.tags || []
  }));

  const searchScript = useExternalSearch
    ? `<script src="/search-data.js"></script>`
    : `
<script>
const searchData = ${JSON.stringify(searchData)};
</script>`;

  return `
<!-- Search Modal -->
<div class="search-overlay" id="searchModal" onclick="if(event.target===this)closeSearch()">
  <div class="search-modal">
    <div class="search-input-wrap">
      <i data-lucide="search"></i>
      <input type="text" class="search-input" id="searchInput" placeholder="Search articles, topics, tags..." autocomplete="off">
      <button class="search-close" onclick="closeSearch()"><i data-lucide="x"></i></button>
    </div>
    <div class="search-results" id="searchResults">
      <div class="search-empty">Start typing to search articles…</div>
    </div>
    <div class="search-hint">
      <span><kbd>↑↓</kbd> navigate</span>
      <span><kbd>↵</kbd> open</span>
      <span><kbd>Esc</kbd> close</span>
    </div>
  </div>
</div>

<button id="back-to-top" onclick="window.scrollTo({top:0,behavior:'smooth'})" aria-label="Back to top">
  <i data-lucide="arrow-up"></i>
</button>

<footer><div class="container">
  <div class="footer-content">
    <div class="footer-brand">
      <div class="logo-icon" style="width:22px;height:22px;font-size:11px;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#58a6ff,#a371f7);color:white;margin-right:6px;">◆</div>
      DevInsights
    </div>
    <div class="footer-links">
      <a href="/">Home</a>
      <a href="/channels/">Topics</a>
      <a href="https://open-interview.github.io" target="_blank">Practice</a>
      <a href="${AUTHOR.github}" target="_blank">GitHub</a>
    </div>
  </div>
  <p class="footer-copy" style="margin-top:16px;">© ${new Date().getFullYear()} DevInsights · Created by <a href="${AUTHOR.github}" target="_blank" style="color:var(--accent);">${AUTHOR.name}</a></p>
</div></footer>

<script>
(function(){const t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t);})();

${searchScript}

function openSearch() {
  document.getElementById('searchModal').classList.add('open');
  document.getElementById('searchInput').focus();
  document.body.style.overflow = 'hidden';
}
function closeSearch() {
  document.getElementById('searchModal').classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('searchInput').value = '';
  document.getElementById('searchResults').innerHTML = '<div class="search-empty">Start typing to search articles…</div>';
}
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
  if (e.key === 'Escape') closeSearch();
});
document.getElementById('searchInput')?.addEventListener('input', e => {
  const q = e.target.value.toLowerCase().trim();
  const results = document.getElementById('searchResults');
  if (!q) { results.innerHTML = '<div class="search-empty">Start typing to search articles…</div>'; return; }
  const matches = searchData.filter(a =>
    a.title.toLowerCase().includes(q) ||
    (a.intro||'').toLowerCase().includes(q) ||
    a.channel.toLowerCase().includes(q) ||
    (a.tags||[]).some(t => t.toLowerCase().includes(q))
  ).slice(0, 8);
  if (!matches.length) { results.innerHTML = '<div class="search-empty">No articles found</div>'; return; }
  results.innerHTML = matches.map(a => \`<a href="/posts/\${a.id}/\${a.slug}/" class="search-result">
    <div class="search-result-title">\${a.title}</div>
    <div class="search-result-meta"><span class="tag">\${a.channel.replace(/-/g,' ')}</span><span class="difficulty \${a.difficulty}">\${a.difficulty}</span></div>
  </a>\`).join('');
});

function toggleTheme() {
  const html = document.documentElement;
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

// Reading progress
window.addEventListener('scroll', () => {
  const bar = document.getElementById('reading-progress');
  const btt = document.getElementById('back-to-top');
  if (bar) {
    const doc = document.documentElement;
    const pct = (doc.scrollTop / (doc.scrollHeight - doc.clientHeight)) * 100;
    bar.style.width = Math.min(pct, 100) + '%';
  }
  if (btt) btt.classList.toggle('visible', window.scrollY > 400);
});

// TOC active state
const tocLinks = document.querySelectorAll('.toc-list a');
if (tocLinks.length) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        tocLinks.forEach(l => l.classList.remove('active'));
        const active = document.querySelector('.toc-list a[href="#' + e.target.id + '"]');
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  document.querySelectorAll('.article-content h2[id]').forEach(h => observer.observe(h));
}

function filterArticles(difficulty, btn) {
  document.querySelectorAll('.diff-filter').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.article-card').forEach(card => {
    card.style.display = (difficulty === 'all' || card.dataset.difficulty === difficulty) ? '' : 'none';
  });
}

function copySnippet(btn) {
  const snippet = document.getElementById('shareSnippet')?.innerText;
  if (!snippet) return;
  navigator.clipboard.writeText(snippet).then(() => {
    btn.innerHTML = '<i data-lucide="check"></i>';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    setTimeout(() => { btn.innerHTML = '<i data-lucide="copy"></i>'; if (typeof lucide !== 'undefined') lucide.createIcons(); }, 2000);
  });
}

if (typeof lucide !== 'undefined') lucide.createIcons();
</script>
</body></html>`;
}

function generateIndexPage(articles) {
  const recentArticles = articles.slice(0, 12);
  const featuredArticle = articles[0];
  
  // Group articles by difficulty
  const byDifficulty = {
    beginner: articles.filter(a => a.difficulty === 'beginner'),
    intermediate: articles.filter(a => a.difficulty === 'intermediate'),
    advanced: articles.filter(a => a.difficulty === 'advanced')
  };
  
  // Category pills
  let categoryPills = '';
  for (const [category, channels] of Object.entries(categoryMap)) {
    const count = articles.filter(a => channels.includes(a.channel)).length;
    if (count === 0) continue;
    const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    categoryPills += `<a href="/channels/${slug}/" class="category-pill">${category}<span class="count">${count}</span></a>`;
  }
  
  // Stats
  const totalArticles = articles.length;
  const totalCategories = Object.keys(categoryMap).filter(cat => 
    articles.some(a => categoryMap[cat].includes(a.channel))
  ).length;
  
  // Article cards (skip first if featured) - Heavy card design with prominent badges
  let articleCards = recentArticles.slice(1).map(a => {
    const tags = a.tags || [];
    const displayTags = tags.slice(0, 3);
    return `
    <div class="article-card" data-difficulty="${a.difficulty}" data-channel="${a.channel}">
      <div class="card-header">
        <span class="badge badge-channel"><i data-lucide="folder"></i> ${formatChannelName(a.channel)}</span>
        <span class="badge badge-difficulty badge-${a.difficulty}"><i data-lucide="${a.difficulty === 'beginner' ? 'zap' : a.difficulty === 'intermediate' ? 'flame' : 'rocket'}"></i> ${a.difficulty}</span>
      </div>
      <h2 class="card-title"><a href="/posts/${a.id}/${a.blogSlug}/">${escapeHtml(a.blogTitle)}</a></h2>
      <p class="card-excerpt">${escapeHtml((a.blogIntro || '').substring(0, 120))}...</p>
      <div class="card-footer">
        <div class="card-tags">
          ${displayTags.map(tag => `<span class="badge badge-tag"><i data-lucide="tag"></i> ${tag}</span>`).join('')}
        </div>
        <a href="/posts/${a.id}/${a.blogSlug}/" class="card-link"><i data-lucide="arrow-right"></i> Read more</a>
      </div>
    </div>`;
  }).join('');
  
  // Calculate reading time estimate (avg 5 min per article)
  const totalReadingMins = totalArticles * 5;
  const readingHours = Math.floor(totalReadingMins / 60);
  
  // Featured articles (top 3)
  const featuredArticles = articles.slice(0, 3);
  let featuredHtml = '';
  if (featuredArticles.length > 0) {
    const mainFeatured = featuredArticles[0];
    const sideFeatured = featuredArticles.slice(1, 3);
    
    featuredHtml = `
    <section class="featured"><div class="container">
      <div class="featured-grid">
        <div class="featured-main">
          <span class="featured-label"><i data-lucide="sparkles"></i> Latest</span>
          <h2 class="featured-title"><a href="/posts/${mainFeatured.id}/${mainFeatured.blogSlug}/">${escapeHtml(mainFeatured.blogTitle)}</a></h2>
          <p class="featured-excerpt">${escapeHtml((mainFeatured.blogIntro || '').substring(0, 200))}...</p>
          <div class="featured-meta">
            <span class="badge badge-channel"><i data-lucide="folder"></i> ${formatChannelName(mainFeatured.channel)}</span>
            <span class="badge badge-difficulty badge-${mainFeatured.difficulty}"><i data-lucide="${mainFeatured.difficulty === 'beginner' ? 'zap' : mainFeatured.difficulty === 'intermediate' ? 'flame' : 'rocket'}"></i> ${mainFeatured.difficulty}</span>
          </div>
        </div>
        <div class="featured-side">
          ${sideFeatured.map(a => `
            <a href="/posts/${a.id}/${a.blogSlug}/" class="featured-side-card">
              <span class="badge badge-channel"><i data-lucide="folder"></i> ${formatChannelName(a.channel)}</span>
              <h3>${escapeHtml(a.blogTitle)}</h3>
            </a>
          `).join('')}
        </div>
      </div>
    </div></section>`;
  }
  
  const baseUrl = process.env.BLOG_BASE_URL || 'https://open-interview.github.io';

  // Build blog post references for Blog schema
  const blogPostItems = recentArticles.slice(0, 10).map(a => ({
    "@type": "BlogPosting",
    "headline": a.blogTitle,
    "url": `${baseUrl}/posts/${a.id}/${a.blogSlug}/`,
    "datePublished": a.createdAt ? new Date(a.createdAt).toISOString().split('T')[0] : '',
    "author": { "@type": "Person", "name": AUTHOR.name }
  }));

  const orgJsonLd = `
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Organization","name":"DevInsights","url":"${baseUrl}","description":"Real-world engineering insights for developers building at scale","founder":{"@type":"Person","name":"${AUTHOR.name}","url":"${AUTHOR.github}"},"sameAs":["${AUTHOR.github}","${AUTHOR.linkedin}"]}
  </script>
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"WebSite","name":"DevInsights","url":"${baseUrl}","potentialAction":{"@type":"SearchAction","target":"${baseUrl}/?q={search_term_string}","query-input":"required name=search_term_string"}}
  </script>
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Blog","name":"DevInsights","url":"${baseUrl}","description":"Real-world engineering insights for developers building at scale. Deep dives into production systems, architecture patterns, and battle-tested practices from FAANG and startup engineers.","publisher":{"@type":"Organization","name":"DevInsights","url":"${baseUrl}"},"author":{"@type":"Person","name":"${AUTHOR.name}","url":"${AUTHOR.github}"},"blogPost":${JSON.stringify(blogPostItems)}}
  </script>`;
  
  return `${generateHead('DevInsights - Engineering Knowledge That Ships', 'Real-world engineering insights for developers building at scale', false)}
${orgJsonLd}
${generateHeader()}
<main>
  <section class="hero"><div class="container">
    <div class="hero-badge"><span class="pulse"></span> New articles daily</div>
    <h1>Deep dives into<br>real engineering</h1>
    <p>Battle-tested insights from production systems. Learn what actually works at scale.</p>
    <div class="hero-actions">
      <a href="#articles" class="hero-cta"><i data-lucide="book-open"></i> Browse Articles</a>
      <a href="/channels/" class="hero-cta-secondary"><i data-lucide="grid-3x3"></i> All Topics</a>
    </div>
  </div></section>
  
  <section class="stats-bar"><div class="container">
    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-value"><i data-lucide="file-text"></i> ${totalArticles}</span>
        <span class="stat-label">Deep Dives</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value"><i data-lucide="layers"></i> ${totalCategories}</span>
        <span class="stat-label">Topics</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value"><i data-lucide="clock"></i> ${readingHours}h+</span>
        <span class="stat-label">Of Content</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value"><i data-lucide="heart"></i> Free</span>
        <span class="stat-label">Forever</span>
      </div>
    </div>
  </div></section>
  
  ${featuredHtml}
  
  <section class="topics-section"><div class="container">
    <h2 class="topics-title"><i data-lucide="compass"></i> Explore by Topic</h2>
    <div class="category-pills">${categoryPills}</div>
  </div></section>
  
  <section class="article-list" id="articles"><div class="container">
    <div class="section-header">
      <h2 class="section-title"><i data-lucide="newspaper"></i> All Articles</h2>
      <div class="diff-filters">
        <button class="diff-filter active" onclick="filterArticles('all')">All</button>
        <button class="diff-filter beginner" onclick="filterArticles('beginner')">Beginner (${byDifficulty.beginner.length})</button>
        <button class="diff-filter intermediate" onclick="filterArticles('intermediate')">Intermediate (${byDifficulty.intermediate.length})</button>
        <button class="diff-filter advanced" onclick="filterArticles('advanced')">Advanced (${byDifficulty.advanced.length})</button>
      </div>
    </div>
    <div class="articles-grid" id="articlesGrid">${articleCards}</div>
  </div></section>
  
  <section class="newsletter"><div class="container">
    <div class="newsletter-card">
      <h2>Ready to ace your interviews?</h2>
      <p>Practice with 1000+ real interview questions from FAANG companies</p>
      <a href="https://open-interview.github.io" target="_blank" class="newsletter-btn">Start Practicing Free →</a>
    </div>
  </div></section>
</main>

<script>
function filterArticles(difficulty) {
  const cards = document.querySelectorAll('.article-card');
  const buttons = document.querySelectorAll('.diff-filter');
  
  buttons.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  cards.forEach(card => {
    if (difficulty === 'all' || card.dataset.difficulty === difficulty) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}
</script>
${generateFooter(articles)}`;
}

function getCategoryEmoji(category) {
  const emojis = {
    'System Design': '🏗️', 'Algorithms & Data Structures': '🧮', 'Frontend Development': '🎨',
    'Backend Development': '⚙️', 'Database & Storage': '🗄️', 'DevOps & Infrastructure': '🔧',
    'Site Reliability': '🛡️', 'AI & Machine Learning': '🤖', 'Security': '🔐',
    'Testing & QA': '🧪', 'Mobile Development': '📱', 'Networking & Systems': '🌐',
    'Leadership & Soft Skills': '👥', 'Data Engineering': '📊'
  };
  return emojis[category] || '📚';
}

function generateCategoryPage(category, articles, allArticles) {
  const channels = categoryMap[category] || [];
  const categoryArticles = articles.filter(a => channels.includes(a.channel));

  let articleCards = categoryArticles.map(a => {
    const tags = a.tags || [];
    const displayTags = tags.slice(0, 3);
    return `
    <div class="article-card">
      <div class="card-header">
        <span class="badge badge-channel"><i data-lucide="folder"></i> ${formatChannelName(a.channel)}</span>
        <span class="badge badge-difficulty badge-${a.difficulty}"><i data-lucide="${a.difficulty === 'beginner' ? 'zap' : a.difficulty === 'intermediate' ? 'flame' : 'rocket'}"></i> ${a.difficulty}</span>
      </div>
      <h2 class="card-title"><a href="/posts/${a.id}/${a.blogSlug}/">${escapeHtml(a.blogTitle)}</a></h2>
      <p class="card-excerpt">${escapeHtml((a.blogIntro || '').substring(0, 120))}...</p>
      <div class="card-footer">
        <div class="card-tags">
          ${displayTags.map(tag => `<span class="badge badge-tag"><i data-lucide="tag"></i> ${tag}</span>`).join('')}
        </div>
        <a href="/posts/${a.id}/${a.blogSlug}/" class="card-link"><i data-lucide="arrow-right"></i> Read more</a>
      </div>
    </div>`;
  }).join('');

  const baseUrl = process.env.BLOG_BASE_URL || 'https://open-interview.github.io';
  const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const collectionJsonLd = `
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"CollectionPage","name":"${escapeHtml(category)} - DevInsights","url":"${baseUrl}/channels/${categorySlug}/","description":"${categoryArticles.length} articles about ${category}. Real-world engineering insights for developers.","isPartOf":{"@type":"Blog","name":"DevInsights","url":"${baseUrl}"},"author":{"@type":"Person","name":"${AUTHOR.name}"}}
  </script>`;

  return `${generateHead(category, `${categoryArticles.length} articles about ${category}`)}
${collectionJsonLd}
${generateHeader()}
<main><section class="article-list" style="padding-top:7rem"><div class="container">
  <a href="/" style="color:var(--text-muted);text-decoration:none;font-size:0.8125rem;display:inline-flex;align-items:center;gap:0.25rem"><i data-lucide="arrow-left"></i> Back</a>
  <h1 style="margin:1.5rem 0 0.5rem;font-size:2rem;font-weight:700;letter-spacing:-0.03em">${category}</h1>
  <p style="color:var(--text-muted);margin-bottom:2.5rem;font-size:0.9375rem"><i data-lucide="file-text"></i> ${categoryArticles.length} deep dives</p>
  <div class="articles-grid">${articleCards}</div>
</div></section></main>
${generateFooter(allArticles)}`;
}


function generateArticlePage(article, allArticles) {
  const category = getCategoryForChannel(article.channel);
  const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const hasDiagram = !!article.diagram;
  const glossary = article.glossary || [];
  const baseUrl = process.env.BLOG_BASE_URL || 'https://open-interview.github.io';
  const articleUrl = `${baseUrl}/posts/${article.id}/${article.blogSlug}/`;
  const publishedDate = article.createdAt ? new Date(article.createdAt).toISOString() : '';
  const formattedDate = article.createdAt ? new Date(article.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  
  // Estimated read time (needed for JSON-LD)
  const wordCount = [
    article.blogIntro || '',
    ...(article.blogSections || []).map(s => s.content || ''),
    article.blogConclusion || ''
  ].join(' ').split(/\s+/).length;
  const readMins = Math.max(1, Math.round(wordCount / 200));

  // Featured image URL for JSON-LD (handle both absolute and relative URLs)
  const featuredImg = (Array.isArray(article.images) ? article.images : []).find(i => i.placement === 'hero' || i.placement === 'after-intro');
  const featuredImageUrl = featuredImg?.url
    ? (featuredImg.url.startsWith('http') ? featuredImg.url : `${baseUrl}${featuredImg.url}`)
    : `${baseUrl}/opengraph.jpg`;

  // Breadcrumb JSON-LD
  const breadcrumbJsonLd = `
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"${baseUrl}/"},{"@type":"ListItem","position":2,"name":"Topics","item":"${baseUrl}/channels/"},{"@type":"ListItem","position":3,"name":"${escapeHtml(category)}","item":"${baseUrl}/channels/${categorySlug}/"},{"@type":"ListItem","position":4,"name":"${escapeHtml(article.blogTitle)}","item":"${articleUrl}"}]}
  </script>`;

  // BlogPosting JSON-LD structured data for SEO
  const blogPostingJsonLd = `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "${articleUrl}"
    },
    "headline": "${escapeHtml(article.blogTitle)}",
    "description": "${escapeHtml((article.blogMeta || article.blogIntro || '').substring(0, 500))}",
    "image": "${featuredImageUrl}",
    "author": {
      "@type": "Person",
      "name": "${AUTHOR.name}",
      "url": "${AUTHOR.github}",
      "image": "${AUTHOR.avatar}"
    },
    "publisher": {
      "@type": "Organization",
      "name": "DevInsights",
      "logo": {
        "@type": "ImageObject",
        "url": "${baseUrl}/opengraph.jpg"
      }
    },
    "datePublished": "${publishedDate ? new Date(article.createdAt).toISOString().split('T')[0] : ''}",
    "dateModified": "${publishedDate ? new Date(article.createdAt).toISOString().split('T')[0] : ''}",
    "articleSection": "${escapeHtml(category)}",
    "keywords": "${(article.tags || []).map(t => escapeHtml(t)).join(', ')}",
    "wordCount": ${wordCount},
    "inLanguage": "en",
    "url": "${articleUrl}",
    "isPartOf": {
      "@type": "Blog",
      "name": "DevInsights",
      "url": "${baseUrl}"
    }
  }
  </script>`;
  
  // Related articles (same channel, different article)
  const related = allArticles
    .filter(a => a.channel === article.channel && a.id !== article.id)
    .slice(0, 3);
  
  // Images by placement
  const images = Array.isArray(article.images) ? article.images : [];
  const imagesByPlacement = {};
  images.forEach(img => {
    if (img && img.url && img.placement) {
      imagesByPlacement[img.placement] = img;
    }
  });
  
  // Helper to generate image HTML
  const generateImageHtml = (img, priority = false) => {
    if (!img) return '';
    const fetchPriority = priority ? ' fetchpriority="high"' : '';
    return `<figure class="article-image">
      <img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.alt || '')}" loading="lazy" decoding="async"${fetchPriority}>
      ${img.caption ? `<figcaption>${escapeHtml(img.caption)}</figcaption>` : ''}
    </figure>`;
  };
  
  // Build sections with images
  let sectionsHtml = '';
  
  // Add image after intro if specified
  if (imagesByPlacement['after-intro']) {
    sectionsHtml += generateImageHtml(imagesByPlacement['after-intro'], true);
  }
  
  // Add sections with images
  (article.blogSections || []).forEach((s, idx) => {
    sectionsHtml += `<h2>${escapeHtml(s.heading)}</h2>${markdownToHtml(s.content, glossary)}`;
    
    // Check for image after this section
    const placement = `after-section-${idx + 1}`;
    if (imagesByPlacement[placement]) {
      sectionsHtml += generateImageHtml(imagesByPlacement[placement]);
    }
  });
  
  // Real-world example section
  if (article.realWorldExample) {
    const ex = article.realWorldExample;
    sectionsHtml += `
    <div class="real-world-example">
      <h3><i data-lucide="building-2"></i> Real-World Case Study</h3>
      <div class="company"><i data-lucide="briefcase"></i> ${escapeHtml(ex.company)}</div>
      <p class="scenario">${escapeHtml(ex.scenario)}</p>
      <div class="lesson"><i data-lucide="lightbulb"></i> <strong>Key Takeaway:</strong> ${escapeHtml(ex.lesson)}</div>
    </div>`;
  }
  
  // Diagram section
  if (article.diagram) {
    // Convert literal \n (stored as backslash + n in database) to actual newlines for mermaid
    let diagramCode = article.diagram.replace(/\\n/g, '\n');
    
    // Determine diagram label - use AI-generated label or detect from mermaid syntax
    let diagramLabel = article.diagramLabel || 'Architecture Overview';
    if (!article.diagramLabel && diagramCode) {
      const diagramLower = diagramCode.toLowerCase().trim();
      if (diagramLower.startsWith('sequencediagram')) {
        diagramLabel = 'Event Sequence';
      } else if (diagramLower.startsWith('statediagram')) {
        diagramLabel = 'State Transitions';
      } else if (diagramLower.startsWith('classdiagram')) {
        diagramLabel = 'Class Structure';
      } else if (diagramLower.startsWith('erdiagram')) {
        diagramLabel = 'Data Model';
      } else if (diagramLower.startsWith('gantt')) {
        diagramLabel = 'Project Timeline';
      } else if (diagramLower.startsWith('pie')) {
        diagramLabel = 'Distribution Chart';
      } else if (diagramLower.startsWith('mindmap')) {
        diagramLabel = 'Concept Map';
      } else if (diagramLower.startsWith('timeline')) {
        diagramLabel = 'Timeline';
      } else if (diagramLower.startsWith('flowchart') || diagramLower.startsWith('graph')) {
        diagramLabel = 'System Flow';
      }
    }
    sectionsHtml += `<h2>${escapeHtml(diagramLabel)}</h2><div class="mermaid">${diagramCode}</div>`;
  }
  
  // Fun fact
  if (article.funFact) {
    sectionsHtml += `<div class="fun-fact"><span class="fun-fact-icon"><i data-lucide="sparkles"></i></span><p><strong>Did you know?</strong> ${escapeHtmlWithCitations(article.funFact)}</p></div>`;
  }
  
  // Quick reference
  const quickRef = article.quickReference || [];
  if (quickRef.length > 0) {
    sectionsHtml += `<div class="quick-ref"><h3><i data-lucide="bookmark"></i> Key Takeaways</h3><ul>${quickRef.map(r => `<li>${escapeHtmlWithCitations(r)}</li>`).join('')}</ul></div>`;
  }
  
  // Sources with numbered references
  const sources = article.sources || [];
  if (sources.length > 0) {
    const sourceItems = sources.map((s, idx) => {
      const url = typeof s.url === 'string' ? s.url : (s.url?.href || s.url?.url || '#');
      const title = typeof s.title === 'string' ? s.title : (s.title?.text || s.title?.name || String(s.title || ''));
      return `<li id="source-${idx + 1}"><span class="source-num">${idx + 1}</span><a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(title)}</a><span class="source-type">${s.type || 'article'}</span></li>`;
    }).join('');
    sectionsHtml += `<div class="sources"><h3><i data-lucide="book-open"></i> References</h3><ul>${sourceItems}</ul></div>`;
  }
  
  // Social snippet - shareable section
  const socialSnippet = article.socialSnippet;
  if (socialSnippet) {
    // Include hashtags in the snippet text for LinkedIn
    const hashtags = socialSnippet.hashtags || '';
    const snippetText = `${socialSnippet.hook}\n\n${socialSnippet.body}\n\n${socialSnippet.cta}${hashtags ? '\n\n' + hashtags : ''}`;
    const encodedText = encodeURIComponent(snippetText + `\n\n🔗 `);
    const articleUrl = `${process.env.BLOG_BASE_URL || 'https://open-interview.github.io'}/posts/${article.id}/${article.blogSlug}/`;
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodeURIComponent(articleUrl)}`;
    
    sectionsHtml += `
    <div class="share-snippet">
      <div class="share-snippet-header">
        <span class="share-icon"><i data-lucide="share-2"></i></span>
        <h3>Share This</h3>
        <div class="share-buttons">
          <a href="${linkedInUrl}" target="_blank" rel="noopener" class="share-btn linkedin" title="Share on LinkedIn">
            <i data-lucide="linkedin"></i>
          </a>
          <a href="${twitterUrl}" target="_blank" rel="noopener" class="share-btn twitter" title="Share on X/Twitter">
            <i data-lucide="twitter"></i>
          </a>
          <button class="share-btn copy" onclick="copySnippet(this)" title="Copy to clipboard">
            <i data-lucide="copy"></i>
          </button>
        </div>
      </div>
      <div class="share-snippet-content" id="shareSnippet">
        <p class="snippet-hook">${escapeHtml(socialSnippet.hook)}</p>
        <p class="snippet-body">${escapeHtml(socialSnippet.body).replace(/\n/g, '<br>')}</p>
        <p class="snippet-cta">${escapeHtml(socialSnippet.cta)}</p>
        ${hashtags ? `<p class="snippet-hashtags">${escapeHtml(hashtags)}</p>` : ''}
        <p class="snippet-link"><i data-lucide="link"></i> ${articleUrl}</p>
      </div>
    </div>
    <script>
    function copySnippet(btn) {
      const snippet = document.getElementById('shareSnippet').innerText;
      navigator.clipboard.writeText(snippet).then(() => {
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
        setTimeout(() => {
          btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
        }, 2000);
      });
    }
    </script>`;
  }
  
  // Related articles section
  let relatedHtml = '';
  if (related.length > 0) {
    relatedHtml = `
    <div class="related-articles">
      <h3>Continue Reading</h3>
      <div class="related-grid">
        ${related.map(r => `
          <a href="/posts/${r.id}/${r.blogSlug}/" class="related-card">
            <span class="related-title">${escapeHtml(r.blogTitle)}</span>
            <span class="related-meta">${r.difficulty}</span>
          </a>
        `).join('')}
      </div>
    </div>`;
  }
  
  // Author card HTML
  const authorHtml = `
  <div class="author-card">
    <img src="${AUTHOR.avatar}" alt="${AUTHOR.name}" class="author-avatar" loading="lazy" decoding="async">
    <div class="author-info">
      <div class="author-name">${AUTHOR.name}</div>
      <div class="author-role">${AUTHOR.role}</div>
      <div class="author-links">
        <a href="${AUTHOR.website}" target="_blank" rel="noopener">
          <i data-lucide="globe"></i>
          Website
        </a>
        <a href="${AUTHOR.github}" target="_blank" rel="noopener">
          <i data-lucide="github"></i>
          GitHub
        </a>
        <a href="${AUTHOR.linkedin}" target="_blank" rel="noopener">
          <i data-lucide="linkedin"></i>
          LinkedIn
        </a>
      </div>
    </div>
  </div>`;
  
  const tags = (article.tags || []).slice(0, 3).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join(' ');

  // Build TOC from sections
  const tocItems = (article.blogSections || [])
    .filter(s => s.heading)
    .map((s, i) => {
      const id = 'section-' + i;
      return { id, heading: s.heading };
    });
  if (article.diagram) tocItems.push({ id: 'section-diagram', heading: article.diagramLabel || 'Architecture Overview' });
  if (article.blogConclusion) tocItems.push({ id: 'section-conclusion', heading: 'Wrapping Up' });

  const tocHtml = tocItems.length > 2 ? `
  <aside class="article-toc">
    <div class="toc-title"><i data-lucide="list"></i> Contents</div>
    <ul class="toc-list">
      ${tocItems.map(t => `<li><a href="#${t.id}">${escapeHtml(t.heading)}</a></li>`).join('')}
    </ul>
  </aside>` : '';

  // Patch section headings with IDs for TOC
  let sectionIdx = 0;
  const origSections = article.blogSections || [];

  return `${generateHead(article.blogTitle, article.blogMeta || article.blogIntro?.substring(0,160) || article.blogTitle, hasDiagram, {
    isArticle: true,
    articleUrl,
    imageUrl: article.images?.[0]?.url || `${baseUrl}/opengraph.jpg`,
    publishedDate,
    authorName: AUTHOR.name
  })}
${breadcrumbJsonLd}
${blogPostingJsonLd}
${generateHeader()}
<main>
<div class="article-layout">
  <article>
    <nav aria-label="Breadcrumb" class="breadcrumb-nav">
      <ol class="breadcrumb" itemscope itemtype="https://schema.org/BreadcrumbList">
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem"><a href="/" itemprop="item"><span itemprop="name">Home</span></a><meta itemprop="position" content="1"></li>
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem"><a href="/channels/" itemprop="item"><span itemprop="name">Topics</span></a><meta itemprop="position" content="2"></li>
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem"><a href="/channels/${categorySlug}/" itemprop="item"><span itemprop="name">${escapeHtml(category)}</span></a><meta itemprop="position" content="3"></li>
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem" aria-current="page"><span itemprop="name">${escapeHtml(article.blogTitle)}</span><meta itemprop="position" content="4"></li>
      </ol>
    </nav>
    <div class="article-header">
      <h1>${escapeHtml(article.blogTitle)}</h1>
      <div class="article-meta" style="justify-content:flex-start;margin-top:1rem">
        <span class="tag">${formatChannelName(article.channel)}</span>
        <span class="difficulty ${article.difficulty}">${article.difficulty}</span>
        ${tags}
        <span class="article-read-time"><i data-lucide="clock"></i> ${readMins} min read</span>
        ${formattedDate ? `<span class="article-date"><i data-lucide="calendar"></i> ${formattedDate}</span>` : ''}
      </div>
    </div>
    <p class="article-intro">${escapeHtmlWithCitations(article.blogIntro || (article.blogSections?.[0]?.content || '').substring(0, 300))}</p>
    <div class="article-content">
      ${sectionsHtml.replace(/<h2>/g, () => {
        const id = 'section-' + (sectionIdx++);
        return `<h2 id="${id}">`;
      })}
      ${imagesByPlacement['before-conclusion'] ? generateImageHtml(imagesByPlacement['before-conclusion']) : ''}
      <h2 id="section-conclusion">Wrapping Up</h2>
      <p>${escapeHtmlWithCitations(article.blogConclusion)}</p>
    </div>
    ${authorHtml}
    ${relatedHtml}
    <div style="margin-top:2rem;padding:1.5rem;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);text-align:center;">
      <p style="color:var(--text-secondary);margin-bottom:1rem;">Ready to put this into practice?</p>
      <a href="https://open-interview.github.io/#/channel/${article.channel}" style="display:inline-flex;align-items:center;gap:8px;background:var(--accent);color:var(--bg);padding:10px 22px;border-radius:var(--radius-sm);text-decoration:none;font-weight:600;font-size:0.9375rem;">Practice Questions <i data-lucide="arrow-right"></i></a>
    </div>
  </article>
  ${tocHtml}
</div>
</main>
${generateFooter(allArticles)}`;
}

function generateCategoriesIndexPage(articles) {
  let cards = Object.entries(categoryMap).map(([category, channels]) => {
    const count = articles.filter(a => channels.includes(a.channel)).length;
    if (count === 0) return '';
    const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `<div class="category-card"><h3>${category}</h3><p>${count} articles</p><a href="/channels/${slug}/">Explore</a></div>`;
  }).join('');

  const baseUrl = process.env.BLOG_BASE_URL || 'https://open-interview.github.io';
  const categoriesJsonLd = `
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"CollectionPage","name":"All Topics - DevInsights","url":"${baseUrl}/channels/","description":"Browse all engineering topics. ${articles.length} deep dives across the engineering stack.","isPartOf":{"@type":"Blog","name":"DevInsights","url":"${baseUrl}"},"author":{"@type":"Person","name":"${AUTHOR.name}"}}
  </script>`;

  return `${generateHead('All Topics', 'Browse all engineering topics')}
${categoriesJsonLd}
${generateHeader()}
<main><section class="categories" style="padding-top:7rem"><div class="container">
  <h1 style="margin-bottom:0.5rem;font-size:2rem;font-weight:700;letter-spacing:-0.03em">All Topics</h1>
  <p style="color:var(--text-muted);margin-bottom:2.5rem;font-size:0.9375rem">Deep dives across the engineering stack</p>
  <div class="category-grid">${cards}</div>
</div></section></main>
${generateFooter(articles)}`;
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const htmlOnly = args.includes('--html-only');
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find(a => a.startsWith('--limit='))?.split('=')[1];
  const limit = limitArg ? parseInt(limitArg, 10) : 1;

  console.log('=== 🚀 Blog Generator (LangGraph) ===\n');
  if (dryRun) console.log('🔍 DRY RUN MODE - no DB writes\n');

  console.log('🤖 AI Provider: OpenCode (no API key required)');

  const channelToPixelSvg = (channel) => {
    const c = (channel || '').toLowerCase();
    if (/kubernetes|devops|sre|docker/.test(c)) return 'pixel-devops.svg';
    if (/aws|cloud|gcp|azure/.test(c)) return 'pixel-cloud.svg';
    if (/security/.test(c)) return 'pixel-security.svg';
    if (/database|sql/.test(c)) return 'pixel-database.svg';
    if (/api|backend|nodejs/.test(c)) return 'pixel-api.svg';
    if (/frontend|react|css/.test(c)) return 'pixel-coding.svg';
    if (/machine.learning|ai\b|ml\b/.test(c)) return 'pixel-analytics.svg';
    if (/testing/.test(c)) return 'pixel-testing.svg';
    if (/system.design|architecture/.test(c)) return 'pixel-architecture.svg';
    return 'pixel-default.svg';
  };

  if (htmlOnly) {
    // Fallback: load from MDX files in content/posts/, then data/blog-posts.json
    let articles = loadPostsFromMDX();
    if (!articles.length) {
      const fallbackPath = path.join(process.cwd(), 'data/blog-posts.json');
      if (!fs.existsSync(fallbackPath)) {
        console.log('⚠️  No MDX posts found and data/blog-posts.json not found — skipping blog generation');
        process.exit(0);
      }
      articles = JSON.parse(fs.readFileSync(fallbackPath, 'utf-8'));
      if (!articles.length) {
        console.log('⚠️  data/blog-posts.json is empty — skipping blog generation');
        process.exit(0);
      }
      console.log(`📂 Using JSON fallback: ${articles.length} posts from data/blog-posts.json`);
    } else {
      console.log(`📂 Using MDX fallback: ${articles.length} posts from content/posts/`);
    }
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.mkdirSync(path.join(OUTPUT_DIR, 'images'), { recursive: true });
    // Write SVG images from cached svgContent
    for (const article of articles) {
      const svgContent = article.svgContent || {};
      for (const [filename, svg] of Object.entries(svgContent)) {
        fs.writeFileSync(path.join(OUTPUT_DIR, 'images', filename), svg);
      }
    }
    // Fallback: copy generic pixel SVG for any post whose image has no cached svgContent
    const PIXEL_SVG_DIR = path.join(__dirname, '..', 'test-svg-output', 'pixel');
    for (const article of articles) {
      const svgContent = article.svgContent || {};
      for (const img of (article.images || [])) {
        if (img && img.url && img.url.startsWith('/images/') && img.url.endsWith('.svg')) {
          const filename = img.url.replace('/images/', '');
          if (!svgContent[filename]) {
            const genericSvg = channelToPixelSvg(article.channel);
            const srcPath = path.join(PIXEL_SVG_DIR, genericSvg);
            const destPath = path.join(OUTPUT_DIR, 'images', filename);
            if (fs.existsSync(srcPath)) {
              fs.copyFileSync(srcPath, destPath);
            }
          }
        }
      }
    }
    fs.writeFileSync(path.join(OUTPUT_DIR, 'style.css'), generateCSS());
    
    // Generate external search data
    const searchData = articles.map(a => ({
      id: a.id, slug: a.blogSlug, title: a.blogTitle,
      intro: (a.blogIntro || '').substring(0, 150),
      channel: a.channel, difficulty: a.difficulty, tags: a.tags || []
    }));
    const baseUrl = process.env.BLOG_BASE_URL || 'https://open-interview.github.io';
    fs.writeFileSync(path.join(OUTPUT_DIR, 'search-data.js'),
`const searchData = ${JSON.stringify(searchData)};
function openSearch(){document.getElementById('searchModal').classList.add('open');document.getElementById('searchInput').focus();document.body.style.overflow='hidden';}
function closeSearch(){document.getElementById('searchModal').classList.remove('open');document.body.style.overflow='';document.getElementById('searchInput').value='';document.getElementById('searchResults').innerHTML='<div class="search-empty">Start typing to search articles…</div>';}
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();openSearch();}if(e.key==='Escape')closeSearch();});
document.getElementById('searchInput')?.addEventListener('input',e=>{const q=e.target.value.toLowerCase().trim();const results=document.getElementById('searchResults');if(!q){results.innerHTML='<div class="search-empty">Start typing to search articles…</div>';return;}const matches=searchData.filter(a=>a.title.toLowerCase().includes(q)||(a.intro||'').toLowerCase().includes(q)||a.channel.toLowerCase().includes(q)||(a.tags||[]).some(t=>t.toLowerCase().includes(q))).slice(0,8);if(!matches.length){results.innerHTML='<div class="search-empty">No articles found</div>';return;}results.innerHTML=matches.map(a=>\`<a href="/posts/\${a.id}/\${a.slug}/" class="search-result"><div class="search-result-title">\${a.title}</div><div class="search-result-meta"><span class="tag">\${a.channel.replace(/-/g,' ')}</span><span class="difficulty \${a.difficulty}">\${a.difficulty}</span></div></a>\`).join('');});
function toggleTheme(){const html=document.documentElement;const next=html.getAttribute('data-theme')==='dark'?'light':'dark';html.setAttribute('data-theme',next);localStorage.setItem('theme',next);}
window.addEventListener('scroll',()=>{const bar=document.getElementById('reading-progress');const btt=document.getElementById('back-to-top');if(bar){const doc=document.documentElement;const pct=(doc.scrollTop/(doc.scrollHeight-doc.clientHeight))*100;bar.style.width=Math.min(pct,100)+'%';}if(btt)btt.classList.toggle('visible',window.scrollY>400);});
const tocLinks=document.querySelectorAll('.toc-list a');if(tocLinks.length){const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){tocLinks.forEach(l=>l.classList.remove('active'));const active=document.querySelector('.toc-list a[href="#'+e.target.id+'"]');if(active)active.classList.add('active');}});},{rootMargin:'-20% 0px -70% 0px'});document.querySelectorAll('.article-content h2[id]').forEach(h=>observer.observe(h));}
function filterArticles(difficulty,btn){document.querySelectorAll('.diff-filter').forEach(b=>b.classList.remove('active'));if(btn)btn.classList.add('active');document.querySelectorAll('.article-card').forEach(card=>{card.style.display=(difficulty==='all'||card.dataset.difficulty===difficulty)?'':'none';});}
function copySnippet(btn){const snippet=document.getElementById('shareSnippet')?.innerText;if(!snippet)return;navigator.clipboard.writeText(snippet).then(()=>{btn.innerHTML='<i data-lucide="check"></i>';if(typeof lucide!=='undefined')lucide.createIcons();setTimeout(()=>{btn.innerHTML='<i data-lucide="copy"></i>';if(typeof lucide!=='undefined')lucide.createIcons();},2000);});}
if(typeof lucide!=='undefined')lucide.createIcons();
`);
    
    fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), generateIndexPage(articles));
    fs.mkdirSync(path.join(OUTPUT_DIR, 'categories'), { recursive: true });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'categories', 'index.html'), generateCategoriesIndexPage(articles));
    for (const category of Object.keys(categoryMap)) {
      const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const dir = path.join(OUTPUT_DIR, 'categories', slug);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), generateCategoryPage(category, articles, articles));
    }
    // Mirror to channels/
    fs.mkdirSync(path.join(OUTPUT_DIR, 'channels'), { recursive: true });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'channels', 'index.html'), generateCategoriesIndexPage(articles));
    for (const category of Object.keys(categoryMap)) {
      const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const dir = path.join(OUTPUT_DIR, 'channels', slug);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), generateCategoryPage(category, articles, articles));
    }
    const postsDir = path.join(OUTPUT_DIR, 'posts');
    fs.mkdirSync(postsDir, { recursive: true });
    for (const article of articles) {
      const dir = path.join(postsDir, article.id, article.blogSlug);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), generateArticlePage(article, articles));
    }
    
    // Generate 404 page
    const notFoundHtml = `${generateHead('Page Not Found', 'The page you are looking for does not exist')}
${generateHeader()}
<main><section class="not-found"><div class="container"><div class="not-found-content"><div class="not-found-code">404</div><h1>Page Not Found</h1><p>The article you're looking for doesn't exist or has been moved.</p><div class="not-found-actions"><a href="/" class="not-found-btn"><i data-lucide="home"></i> Back to Home</a><a href="/channels/" class="not-found-btn secondary"><i data-lucide="layers"></i> Browse Topics</a></div></div></div></section></main>
${generateFooter(articles)}
<style>.not-found{padding:10rem 0 6rem;text-align:center;min-height:80vh;display:flex;align-items:center}.not-found-content{max-width:500px;margin:0 auto}.not-found-code{font-size:8rem;font-weight:700;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1;margin-bottom:1rem}.not-found-content h1{font-size:2rem;font-weight:600;margin-bottom:1rem}.not-found-content p{color:var(--text-secondary);margin-bottom:2rem;font-size:1.125rem}.not-found-actions{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}.not-found-btn{display:inline-flex;align-items:center;gap:0.5rem;background:var(--accent);color:var(--bg);padding:0.875rem 1.5rem;border-radius:100px;text-decoration:none;font-weight:600;transition:all 0.3s}.not-found-btn:hover{transform:translateY(-2px);box-shadow:0 0 25px rgba(88,166,255,0.4)}.not-found-btn.secondary{background:var(--bg-elevated);color:var(--text);border:1px solid var(--border)}.not-found-btn.secondary:hover{border-color:var(--accent);color:var(--accent)}</style>`;
    fs.writeFileSync(path.join(OUTPUT_DIR, '404.html'), notFoundHtml);

    // RSS feed - full feed with all posts, content summaries, enclosures, and categories
    const allRssArticlesFb = [...articles];
    const rssXmlFb = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>DevInsights - Engineering Knowledge That Ships</title>
    <link>${baseUrl}</link>
    <description>Real-world engineering insights for developers building at scale. Deep dives into production systems, architecture patterns, and battle-tested practices.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <pubDate>${articles[0]?.createdAt ? new Date(articles[0].createdAt).toUTCString() : new Date().toUTCString()}</pubDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <generator>DevInsights Blog Generator</generator>
    <managingEditor>${AUTHOR.name} (${AUTHOR.name})</managingEditor>
    <webMaster>${AUTHOR.name} (${AUTHOR.name})</webMaster>
    <copyright>Copyright ${new Date().getFullYear()} ${AUTHOR.name}</copyright>
    <docs>https://validator.w3.org/feed/docs/rss2.html</docs>
    <ttl>60</ttl>
    <image>
      <url>${baseUrl}/opengraph.jpg</url>
      <title>DevInsights</title>
      <link>${baseUrl}</link>
      <width>1200</width>
      <height>630</height>
    </image>
${allRssArticlesFb.map(a => {
      const pubDate = a.createdAt ? new Date(a.createdAt).toUTCString() : new Date().toUTCString();
      const articleLink = `${baseUrl}/posts/${a.id}/${a.blogSlug}/`;
      const description = escapeHtml((a.blogMeta || a.blogIntro || '').substring(0, 500));
      const category = formatChannelName(a.channel);

      let contentEncoded = `<p>${escapeHtml(a.blogIntro || '')}</p>`;
      if (a.blogSections && a.blogSections.length > 0) {
        const previewSections = a.blogSections.slice(0, 2);
        for (const sec of previewSections) {
          contentEncoded += `<h2>${escapeHtml(sec.heading)}</h2>`;
          const preview = sec.content.substring(0, 300);
          contentEncoded += `<p>${escapeHtml(preview)}${sec.content.length > 300 ? '...' : ''}</p>`;
        }
        if (a.blogSections.length > 2) {
          contentEncoded += `<p><a href="${articleLink}">Read the full article →</a></p>`;
        }
      }
      contentEncoded += `<hr/><p><em>Read the full article at <a href="${articleLink}">${escapeHtml(a.blogTitle)}</a></em></p>`;

      const featuredImage = a.images && a.images.length > 0 ? a.images.find(img => img.placement === 'hero' || img.placement === 'after-intro') : null;
      let enclosure = '';
      if (featuredImage && featuredImage.url) {
        const imageUrl = featuredImage.url.startsWith('http') ? featuredImage.url : `${baseUrl}${featuredImage.url}`;
        const isSvg = featuredImage.url.endsWith('.svg');
        enclosure = `\n      <enclosure url="${imageUrl}" type="${isSvg ? 'image/svg+xml' : 'image/jpeg'}" />`;
      } else {
        enclosure = `\n      <enclosure url="${baseUrl}/opengraph.jpg" type="image/jpeg" />`;
      }

      const imageUrl = featuredImage && featuredImage.url
        ? (featuredImage.url.startsWith('http') ? featuredImage.url : `${baseUrl}${featuredImage.url}`)
        : `${baseUrl}/opengraph.jpg`;
      const mediaThumbnail = `\n      <media:thumbnail url="${imageUrl}" />`;

      const tags = (a.tags || []).slice(0, 5).map(t => `      <category domain="tag">${escapeHtml(t)}</category>`).join('\n');

      return `    <item>
      <title>${escapeHtml(a.blogTitle)}</title>
      <link>${articleLink}</link>
      <guid isPermaLink="true">${articleLink}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${AUTHOR.name}</dc:creator>
      <author>${AUTHOR.name}</author>
      <description>${description}</description>
      <content:encoded><![CDATA[${contentEncoded}]]></content:encoded>
      <category domain="channel">${category}</category>
${tags}
      <source url="${baseUrl}/feed.xml">DevInsights</source>${enclosure}${mediaThumbnail}
    </item>`;
    }).join('\n')}
  </channel>
</rss>`;
    fs.writeFileSync(path.join(OUTPUT_DIR, 'feed.xml'), rssXmlFb);

    fs.writeFileSync(path.join(OUTPUT_DIR, '.nojekyll'), '');
    fs.writeFileSync(path.join(OUTPUT_DIR, 'robots.txt'),
`User-agent: *
Disallow: /admin/
Allow: /

Sitemap: https://open-interview.github.io/sitemap.xml
`);
    const sitemapEntriesFb = [
      `<url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
      `<url><loc>${baseUrl}/channels/</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>`,
      ...articles.map(a => `<url><loc>${baseUrl}/posts/${a.id}/${a.blogSlug}/</loc><lastmod>${a.createdAt ? new Date(a.createdAt).toISOString().substring(0,10) : new Date().toISOString().substring(0,10)}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`)
    ].join('\n');
    fs.writeFileSync(path.join(OUTPUT_DIR, 'sitemap.xml'),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntriesFb}
</urlset>`);
    const adminSrcFb = path.join(process.cwd(), 'admin');
    if (fs.existsSync(adminSrcFb)) {
      const adminDestFb = path.join(OUTPUT_DIR, 'admin');
      fs.mkdirSync(adminDestFb, { recursive: true });
      for (const f of fs.readdirSync(adminSrcFb)) {
        fs.copyFileSync(path.join(adminSrcFb, f), path.join(adminDestFb, f));
      }
    }
    console.log(`\n✅ Blog generated from JSON fallback!`);
    console.log(`   Total posts: ${articles.length}`);
    console.log(`   Output: ${OUTPUT_DIR}/`);
    console.log(`   ✓ search-data.js, feed.xml, 404.html generated`);
    process.exit(0);
  }

  // Blog posts managed via file-based storage (data/questions/*.json + client/public/data/posts.json)
  
  const stats = await getBlogStats();
  console.log(`📊 Current blog posts: ${stats.total}`);
  if (stats.byChannel.length > 0) {
    console.log('   By channel:');
    stats.byChannel.slice(0, 5).forEach(c => console.log(`     ${c.channel}: ${c.count}`));
    if (stats.byChannel.length > 5) console.log(`     ... and ${stats.byChannel.length - 5} more`);
  }
  
  if (!htmlOnly && !dryRun) {
    console.log('\n🔍 Finding questions with interesting real-world cases...');
    
    // Get multiple candidates to try (respect --limit)
    const candidates = await getNextQuestionForBlog(Math.max(MAX_SKIP_ATTEMPTS, limit));
    
    if (candidates.length === 0) {
      console.log('✅ All questions have been converted!');
    } else {
      let blogGenerated = 0;
      let skippedCount = 0;
      
      for (const question of candidates) {
        if (blogGenerated >= limit) break;

        console.log(`\n📝 Trying: ${question.id} (${question.channel})`);
        console.log(`   Q: ${question.question.substring(0, 60)}...`);
        
        try {
          const blogContent = await transformToBlogArticle(question);
          
          // Check if skipped due to no interesting real-world case
          if (blogContent.skipped) {
            skippedCount++;
            console.log(`   ⏭️ Skipped (${skippedCount}/${MAX_SKIP_ATTEMPTS}): ${blogContent.skipReason}`);
            continue;
          }
          
          console.log(`   Title: ${blogContent.title}`);
          
          // Validate sources - remove 404s
          const validatedSources = await validateSources(blogContent.sources || []);
          blogContent.sources = validatedSources;
          
          // Enforce minimum sources requirement
          if (validatedSources.length < MIN_SOURCES) {
            blogContent.skipped = true;
            blogContent.skipReason = `insufficient sources (${validatedSources.length}/${MIN_SOURCES})`;
            skippedCount++;
            console.log(`   ⏭️ Skipping question: ${blogContent.skipReason}`);
            continue;
          }
          
          console.log(`   ✅ ${validatedSources.length} valid sources`);
          
          // Images are deferred - metadata only, actual generation happens during static site build
          const svgContent = {};
          if (blogContent.images && blogContent.images.length > 0) {
            console.log(`🖼️ ${blogContent.images.length} image placeholders prepared (generation deferred)`);
          }
          
          console.log('💾 Saving to database...');
          await saveBlogPost(question.id, blogContent, question, svgContent);
          console.log('✅ Blog post saved!\n');
          blogGenerated++;
          
        } catch (error) {
          if (error.isRefusal) {
            console.log(`   ⚠️ AI refused to generate blog for ${question.id}: ${error.message}`);
          } else {
            console.log(`   ❌ Error: ${error.message}`);
          }
          skippedCount++;
          continue;
        }
      }
      
      if (blogGenerated === 0) {
        console.log(`\n⚠️ Could not generate blog after trying ${skippedCount} questions`);
        console.log('   All candidates either lacked interesting real-world cases or had insufficient sources');
      }
    }
  } else if (dryRun) {
    console.log('\n🔍 DRY RUN: fetching candidates without generating...');
    const candidates = await getNextQuestionForBlog(limit);
    if (candidates.length === 0) {
      console.log('✅ No unconverted questions found.');
    } else {
      console.log(`Found ${candidates.length} candidate(s):`);
      candidates.forEach(q => console.log(`  - ${q.id} [${q.channel}]: ${q.question.substring(0, 60)}...`));
    }
  } else {
    console.log('\n⏭️ Skipping content generation (--html-only mode)');
  }
  
  console.log('\n📄 Regenerating static site...');
  
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(path.join(OUTPUT_DIR, 'images'), { recursive: true });
  
  const articles = await getAllBlogPosts();
  console.log(`   Total articles: ${articles.length}`);
  
  if (articles.length === 0) {
    console.log('   No articles yet, skipping site generation');
    return;
  }
  
  // Write SVG images - use cached from DB or generate new ones
  console.log('\n🎨 Processing cartoon illustrations...');
  let cachedCount = 0;
  let generatedCount = 0;
  
  for (const article of articles) {
    if (article.images && article.images.length > 0) {
      const svgContent = article.svgContent || {};
      let needsUpdate = false;
      
      for (const img of article.images) {
        if (img && img.url && img.url.startsWith('/images/') && img.url.endsWith('.svg')) {
          const filename = img.url.replace('/images/', '');
          const filenameNoExt = filename.replace('.svg', '');
          const outputPath = path.join(OUTPUT_DIR, 'images', filename);
          
          // Check if SVG is cached in database
          if (svgContent[filename]) {
            // Write cached SVG to file
            fs.writeFileSync(outputPath, svgContent[filename]);
            cachedCount++;
          } else {
            // Generate new SVG - use pixel art style for social/hero images
            try {
              // Use pixel art for hero/social images, default for others
              const usePixelArt = img.placement === 'hero' || img.placement === 'social' || img.placement === 'after-intro';
              
              const result = usePixelArt 
                ? await generatePixelIllustration(
                    article.blogTitle,
                    img.alt || article.blogIntro || article.blogTitle,
                    filenameNoExt,
                    { channel: article.channel }
                  )
                : await generateIllustration(
                    article.blogTitle,
                    img.alt || article.blogIntro || article.blogTitle,
                    filenameNoExt,
                    { placement: img.placement || 'after-intro', channel: article.channel }
                  );
              
              // Read the generated SVG and cache it
              const svgData = fs.readFileSync(result.path, 'utf-8');
              svgContent[filename] = svgData;
              needsUpdate = true;
              generatedCount++;
            } catch (err) {
              console.log(`   ⚠️ Failed to generate ${img.url}: ${err.message}`);
              // Fallback: copy generic pixel SVG so the image slot is never empty
              if (!svgContent[filename]) {
                const genericSvg = channelToPixelSvg(article.channel);
                const srcPath = path.join(__dirname, '..', 'test-svg-output', 'pixel', genericSvg);
                if (fs.existsSync(srcPath)) {
                  fs.copyFileSync(srcPath, outputPath);
                }
              }
            }
          }
        }
      }
      
      // Update database with new SVG content if any were generated
      if (needsUpdate) {
        try {
          await updateSvgContent(article.id, svgContent);
        } catch (err) {
          console.log(`   ⚠️ Failed to cache SVGs for ${article.id}: ${err.message}`);
        }
      }
    }
  }
  console.log(`   ✅ ${cachedCount} from cache, ${generatedCount} newly generated`);
  
  // Generate CSS with default theme
  fs.writeFileSync(path.join(OUTPUT_DIR, 'style.css'), generateCSS());
  
  // Generate external search data (shared across all pages)
  const searchData = articles.map(a => ({
    id: a.id,
    slug: a.blogSlug,
    title: a.blogTitle,
    intro: (a.blogIntro || '').substring(0, 150),
    channel: a.channel,
    difficulty: a.difficulty,
    tags: a.tags || []
  }));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'search-data.js'),
`// Shared search data for all blog pages
const searchData = ${JSON.stringify(searchData)};

function openSearch() {
  document.getElementById('searchModal').classList.add('open');
  document.getElementById('searchInput').focus();
  document.body.style.overflow = 'hidden';
}
function closeSearch() {
  document.getElementById('searchModal').classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('searchInput').value = '';
  document.getElementById('searchResults').innerHTML = '<div class="search-empty">Start typing to search articles…</div>';
}
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
  if (e.key === 'Escape') closeSearch();
});
document.getElementById('searchInput')?.addEventListener('input', e => {
  const q = e.target.value.toLowerCase().trim();
  const results = document.getElementById('searchResults');
  if (!q) { results.innerHTML = '<div class="search-empty">Start typing to search articles…</div>'; return; }
  const matches = searchData.filter(a =>
    a.title.toLowerCase().includes(q) ||
    (a.intro||'').toLowerCase().includes(q) ||
    a.channel.toLowerCase().includes(q) ||
    (a.tags||[]).some(t => t.toLowerCase().includes(q))
  ).slice(0, 8);
  if (!matches.length) { results.innerHTML = '<div class="search-empty">No articles found</div>'; return; }
  results.innerHTML = matches.map(a => \`<a href="/posts/\${a.id}/\${a.slug}/" class="search-result">
    <div class="search-result-title">\${a.title}</div>
    <div class="search-result-meta"><span class="tag">\${a.channel.replace(/-/g,' ')}</span><span class="difficulty \${a.difficulty}">\${a.difficulty}</span></div>
  </a>\`).join('');
});

function toggleTheme() {
  const html = document.documentElement;
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

window.addEventListener('scroll', () => {
  const bar = document.getElementById('reading-progress');
  const btt = document.getElementById('back-to-top');
  if (bar) {
    const doc = document.documentElement;
    const pct = (doc.scrollTop / (doc.scrollHeight - doc.clientHeight)) * 100;
    bar.style.width = Math.min(pct, 100) + '%';
  }
  if (btt) btt.classList.toggle('visible', window.scrollY > 400);
});

const tocLinks = document.querySelectorAll('.toc-list a');
if (tocLinks.length) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        tocLinks.forEach(l => l.classList.remove('active'));
        const active = document.querySelector('.toc-list a[href="#' + e.target.id + '"]');
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  document.querySelectorAll('.article-content h2[id]').forEach(h => observer.observe(h));
}

function filterArticles(difficulty, btn) {
  document.querySelectorAll('.diff-filter').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.article-card').forEach(card => {
    card.style.display = (difficulty === 'all' || card.dataset.difficulty === difficulty) ? '' : 'none';
  });
}

function copySnippet(btn) {
  const snippet = document.getElementById('shareSnippet')?.innerText;
  if (!snippet) return;
  navigator.clipboard.writeText(snippet).then(() => {
    btn.innerHTML = '<i data-lucide="check"></i>';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    setTimeout(() => { btn.innerHTML = '<i data-lucide="copy"></i>'; if (typeof lucide !== 'undefined') lucide.createIcons(); }, 2000);
  });
}

if (typeof lucide !== 'undefined') lucide.createIcons();
`);
  console.log('   ✓ search-data.js generated');
  
  // Generate CSS with default theme
  fs.writeFileSync(path.join(OUTPUT_DIR, 'style.css'), generateCSS());
  
  // Generate index
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), generateIndexPage(articles));
  
  // Generate categories
  fs.mkdirSync(path.join(OUTPUT_DIR, 'categories'), { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'categories', 'index.html'), generateCategoriesIndexPage(articles));
  
  for (const category of Object.keys(categoryMap)) {
    const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const dir = path.join(OUTPUT_DIR, 'categories', slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), generateCategoryPage(category, articles, articles));
  }
  
  // Mirror to channels/
  fs.mkdirSync(path.join(OUTPUT_DIR, 'channels'), { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'channels', 'index.html'), generateCategoriesIndexPage(articles));
  for (const category of Object.keys(categoryMap)) {
    const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const dir = path.join(OUTPUT_DIR, 'channels', slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), generateCategoryPage(category, articles, articles));
  }
  
  // Generate article pages
  const postsDir = path.join(OUTPUT_DIR, 'posts');
  fs.mkdirSync(postsDir, { recursive: true });
  
  // Detect duplicate slugs before writing any files
  const seenSlugs = new Set();
  for (const article of articles) {
    if (seenSlugs.has(article.blogSlug)) {
      console.error(`❌ Duplicate blogSlug detected: "${article.blogSlug}" — aborting`);
      process.exit(1);
    }
    seenSlugs.add(article.blogSlug);
  }

  for (const article of articles) {
    const dir = path.join(postsDir, article.id, article.blogSlug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), generateArticlePage(article, articles));
  }
  
  // Generate RSS/Atom feed with all posts, full content summaries, enclosures, and categories
  const baseUrl = process.env.BLOG_BASE_URL || 'https://open-interview.github.io';
  const allRssArticles = [...articles]; // Include ALL posts for complete feed

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>DevInsights - Engineering Knowledge That Ships</title>
    <link>${baseUrl}</link>
    <description>Real-world engineering insights for developers building at scale. Deep dives into production systems, architecture patterns, and battle-tested practices from FAANG and startup engineers.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <pubDate>${articles[0]?.createdAt ? new Date(articles[0].createdAt).toUTCString() : new Date().toUTCString()}</pubDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <generator>DevInsights Blog Generator</generator>
    <managingEditor>${AUTHOR.name} (${AUTHOR.name})</managingEditor>
    <webMaster>${AUTHOR.name} (${AUTHOR.name})</webMaster>
    <copyright>Copyright ${new Date().getFullYear()} ${AUTHOR.name}. All rights reserved.</copyright>
    <docs>https://validator.w3.org/feed/docs/rss2.html</docs>
    <ttl>60</ttl>
    <image>
      <url>${baseUrl}/opengraph.jpg</url>
      <title>DevInsights - Engineering Knowledge That Ships</title>
      <link>${baseUrl}</link>
      <width>1200</width>
      <height>630</height>
    </image>
${allRssArticles.map(a => {
    const pubDate = a.createdAt ? new Date(a.createdAt).toUTCString() : new Date().toUTCString();
    const articleLink = `${baseUrl}/posts/${a.id}/${a.blogSlug}/`;
    const description = escapeHtml((a.blogMeta || a.blogIntro || '').substring(0, 500));
    const category = formatChannelName(a.channel);

    // Build content:encoded with summary (intro + key sections preview)
    let contentEncoded = `<p>${escapeHtml(a.blogIntro || '')}</p>`;
    if (a.blogSections && a.blogSections.length > 0) {
      const previewSections = a.blogSections.slice(0, 2);
      for (const sec of previewSections) {
        contentEncoded += `<h2>${escapeHtml(sec.heading)}</h2>`;
        const preview = sec.content.substring(0, 300);
        contentEncoded += `<p>${escapeHtml(preview)}${sec.content.length > 300 ? '...' : ''}</p>`;
      }
      if (a.blogSections.length > 2) {
        contentEncoded += `<p><a href="${articleLink}">Read the full article →</a></p>`;
      }
    }
    if (a.realWorldExample) {
      contentEncoded += `<p><strong>Case Study:</strong> ${escapeHtml(a.realWorldExample.company)} - ${escapeHtml(a.realWorldExample.scenario.substring(0, 200))}</p>`;
    }
    contentEncoded += `<hr/><p><em>Read the full article at <a href="${articleLink}">${escapeHtml(a.blogTitle)}</a></em></p>`;

    // Build enclosure for featured image
    const featuredImage = a.images && a.images.length > 0 ? a.images.find(img => img.placement === 'hero' || img.placement === 'after-intro') : null;
    let enclosure = '';
    if (featuredImage && featuredImage.url) {
      const imageUrl = featuredImage.url.startsWith('http') ? featuredImage.url : `${baseUrl}${featuredImage.url}`;
      const isSvg = featuredImage.url.endsWith('.svg');
      enclosure = `
      <enclosure url="${imageUrl}" type="${isSvg ? 'image/svg+xml' : 'image/jpeg'}" />`;
    } else {
      // Default og:image as enclosure
      enclosure = `
      <enclosure url="${baseUrl}/opengraph.jpg" type="image/jpeg" />`;
    }

    // Media thumbnail for the featured image
    const mediaThumbUrl = featuredImage && featuredImage.url
      ? (featuredImage.url.startsWith('http') ? featuredImage.url : `${baseUrl}${featuredImage.url}`)
      : `${baseUrl}/opengraph.jpg`;
    const mediaThumbnail = `\n    <media:thumbnail url="${mediaThumbUrl}" />`;

    // Multiple category elements (channel + tags)
    const tags = (a.tags || []).slice(0, 5).map(t => `    <category domain="tag">${escapeHtml(t)}</category>`).join('\n');

    return `    <item>
      <title>${escapeHtml(a.blogTitle)}</title>
      <link>${articleLink}</link>
      <guid isPermaLink="true">${articleLink}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${AUTHOR.name}</dc:creator>
      <author>${AUTHOR.name}</author>
      <description>${description}</description>
      <content:encoded><![CDATA[${contentEncoded}]]></content:encoded>
      <category domain="channel">${category}</category>
${tags}
      <source url="${baseUrl}/feed.xml">DevInsights</source>${enclosure}${mediaThumbnail}
    </item>`;
  }).join('\n')}
  </channel>
</rss>`;
  fs.writeFileSync(path.join(OUTPUT_DIR, 'feed.xml'), rssXml);
  console.log(`   ✓ RSS feed generated (feed.xml) - ${allRssArticles.length} posts`);

  // Generate 404 page for GitHub Pages
  const notFoundHtml = `${generateHead('Page Not Found', 'The page you are looking for does not exist')}
${generateHeader()}
<main>
<section class="not-found">
  <div class="container">
    <div class="not-found-content">
      <div class="not-found-code">404</div>
      <h1>Page Not Found</h1>
      <p>The article you're looking for doesn't exist or has been moved.</p>
      <div class="not-found-actions">
        <a href="/" class="not-found-btn"><i data-lucide="home"></i> Back to Home</a>
        <a href="/channels/" class="not-found-btn secondary"><i data-lucide="layers"></i> Browse Topics</a>
      </div>
    </div>
  </div>
</section>
</main>
${generateFooter(articles)}
<style>
.not-found { padding: 10rem 0 6rem; text-align: center; min-height: 80vh; display: flex; align-items: center; }
.not-found-content { max-width: 500px; margin: 0 auto; }
.not-found-code { font-size: 8rem; font-weight: 700; background: var(--gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1; margin-bottom: 1rem; }
.not-found-content h1 { font-size: 2rem; font-weight: 600; margin-bottom: 1rem; }
.not-found-content p { color: var(--text-secondary); margin-bottom: 2rem; font-size: 1.125rem; }
.not-found-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
.not-found-btn { display: inline-flex; align-items: center; gap: 0.5rem; background: var(--accent); color: var(--bg); padding: 0.875rem 1.5rem; border-radius: 100px; text-decoration: none; font-weight: 600; transition: all 0.3s; }
.not-found-btn:hover { transform: translateY(-2px); box-shadow: 0 0 25px rgba(88,166,255,0.4); }
.not-found-btn.secondary { background: var(--bg-elevated); color: var(--text); border: 1px solid var(--border); }
.not-found-btn.secondary:hover { border-color: var(--accent); color: var(--accent); }
</style>`;
  fs.writeFileSync(path.join(OUTPUT_DIR, '404.html'), notFoundHtml);
  console.log('   ✓ 404 page generated');

  fs.writeFileSync(path.join(OUTPUT_DIR, '.nojekyll'), '');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'robots.txt'),
`User-agent: *
Disallow: /admin/
Allow: /

Sitemap: https://open-interview.github.io/sitemap.xml
`);

  // Generate sitemap with categories and proper dates
  const sitemapEntries = [
    `<url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${baseUrl}/channels/</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>`
  ];
  
  // Add category pages
  for (const category of Object.keys(categoryMap)) {
    const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const count = articles.filter(a => categoryMap[category].includes(a.channel)).length;
    if (count > 0) {
      sitemapEntries.push(`<url><loc>${baseUrl}/channels/${slug}/</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
    }
  }
  
  // Add article pages with proper ISO dates
  for (const a of articles) {
    const lastmod = a.createdAt ? new Date(a.createdAt).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10);
    sitemapEntries.push(`<url><loc>${baseUrl}/posts/${a.id}/${a.blogSlug}/</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`);
  }
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'sitemap.xml'),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.join('\n')}
</urlset>`);
  console.log(`   ✓ sitemap.xml generated (${sitemapEntries.length} URLs)`);

  // Copy admin/ directory if it exists
  const adminSrc = path.join(process.cwd(), 'admin');
  if (fs.existsSync(adminSrc)) {
    const adminDest = path.join(OUTPUT_DIR, 'admin');
    fs.mkdirSync(adminDest, { recursive: true });
    for (const f of fs.readdirSync(adminSrc)) {
      fs.copyFileSync(path.join(adminSrc, f), path.join(adminDest, f));
    }
    console.log('   ✓ admin/ copied');
  }
  
  const newStats = await getBlogStats();
  console.log(`\n✅ Blog generated!`);
  console.log(`   Total posts: ${newStats.total}`);
  console.log(`   Output: ${OUTPUT_DIR}/`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
