/**
 * Blog Generator Script
 * Generates 1 new blog post per run from interview questions dataset
 * Maintains a blog_posts table to track converted questions
 * Uses AI to transform Q&A content into engaging blog articles
 */

import 'dotenv/config';
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import ai from './ai/index.js';

const OUTPUT_DIR = 'blog-output';

// Database connection
const url = process.env.TURSO_DATABASE_URL_RO || process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN_RO || process.env.TURSO_AUTH_TOKEN;
const writeUrl = process.env.TURSO_DATABASE_URL;
const writeToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error('❌ Missing TURSO_DATABASE_URL environment variable');
  process.exit(1);
}

const client = createClient({ url, authToken });
const writeClient = writeUrl ? createClient({ url: writeUrl, authToken: writeToken }) : client;

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
  'DevOps & Infrastructure': ['devops', 'terraform', 'kubernetes', 'aws'],
  'Site Reliability': ['sre'],
  'AI & Machine Learning': ['generative-ai', 'machine-learning', 'llm-ops', 'prompt-engineering', 'nlp', 'computer-vision'],
  'Security': ['security'],
  'Testing & QA': ['testing', 'e2e-testing', 'api-testing', 'performance-testing'],
  'Mobile Development': ['ios', 'android'],
  'Networking & Systems': ['networking', 'linux', 'unix', 'operating-systems'],
  'Leadership & Soft Skills': ['behavioral', 'engineering-management'],
  'Data Engineering': ['data-engineering'],
};


// Initialize blog_posts table
async function initBlogPostsTable() {
  console.log('📦 Ensuring blog_posts table exists...');
  await writeClient.execute(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      introduction TEXT,
      sections TEXT,
      conclusion TEXT,
      meta_description TEXT,
      channel TEXT,
      difficulty TEXT,
      tags TEXT,
      diagram TEXT,
      created_at TEXT,
      published_at TEXT
    )
  `);
  await writeClient.execute(`CREATE INDEX IF NOT EXISTS idx_blog_question ON blog_posts(question_id)`);
  
  // Add new columns if they don't exist (migration)
  const newColumns = [
    { name: 'quick_reference', type: 'TEXT' },
    { name: 'glossary', type: 'TEXT' },
    { name: 'real_world_example', type: 'TEXT' },
    { name: 'fun_fact', type: 'TEXT' },
    { name: 'sources', type: 'TEXT' }
  ];
  
  for (const col of newColumns) {
    try {
      await writeClient.execute(`ALTER TABLE blog_posts ADD COLUMN ${col.name} ${col.type}`);
      console.log(`   Added column: ${col.name}`);
    } catch (e) {
      // Column already exists, ignore
    }
  }
  
  console.log('✅ Table ready\n');
}

// Get next question to convert
async function getNextQuestionForBlog() {
  const result = await client.execute(`
    SELECT q.id, q.question, q.answer, q.explanation, q.diagram, 
           q.difficulty, q.tags, q.channel, q.sub_channel, q.companies
    FROM questions q
    LEFT JOIN blog_posts bp ON q.id = bp.question_id
    WHERE bp.id IS NULL
      AND q.explanation IS NOT NULL 
      AND LENGTH(q.explanation) > 100
    ORDER BY 
      CASE q.channel
        WHEN 'system-design' THEN 1
        WHEN 'algorithms' THEN 2
        WHEN 'frontend' THEN 3
        WHEN 'backend' THEN 4
        ELSE 5
      END,
      q.difficulty,
      RANDOM()
    LIMIT 1
  `);
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    explanation: row.explanation,
    diagram: row.diagram,
    difficulty: row.difficulty,
    tags: row.tags ? JSON.parse(row.tags) : [],
    channel: row.channel,
    subChannel: row.sub_channel,
    companies: row.companies ? JSON.parse(row.companies) : [],
  };
}

// Get all existing blog posts
async function getAllBlogPosts() {
  const result = await client.execute(`SELECT * FROM blog_posts ORDER BY created_at DESC`);
  return result.rows.map(row => ({
    id: row.question_id,
    blogTitle: row.title,
    blogSlug: row.slug,
    blogIntro: row.introduction,
    blogSections: row.sections ? JSON.parse(row.sections) : [],
    blogConclusion: row.conclusion,
    blogMeta: row.meta_description,
    channel: row.channel,
    difficulty: row.difficulty,
    tags: row.tags ? JSON.parse(row.tags) : [],
    diagram: row.diagram,
    quickReference: row.quick_reference ? JSON.parse(row.quick_reference) : [],
    glossary: row.glossary ? JSON.parse(row.glossary) : [],
    realWorldExample: row.real_world_example ? JSON.parse(row.real_world_example) : null,
    funFact: row.fun_fact,
    sources: row.sources ? JSON.parse(row.sources) : [],
    createdAt: row.created_at
  }));
}

// Save blog post to database
async function saveBlogPost(questionId, blogContent, question) {
  const now = new Date().toISOString();
  const diagram = blogContent.diagram || question.diagram;
  await writeClient.execute({
    sql: `INSERT INTO blog_posts 
          (question_id, title, slug, introduction, sections, conclusion, 
           meta_description, channel, difficulty, tags, diagram, quick_reference,
           glossary, real_world_example, fun_fact, sources, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      questionId,
      blogContent.title,
      generateSlug(blogContent.title),
      blogContent.introduction,
      JSON.stringify(blogContent.sections),
      blogContent.conclusion,
      blogContent.metaDescription,
      question.channel,
      question.difficulty,
      JSON.stringify(question.tags),
      diagram,
      JSON.stringify(blogContent.quickReference || []),
      JSON.stringify(blogContent.glossary || []),
      JSON.stringify(blogContent.realWorldExample || null),
      blogContent.funFact || null,
      JSON.stringify(blogContent.sources || []),
      now
    ]
  });
}

// Get blog stats
async function getBlogStats() {
  const total = await client.execute('SELECT COUNT(*) as count FROM blog_posts');
  const byChannel = await client.execute(`
    SELECT channel, COUNT(*) as count FROM blog_posts GROUP BY channel ORDER BY count DESC
  `);
  return { total: total.rows[0]?.count || 0, byChannel: byChannel.rows };
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

function generateSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 80);
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function markdownToHtml(md, glossary = []) {
  if (!md) return '';
  let html = md;
  
  // Code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Headers
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  
  // Bold and italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Callout boxes
  html = html.replace(/^>\s*(💡|⚠️|✅|🔥|🎯|❌|ℹ️)\s*([^:]+):\s*(.*)$/gm, 
    '<div class="callout callout-$2"><span class="callout-icon">$1</span><div><strong>$2</strong><p>$3</p></div></div>');
  html = html.replace(/^>\s*(.*)$/gm, '<blockquote>$1</blockquote>');
  
  // Tables
  html = html.replace(/\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g, (match, header, body) => {
    const headers = header.split('|').filter(h => h.trim()).map(h => '<th>' + h.trim() + '</th>').join('');
    const rows = body.trim().split('\n').map(row => {
      const cells = row.split('|').filter(c => c.trim()).map(c => '<td>' + c.trim() + '</td>').join('');
      return '<tr>' + cells + '</tr>';
    }).join('');
    return '<table><thead><tr>' + headers + '</tr></thead><tbody>' + rows + '</tbody></table>';
  });
  
  // Lists
  html = html.replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => '<ul>' + match + '</ul>');
  
  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  
  // Add glossary tooltips
  for (const item of glossary) {
    const regex = new RegExp(`\\b(${item.term})\\b`, 'gi');
    html = html.replace(regex, `<span class="glossary-term" data-tooltip="${escapeHtml(item.definition)}">$1</span>`);
  }
  
  return html;
}


// Transform Q&A to blog using AI
async function transformToBlogArticle(question) {
  console.log('🤖 Transforming with AI...');
  
  try {
    const result = await ai.run('blog', {
      question: question.question,
      answer: question.answer,
      explanation: question.explanation,
      channel: question.channel,
      difficulty: question.difficulty,
      tags: question.tags
    });
    console.log('✅ AI transformation complete');
    return result;
  } catch (error) {
    console.log(`⚠️ AI failed: ${error.message}, using fallback`);
    const cleanQuestion = question.question.replace(/\?$/, '');
    return {
      title: `The ${cleanQuestion.substring(0, 50)} Guide You Actually Need`,
      introduction: `Let's be real - ${cleanQuestion.toLowerCase()} is one of those topics that sounds simple until you're debugging it at 2am. Here's what you actually need to know.`,
      sections: [
        { heading: 'The TL;DR', content: question.answer || '' },
        { heading: 'The Deep Dive', content: question.explanation || '' }
      ],
      realWorldExample: { company: 'Netflix', scenario: 'Uses similar patterns at scale', lesson: 'Start simple, optimize when needed' },
      glossary: [],
      sources: [
        { title: 'Official Documentation', url: 'https://developer.mozilla.org', type: 'documentation' }
      ],
      quickReference: ['Key concept to remember', 'Common gotcha to avoid', 'Best practice to follow'],
      funFact: 'This concept has been around since the early days of computing!',
      conclusion: `Now you know the essentials. Go build something cool with it!`,
      metaDescription: (question.answer || '').substring(0, 155)
    };
  }
}

// CSS Generation with theme support
function generateCSS(theme = themes[DEFAULT_THEME]) {
  return `
:root {
  --bg: ${theme.bg}; --bg-secondary: ${theme.bgSecondary}; --bg-card: ${theme.bgCard};
  --text: ${theme.text}; --text-secondary: ${theme.textSecondary};
  --accent: ${theme.accent}; --accent-hover: ${theme.accentHover};
  --border: ${theme.border}; --gradient: ${theme.gradient};
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Merriweather', Georgia, 'Times New Roman', serif; background: var(--bg); color: var(--text); line-height: 1.8; font-size: 17px; }
h1, h2, h3, h4, h5, h6, .logo, .hero-stat-value, .featured-title, .section-title, nav, .tag, .difficulty, .cta-button, .newsletter-btn, .hero-cta, .category-pill, .footer-brand { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }

/* Header */
header { background: rgba(10,10,10,0.9); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); padding: 1rem 0; position: fixed; top: 0; left: 0; right: 0; z-index: 100; }
.header-content { display: flex; align-items: center; justify-content: space-between; }
.logo { font-size: 1.5rem; font-weight: 800; background: var(--gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-decoration: none; }
nav { display: flex; gap: 2rem; align-items: center; }
nav a { color: var(--text-secondary); text-decoration: none; font-size: 0.9rem; font-weight: 500; transition: color 0.2s; }
nav a:hover { color: var(--accent); }

/* Hero - Redesigned */
.hero { padding: 10rem 0 5rem; text-align: center; position: relative; overflow: hidden; }
.hero::before { content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 800px; height: 800px; background: radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%); pointer-events: none; }
.hero-badge { display: inline-flex; align-items: center; gap: 0.5rem; background: var(--bg-card); border: 1px solid var(--border); padding: 0.5rem 1rem; border-radius: 2rem; font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1.5rem; }
.hero-badge .pulse { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } }
.hero h1 { font-size: 4rem; font-weight: 800; margin-bottom: 1.5rem; background: var(--gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1.1; }
.hero p { color: var(--text-secondary); max-width: 550px; margin: 0 auto 2rem; font-size: 1.2rem; line-height: 1.6; }
.hero-cta { display: inline-flex; align-items: center; gap: 0.5rem; background: var(--accent); color: #000; padding: 1rem 2rem; border-radius: 0.75rem; text-decoration: none; font-weight: 600; font-size: 1rem; transition: all 0.2s; }
.hero-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 40px rgba(34,197,94,0.3); }
.hero-stats { display: flex; justify-content: center; gap: 4rem; margin-top: 4rem; }
.hero-stat { text-align: center; }
.hero-stat-value { font-size: 2.5rem; font-weight: 700; background: var(--gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.hero-stat-label { font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.25rem; }

/* Featured Article */
.featured { padding: 2rem 0 4rem; }
.featured-card { background: linear-gradient(135deg, var(--bg-card), var(--bg-secondary)); border: 1px solid var(--border); border-radius: 1.5rem; padding: 3rem; display: grid; grid-template-columns: 1fr auto; gap: 3rem; align-items: center; position: relative; overflow: hidden; }
.featured-card::before { content: ''; position: absolute; top: -50%; right: -20%; width: 400px; height: 400px; background: radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%); }
.featured-label { display: inline-flex; align-items: center; gap: 0.5rem; background: var(--accent); color: #000; padding: 0.375rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; font-weight: 600; margin-bottom: 1rem; }
.featured-title { font-size: 1.75rem; font-weight: 700; line-height: 1.3; margin-bottom: 1rem; }
.featured-title a { color: var(--text); text-decoration: none; }
.featured-title a:hover { color: var(--accent); }
.featured-excerpt { color: var(--text-secondary); font-size: 1rem; line-height: 1.7; margin-bottom: 1.5rem; }
.featured-meta { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.featured-visual { font-size: 6rem; opacity: 0.9; }

/* Category Pills */
.category-pills { display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center; }
.category-pill { display: flex; align-items: center; gap: 0.5rem; background: var(--bg-card); border: 1px solid var(--border); padding: 0.625rem 1rem; border-radius: 2rem; text-decoration: none; color: var(--text); font-size: 0.875rem; font-weight: 500; transition: all 0.2s; }
.category-pill:hover { border-color: var(--accent); background: var(--bg-secondary); }
.category-pill .count { background: var(--bg-secondary); padding: 0.125rem 0.5rem; border-radius: 1rem; font-size: 0.7rem; color: var(--text-secondary); }

/* Section Headers */
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.section-title { font-size: 1.5rem; font-weight: 700; }
.section-link { color: var(--accent); text-decoration: none; font-size: 0.9rem; font-weight: 500; }
.section-link:hover { text-decoration: underline; }

/* Article Grid */
.articles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }

/* Newsletter CTA */
.newsletter { padding: 4rem 0; }
.newsletter-card { background: var(--gradient); border-radius: 1.5rem; padding: 4rem 2rem; text-align: center; position: relative; overflow: hidden; }
.newsletter-card h2 { font-size: 2rem; font-weight: 700; color: #000; margin-bottom: 0.75rem; }
.newsletter-card p { color: rgba(0,0,0,0.7); font-size: 1.1rem; margin-bottom: 1.5rem; }
.newsletter-btn { display: inline-flex; align-items: center; gap: 0.5rem; background: #000; color: #fff; padding: 1rem 2rem; border-radius: 0.75rem; text-decoration: none; font-weight: 600; transition: transform 0.2s; }
.newsletter-btn:hover { transform: scale(1.05); }

/* Article cards */
.article-list { padding: 4rem 0; }
.article-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 1rem; padding: 1.5rem; transition: all 0.3s; display: flex; flex-direction: column; }
.article-card:hover { border-color: var(--accent); transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
.article-card h2 { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.75rem; line-height: 1.4; flex-grow: 1; }
.article-card h2 a { color: var(--text); text-decoration: none; }
.article-card h2 a:hover { color: var(--accent); }
.article-meta { display: flex; flex-wrap: wrap; gap: 0.5rem; font-size: 0.75rem; margin-bottom: 0.75rem; }
.tag { background: var(--bg-secondary); color: var(--text-secondary); padding: 0.3rem 0.75rem; border-radius: 0.375rem; font-weight: 500; }
.difficulty { padding: 0.3rem 0.75rem; border-radius: 0.375rem; font-weight: 600; }
.difficulty.beginner { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
.difficulty.intermediate { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
.difficulty.advanced { background: rgba(248, 113, 113, 0.15); color: #f87171; }
.excerpt { color: var(--text-secondary); font-size: 0.875rem; line-height: 1.6; }

/* Category Grid */
.category-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
.category-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 1rem; padding: 1.5rem; transition: all 0.3s; }
.category-card:hover { border-color: var(--accent); transform: translateY(-4px); }
.category-card h3 { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; }
.category-card p { color: var(--text-secondary); font-size: 0.875rem; }
.category-card a { color: var(--accent); text-decoration: none; font-size: 0.875rem; font-weight: 500; display: inline-block; margin-top: 1rem; }
.category-card a:hover { text-decoration: underline; }
.article { padding: 8rem 0 4rem; max-width: 720px; margin: 0 auto; }
.article-header { margin-bottom: 3rem; text-align: center; }
.article-header h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 1.5rem; line-height: 1.3; }
.article-intro { font-size: 1.2rem; color: var(--text-secondary); line-height: 1.9; margin-bottom: 3rem; padding-bottom: 2.5rem; border-bottom: 1px solid var(--border); font-style: italic; text-align: center; }

/* Article content - Book-like */
.article-content { font-size: 1.1rem; line-height: 2; }
.article-content h2 { font-size: 1.5rem; font-weight: 700; margin: 3rem 0 1.5rem; padding-bottom: 0.75rem; border-bottom: 2px solid var(--border); }
.article-content h3 { font-size: 1.25rem; font-weight: 600; margin: 2.5rem 0 1rem; color: var(--accent); }
.article-content p { margin-bottom: 1.75rem; }
.article-content pre { background: linear-gradient(145deg, #1e1e2e, #181825); border: 1px solid rgba(255,255,255,0.08); border-radius: 1rem; padding: 1.5rem; overflow-x: auto; margin: 2rem 0; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
.article-content code { font-family: 'JetBrains Mono', monospace; font-size: 0.875rem; line-height: 1.7; }
.article-content p code, .article-content li code { background: rgba(34,197,94,0.1); padding: 0.2rem 0.5rem; border-radius: 0.375rem; font-size: 0.9em; color: var(--accent); }
.article-content ul, .article-content ol { margin: 2rem 0; padding: 0; list-style: none; background: var(--bg-card); border: 1px solid var(--border); border-radius: 1rem; padding: 1.75rem; }
.article-content li { margin-bottom: 1rem; padding-left: 2rem; position: relative; line-height: 1.8; }
.article-content li:last-child { margin-bottom: 0; }
.article-content ul > li::before { content: ''; position: absolute; left: 0; top: 0.65rem; width: 8px; height: 8px; background: var(--accent); border-radius: 50%; }
.article-content ol { counter-reset: item; }
.article-content ol > li::before { content: counter(item); counter-increment: item; position: absolute; left: 0; background: var(--accent); color: #000; width: 1.5rem; height: 1.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; font-family: 'Inter', sans-serif; }
.article-content li ul, .article-content li ol { background: transparent; border: none; padding: 1rem 0 0; margin: 0.75rem 0 0; }
.article-content .mermaid { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 1rem; padding: 2rem; margin: 2.5rem 0; }
.article-content table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 2.5rem 0; background: var(--bg-card); border-radius: 1rem; overflow: hidden; border: 1px solid var(--border); }
.article-content th { background: var(--bg-secondary); padding: 1rem 1.25rem; text-align: left; font-weight: 600; font-family: 'Inter', sans-serif; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent); }
.article-content td { padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); }
.article-content tr:last-child td { border-bottom: none; }
.article-content blockquote { padding: 2rem; margin: 2.5rem 0; background: var(--bg-card); border-radius: 1rem; border-left: 4px solid var(--accent); font-style: italic; color: var(--text-secondary); }

/* Callouts */
.callout { background: var(--bg-card); border: 1px solid var(--border); border-radius: 1rem; padding: 1.5rem; margin: 2rem 0; display: flex; gap: 1.25rem; align-items: flex-start; border-left: 4px solid var(--accent); }
.callout-icon { font-size: 1.75rem; line-height: 1; }
.callout strong { font-family: 'Inter', sans-serif; display: block; margin-bottom: 0.5rem; }
.callout p { margin: 0; color: var(--text-secondary); line-height: 1.7; }

/* Glossary tooltips */
.glossary-term { border-bottom: 1px dashed var(--accent); cursor: help; position: relative; }
.glossary-term:hover::after { content: attr(data-tooltip); position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); background: var(--bg-card); border: 1px solid var(--border); padding: 0.75rem 1rem; border-radius: 0.75rem; font-size: 0.875rem; max-width: 320px; white-space: normal; z-index: 10; box-shadow: 0 8px 32px rgba(0,0,0,0.4); margin-bottom: 0.5rem; font-family: 'Inter', sans-serif; }

/* Special sections */
.real-world-example { background: linear-gradient(135deg, var(--bg-card), var(--bg-secondary)); border: 1px solid var(--border); border-radius: 1rem; padding: 2rem; margin: 2.5rem 0; }
.real-world-example h3 { color: var(--accent); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem; font-family: 'Inter', sans-serif; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; }
.real-world-example .company { font-size: 1.5rem; font-weight: 700; font-family: 'Inter', sans-serif; }
.real-world-example .scenario { color: var(--text-secondary); margin: 1rem 0; line-height: 1.8; }
.real-world-example .lesson { background: var(--bg); padding: 1rem 1.25rem; border-radius: 0.75rem; margin-top: 1.25rem; border-left: 4px solid var(--accent); }

.fun-fact { background: linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02)); border: 1px solid rgba(34,197,94,0.2); border-radius: 1rem; padding: 1.5rem; margin: 2.5rem 0; display: flex; gap: 1.25rem; align-items: center; }
.fun-fact-icon { font-size: 2.5rem; }
.fun-fact p { margin: 0; color: var(--text-secondary); line-height: 1.7; }

.quick-ref { background: linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.03)); border: 1px solid rgba(34,197,94,0.25); border-radius: 1rem; padding: 2rem; margin: 2.5rem 0; }
.quick-ref h3 { color: var(--accent); margin-bottom: 1.25rem; font-family: 'Inter', sans-serif; }
.quick-ref ul { margin: 0; padding: 0; list-style: none; background: transparent; border: none; }
.quick-ref li { margin-bottom: 0.75rem; padding-left: 1.75rem; position: relative; color: var(--text-secondary); }
.quick-ref li::before { content: '✓'; position: absolute; left: 0; color: var(--accent); font-weight: 700; }
.quick-ref li:last-child { margin-bottom: 0; }

/* Sources */
.sources { background: var(--bg-card); border: 1px solid var(--border); border-radius: 1rem; padding: 1.5rem; margin: 2rem 0; }
.sources h3 { margin-bottom: 1rem; font-size: 1rem; color: var(--text); }
.sources ul { list-style: none; margin: 0; padding: 0; }
.sources li { margin-bottom: 0.75rem; padding-left: 1.5rem; position: relative; }
.sources li::before { content: '📄'; position: absolute; left: 0; }
.sources li[data-type="documentation"]::before { content: '📚'; }
.sources li[data-type="blog"]::before { content: '📝'; }
.sources li[data-type="paper"]::before { content: '🎓'; }
.sources li[data-type="video"]::before { content: '🎬'; }
.sources a { color: var(--accent); text-decoration: none; }
.sources a:hover { text-decoration: underline; }
.sources .source-type { font-size: 0.75rem; color: var(--text-secondary); margin-left: 0.5rem; }

/* CTA */
.cta-box { margin-top: 3rem; padding: 2rem; background: var(--gradient); border-radius: 1rem; text-align: center; }
.cta-box p { margin-bottom: 1rem; font-size: 1.25rem; font-weight: 600; }
.cta-button { display: inline-block; background: var(--bg); color: var(--text); padding: 0.875rem 2rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; transition: transform 0.2s; }
.cta-button:hover { transform: scale(1.05); }

/* Footer */
footer { background: var(--bg-secondary); border-top: 1px solid var(--border); padding: 3rem 0; margin-top: 4rem; }
.footer-content { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.footer-brand { font-size: 1.25rem; font-weight: 700; background: var(--gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.footer-links { display: flex; gap: 2rem; }
.footer-links a { color: var(--text-secondary); text-decoration: none; font-size: 0.9rem; }
.footer-links a:hover { color: var(--accent); }
.footer-copy { text-align: center; color: var(--text-secondary); font-size: 0.875rem; }
.footer-copy a { color: var(--accent); text-decoration: none; }

/* Responsive */
@media (max-width: 768px) { 
  .hero { padding: 8rem 0 4rem; }
  .hero h1 { font-size: 2.25rem; } 
  .hero-stats { gap: 2rem; flex-wrap: wrap; }
  .hero-stat-value { font-size: 2rem; }
  .featured-card { grid-template-columns: 1fr; padding: 2rem; }
  .featured-visual { display: none; }
  .featured-title { font-size: 1.4rem; }
  .article-header h1 { font-size: 1.75rem; } 
  nav { gap: 1rem; font-size: 0.8rem; } 
  .category-grid, .articles-grid { grid-template-columns: 1fr; }
  .glossary-term:hover::after { left: 0; transform: none; }
  .footer-content { flex-direction: column; gap: 1.5rem; text-align: center; }
  .category-pills { gap: 0.5rem; }
  .category-pill { font-size: 0.8rem; padding: 0.5rem 0.75rem; }
}

/* Theme switcher styles */
.theme-options { display: none; position: absolute; top: 100%; right: 0; background: var(--bg-card); border: 1px solid var(--border); border-radius: 0.5rem; padding: 0.5rem; margin-top: 0.5rem; }
.theme-options.show { display: block; }
.theme-option { display: block; padding: 0.5rem 1rem; color: var(--text); text-decoration: none; border-radius: 0.25rem; }
.theme-option:hover { background: var(--bg-secondary); }
`;
}


// HTML Generation
function generateHead(title, description, includeMermaid = false) {
  const mermaidScript = includeMermaid ? `
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>mermaid.initialize({startOnLoad:true,theme:'dark',themeVariables:{primaryColor:'var(--accent)',primaryTextColor:'var(--text)',primaryBorderColor:'var(--border)',lineColor:'var(--accent)',secondaryColor:'var(--bg-secondary)',tertiaryColor:'var(--bg-card)'}});</script>` : '';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | Tech Interview Blog</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono&family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">${mermaidScript}
  <link rel="stylesheet" href="/style.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚀</text></svg>">
</head>
<body>`;
}

function generateHeader() {
  return `<header><div class="container header-content">
    <a href="/" class="logo">🚀 DevInsights</a>
    <nav>
      <a href="/">Home</a>
      <a href="/categories/">Topics</a>
      <a href="https://reel-interview.github.io" target="_blank">Practice →</a>
    </nav>
  </div></header>`;
}

function generateFooter() {
  return `<footer><div class="container">
    <div class="footer-content">
      <div class="footer-brand">🚀 DevInsights</div>
      <div class="footer-links">
        <a href="/">Home</a>
        <a href="/categories/">Topics</a>
        <a href="https://reel-interview.github.io" target="_blank">Practice</a>
      </div>
    </div>
    <div class="footer-copy">
      <p>Built for devs who want to level up 🔥</p>
      <p style="margin-top:0.5rem">© ${new Date().getFullYear()} DevInsights • <a href="https://reel-interview.github.io">Reel Interview</a></p>
    </div>
  </div></footer></body></html>`;
}

function generateIndexPage(articles) {
  const recentArticles = articles.slice(0, 9);
  const featuredArticle = articles[0];
  
  // Category pills
  let categoryPills = '';
  for (const [category, channels] of Object.entries(categoryMap)) {
    const count = articles.filter(a => channels.includes(a.channel)).length;
    if (count === 0) continue;
    const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const emoji = getCategoryEmoji(category);
    categoryPills += `<a href="/categories/${slug}/" class="category-pill">${emoji} ${category}<span class="count">${count}</span></a>`;
  }
  
  // Stats
  const totalArticles = articles.length;
  const totalCategories = Object.keys(categoryMap).filter(cat => 
    articles.some(a => categoryMap[cat].includes(a.channel))
  ).length;
  
  // Article cards (skip first if featured)
  let articleCards = recentArticles.slice(1).map(a => `
    <div class="article-card">
      <div class="article-meta">
        <span class="tag">${formatChannelName(a.channel)}</span>
        <span class="difficulty ${a.difficulty}">${a.difficulty}</span>
      </div>
      <h2><a href="/posts/${a.id}/${a.blogSlug}/">${escapeHtml(a.blogTitle)}</a></h2>
      <p class="excerpt">${escapeHtml((a.blogIntro || '').substring(0, 120))}...</p>
    </div>`).join('');
  
  // Featured article
  let featuredHtml = '';
  if (featuredArticle) {
    const emoji = getCategoryEmoji(getCategoryForChannel(featuredArticle.channel));
    featuredHtml = `
    <section class="featured"><div class="container">
      <div class="featured-card">
        <div class="featured-content">
          <span class="featured-label">✨ Latest Article</span>
          <h2 class="featured-title"><a href="/posts/${featuredArticle.id}/${featuredArticle.blogSlug}/">${escapeHtml(featuredArticle.blogTitle)}</a></h2>
          <p class="featured-excerpt">${escapeHtml((featuredArticle.blogIntro || '').substring(0, 200))}...</p>
          <div class="featured-meta">
            <span class="tag">${formatChannelName(featuredArticle.channel)}</span>
            <span class="difficulty ${featuredArticle.difficulty}">${featuredArticle.difficulty}</span>
          </div>
        </div>
        <div class="featured-visual">${emoji}</div>
      </div>
    </div></section>`;
  }
  
  return `${generateHead('DevInsights - Level Up Your Tech Skills', 'Real-world tech insights for developers who ship')}
${generateHeader()}
<main>
  <section class="hero"><div class="container">
    <div class="hero-badge"><span class="pulse"></span> ${totalArticles} articles and counting</div>
    <h1>Tech Insights That<br>Actually Matter</h1>
    <p>No fluff. No BS. Just practical knowledge for developers who want to level up their system design, algorithms, and engineering skills.</p>
    <a href="/categories/" class="hero-cta">Browse All Topics →</a>
    <div class="hero-stats">
      <div class="hero-stat"><div class="hero-stat-value">${totalArticles}</div><div class="hero-stat-label">Articles</div></div>
      <div class="hero-stat"><div class="hero-stat-value">${totalCategories}</div><div class="hero-stat-label">Topics</div></div>
      <div class="hero-stat"><div class="hero-stat-value">3+</div><div class="hero-stat-label">Years Exp Target</div></div>
    </div>
  </div></section>
  
  ${featuredHtml}
  
  <section style="padding:2rem 0"><div class="container">
    <div class="category-pills">${categoryPills}</div>
  </div></section>
  
  <section class="article-list"><div class="container">
    <div class="section-header">
      <h2 class="section-title">🔥 Recent Articles</h2>
      <a href="/categories/" class="section-link">View all →</a>
    </div>
    <div class="articles-grid">${articleCards}</div>
  </div></section>
  
  <section class="newsletter"><div class="container">
    <div class="newsletter-card">
      <h2>Ready to ace your next interview?</h2>
      <p>Practice with real interview questions from top tech companies</p>
      <a href="https://reel-interview.github.io" target="_blank" class="newsletter-btn">Start Practicing →</a>
    </div>
  </div></section>
</main>
${generateFooter()}`;
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

function generateCategoryPage(category, articles) {
  const channels = categoryMap[category] || [];
  const categoryArticles = articles.filter(a => channels.includes(a.channel));
  const emoji = getCategoryEmoji(category);
  
  let articleCards = categoryArticles.map(a => `
    <div class="article-card">
      <div class="article-meta"><span class="tag">${formatChannelName(a.channel)}</span><span class="difficulty ${a.difficulty}">${a.difficulty}</span></div>
      <h2><a href="/posts/${a.id}/${a.blogSlug}/">${escapeHtml(a.blogTitle)}</a></h2>
      <p class="excerpt">${escapeHtml((a.blogIntro || '').substring(0, 150))}...</p>
    </div>`).join('');
  
  return `${generateHead(category, `${categoryArticles.length} articles about ${category}`)}
${generateHeader()}
<main><section class="article-list" style="padding-top:3rem"><div class="container">
  <a href="/" style="color:var(--text-secondary);text-decoration:none;font-size:0.875rem">← Back to all topics</a>
  <h1 style="margin:1rem 0 0.5rem;font-size:2.5rem">${emoji} ${category}</h1>
  <p style="color:var(--text-secondary);margin-bottom:2rem">${categoryArticles.length} articles to level up your skills</p>
  ${articleCards}
</div></section></main>
${generateFooter()}`;
}


function generateArticlePage(article) {
  const category = getCategoryForChannel(article.channel);
  const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const hasDiagram = !!article.diagram;
  const glossary = article.glossary || [];
  
  let sectionsHtml = (article.blogSections || []).map(s => 
    `<h2>${escapeHtml(s.heading)}</h2>${markdownToHtml(s.content, glossary)}`
  ).join('');
  
  // Real-world example section
  if (article.realWorldExample) {
    const ex = article.realWorldExample;
    sectionsHtml += `
    <div class="real-world-example">
      <h3>🏢 Real-World Example</h3>
      <div class="company">${escapeHtml(ex.company)}</div>
      <p class="scenario">${escapeHtml(ex.scenario)}</p>
      <div class="lesson">💡 <strong>Key Lesson:</strong> ${escapeHtml(ex.lesson)}</div>
    </div>`;
  }
  
  // Diagram section
  if (article.diagram) {
    sectionsHtml += `<h2>📊 Visual Overview</h2><div class="mermaid">${article.diagram}</div>`;
  }
  
  // Fun fact
  if (article.funFact) {
    sectionsHtml += `<div class="fun-fact"><span class="fun-fact-icon">🤓</span><p><strong>Fun Fact:</strong> ${escapeHtml(article.funFact)}</p></div>`;
  }
  
  // Quick reference
  const quickRef = article.quickReference || [];
  if (quickRef.length > 0) {
    sectionsHtml += `<div class="quick-ref"><h3>📌 TL;DR - Quick Reference</h3><ul>${quickRef.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul></div>`;
  }
  
  // Sources
  const sources = article.sources || [];
  if (sources.length > 0) {
    const sourceItems = sources.map(s => 
      `<li data-type="${s.type || 'blog'}"><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.title)}</a><span class="source-type">${s.type || 'article'}</span></li>`
    ).join('');
    sectionsHtml += `<div class="sources"><h3>📖 Sources & Further Reading</h3><ul>${sourceItems}</ul></div>`;
  }
  
  const tags = (article.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join(' ');
  
  return `${generateHead(article.blogTitle, article.blogMeta || '', hasDiagram)}
${generateHeader()}
<main><article class="article"><div class="container">
  <a href="/categories/${categorySlug}/" style="color:var(--text-secondary);text-decoration:none;font-size:0.875rem">← ${category}</a>
  <div class="article-header">
    <h1>${escapeHtml(article.blogTitle)}</h1>
    <div class="article-meta"><span class="tag">${formatChannelName(article.channel)}</span><span class="difficulty ${article.difficulty}">${article.difficulty}</span>${tags}</div>
  </div>
  <p class="article-intro">${escapeHtml(article.blogIntro)}</p>
  <div class="article-content">
    ${sectionsHtml}
    <h2>🎬 Wrapping Up</h2>
    <p>${escapeHtml(article.blogConclusion)}</p>
  </div>
  <div class="cta-box">
    <p>Ready to put this into practice?</p>
    <a href="https://reel-interview.github.io/channel/${article.channel}" class="cta-button">Practice Interview Questions →</a>
  </div>
</div></article></main>
${generateFooter()}`;
}

function generateCategoriesIndexPage(articles) {
  let cards = Object.entries(categoryMap).map(([category, channels]) => {
    const count = articles.filter(a => channels.includes(a.channel)).length;
    if (count === 0) return '';
    const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const emoji = getCategoryEmoji(category);
    return `<div class="category-card"><h3>${emoji} ${category}</h3><p>${count} articles</p><a href="/categories/${slug}/">Explore →</a></div>`;
  }).join('');
  
  return `${generateHead('All Topics', 'Browse all tech topics')}
${generateHeader()}
<main><section class="categories" style="padding-top:3rem"><div class="container">
  <h1 style="margin-bottom:2rem">🎯 All Topics</h1>
  <div class="category-grid">${cards}</div>
</div></section></main>
${generateFooter()}`;
}

// Main function
async function main() {
  console.log('=== 🚀 Blog Generator ===\n');
  
  await initBlogPostsTable();
  
  const stats = await getBlogStats();
  console.log(`📊 Current blog posts: ${stats.total}`);
  if (stats.byChannel.length > 0) {
    console.log('   By channel:');
    stats.byChannel.slice(0, 5).forEach(c => console.log(`     ${c.channel}: ${c.count}`));
    if (stats.byChannel.length > 5) console.log(`     ... and ${stats.byChannel.length - 5} more`);
  }
  
  console.log('\n🔍 Finding next question to convert...');
  const question = await getNextQuestionForBlog();
  
  if (!question) {
    console.log('✅ All questions have been converted!');
  } else {
    console.log(`   Found: ${question.id} (${question.channel})`);
    console.log(`   Q: ${question.question.substring(0, 60)}...`);
    
    const blogContent = await transformToBlogArticle(question);
    console.log(`   Title: ${blogContent.title}`);
    
    console.log('💾 Saving to database...');
    await saveBlogPost(question.id, blogContent, question);
    console.log('✅ Blog post saved!\n');
  }
  
  console.log('📄 Regenerating static site...');
  
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  const articles = await getAllBlogPosts();
  console.log(`   Total articles: ${articles.length}`);
  
  if (articles.length === 0) {
    console.log('   No articles yet, skipping site generation');
    return;
  }
  
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
    fs.writeFileSync(path.join(dir, 'index.html'), generateCategoryPage(category, articles));
  }
  
  // Generate article pages
  const postsDir = path.join(OUTPUT_DIR, 'posts');
  fs.mkdirSync(postsDir, { recursive: true });
  
  for (const article of articles) {
    const dir = path.join(postsDir, article.id, article.blogSlug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), generateArticlePage(article));
  }
  
  fs.writeFileSync(path.join(OUTPUT_DIR, '.nojekyll'), '');
  
  const newStats = await getBlogStats();
  console.log(`\n✅ Blog generated!`);
  console.log(`   Total posts: ${newStats.total}`);
  console.log(`   Output: ${OUTPUT_DIR}/`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
