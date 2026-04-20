#!/usr/bin/env node
/**
 * Generate static HTML pages from question data for Pagefind indexing
 * This creates a temporary directory with HTML files that Pagefind can index
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'client/public/data');
const outputDir = path.join(rootDir, 'dist/public/_pagefind-source');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Load all questions
const allQuestionsPath = path.join(dataDir, 'all-questions.json');
if (!fs.existsSync(allQuestionsPath)) {
  console.log('⚠️  all-questions.json not found. Run build:static first.');
  process.exit(0);
}

const questions = JSON.parse(fs.readFileSync(allQuestionsPath, 'utf-8'));
console.log(`📚 Found ${questions.length} questions to index`);

// Load channels for metadata
const channelsPath = path.join(dataDir, 'channels.json');
const channels = fs.existsSync(channelsPath) 
  ? JSON.parse(fs.readFileSync(channelsPath, 'utf-8'))
  : [];

const channelMap = new Map(channels.map(c => [c.id, c]));

// Generate HTML for each question
let indexed = 0;
for (const q of questions) {
  const channel = channelMap.get(q.channel);
  const channelName = channel?.name || q.channel;
  
  // Create HTML content for indexing
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(q.question)}</title>
  <meta name="description" content="${escapeHtml(q.answer?.substring(0, 160) || '')}">
</head>
<body>
  <article data-pagefind-body>
    <h1 data-pagefind-meta="title">${escapeHtml(q.question)}</h1>
    
    <div data-pagefind-filter="channel">${escapeHtml(channelName)}</div>
    <div data-pagefind-filter="difficulty">${escapeHtml(q.difficulty || 'intermediate')}</div>
    ${q.subChannel ? `<div data-pagefind-filter="topic">${escapeHtml(formatSubChannel(q.subChannel))}</div>` : ''}
    
    <div data-pagefind-meta="channel" data-pagefind-meta-value="${escapeHtml(q.channel)}"></div>
    <div data-pagefind-meta="difficulty" data-pagefind-meta-value="${escapeHtml(q.difficulty || 'intermediate')}"></div>
    <div data-pagefind-meta="id" data-pagefind-meta-value="${escapeHtml(q.id)}"></div>
    
    <main>
      <section class="answer">
        ${escapeHtml(q.answer || '')}
      </section>
      
      ${q.tags?.length ? `
      <section class="tags">
        ${q.tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join(' ')}
      </section>
      ` : ''}
      
      ${q.companies?.length ? `
      <section class="companies" data-pagefind-filter="company">
        ${q.companies.map(c => `<span>${escapeHtml(c)}</span>`).join(' ')}
      </section>
      ` : ''}
    </main>
  </article>
</body>
</html>`;

  // Write HTML file
  const filename = `${q.id}.html`;
  fs.writeFileSync(path.join(outputDir, filename), html);
  indexed++;
}

console.log(`✅ Generated ${indexed} HTML files for questions`);

// Generate HTML for coding challenges
// Import coding challenges from the TypeScript file by reading and parsing it
const codingChallengesPath = path.join(rootDir, 'client/src/lib/coding-challenges.ts');
if (fs.existsSync(codingChallengesPath)) {
  const tsContent = fs.readFileSync(codingChallengesPath, 'utf-8');
  
  // Extract challenge templates from the TypeScript file
  const templateMatch = tsContent.match(/const challengeTemplates[^=]*=\s*\[([\s\S]*?)\n\];/);
  if (templateMatch) {
    // Parse individual challenge objects
    const challengeRegex = /\{\s*title:\s*['"]([^'"]+)['"]/g;
    const descRegex = /description:\s*['"]([^'"]+)['"]/g;
    const difficultyRegex = /difficulty:\s*['"]([^'"]+)['"]/g;
    const categoryRegex = /category:\s*['"]([^'"]+)['"]/g;
    const tagsRegex = /tags:\s*\[([^\]]+)\]/g;
    
    // Simple extraction of challenges
    const challenges = [];
    let match;
    const content = templateMatch[1];
    
    // Split by challenge objects (each starts with title:)
    const challengeBlocks = content.split(/\{\s*title:/);
    
    for (let i = 1; i < challengeBlocks.length; i++) {
      const block = '{title:' + challengeBlocks[i];
      
      const titleMatch = block.match(/title:\s*['"]([^'"]+)['"]/);
      const descMatch = block.match(/description:\s*['"]([^'"]+)['"]/);
      const diffMatch = block.match(/difficulty:\s*['"]([^'"]+)['"]/);
      const catMatch = block.match(/category:\s*['"]([^'"]+)['"]/);
      const tagsMatch = block.match(/tags:\s*\[([^\]]+)\]/);
      
      if (titleMatch && descMatch) {
        const tags = tagsMatch 
          ? tagsMatch[1].match(/['"]([^'"]+)['"]/g)?.map(t => t.replace(/['"]/g, '')) || []
          : [];
        
        challenges.push({
          id: `challenge-${i - 1}`,
          title: titleMatch[1],
          description: descMatch[1],
          difficulty: diffMatch ? diffMatch[1] : 'easy',
          category: catMatch ? catMatch[1] : 'general',
          tags
        });
      }
    }
    
    console.log(`🧩 Found ${challenges.length} coding challenges to index`);
    
    // Generate HTML for each coding challenge
    let codingIndexed = 0;
    for (const challenge of challenges) {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(challenge.title)}</title>
  <meta name="description" content="${escapeHtml(challenge.description.substring(0, 160))}">
</head>
<body>
  <article data-pagefind-body>
    <h1 data-pagefind-meta="title">${escapeHtml(challenge.title)}</h1>
    
    <div data-pagefind-filter="channel">Coding Challenge</div>
    <div data-pagefind-filter="difficulty">${escapeHtml(challenge.difficulty)}</div>
    <div data-pagefind-filter="topic">${escapeHtml(formatSubChannel(challenge.category))}</div>
    
    <div data-pagefind-meta="channel" data-pagefind-meta-value="coding"></div>
    <div data-pagefind-meta="difficulty" data-pagefind-meta-value="${escapeHtml(challenge.difficulty)}"></div>
    <div data-pagefind-meta="id" data-pagefind-meta-value="${escapeHtml(challenge.id)}"></div>
    <div data-pagefind-meta="type" data-pagefind-meta-value="coding"></div>
    
    <main>
      <section class="description">
        ${escapeHtml(challenge.description)}
      </section>
      
      ${challenge.tags?.length ? `
      <section class="tags">
        ${challenge.tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join(' ')}
      </section>
      ` : ''}
    </main>
  </article>
</body>
</html>`;

      const filename = `coding-${challenge.id}.html`;
      fs.writeFileSync(path.join(outputDir, filename), html);
      codingIndexed++;
    }
    
    console.log(`✅ Generated ${codingIndexed} HTML files for coding challenges`);
    indexed += codingIndexed;
  }
}

console.log(`📊 Total: ${indexed} files indexed for Pagefind`);

// Helper functions
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatSubChannel(subChannel) {
  return subChannel
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
