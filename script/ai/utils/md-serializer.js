/**
 * MD Serializer — converts a blog_posts DB row into a standalone .md file.
 * Pure functions, no API calls, no side effects.
 */

const AUTHOR = {
  name: 'Satishkumar Dhule',
  github: 'https://github.com/satishkumar-dhule',
  linkedin: 'https://linkedin.com/in/satishkumar-dhule',
  website: 'https://satishkumar-dhule.github.io',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function yamlEscape(str) {
  if (!str) return '""';
  const s = String(str);
  if (/[:#\[\]{}&*!|>'"%@`,]/.test(s) || s.includes('\n') || s.startsWith(' ') || s.endsWith(' ')) {
    return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  }
  return s;
}

function stripHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '_$1_')
    .replace(/<code>(.*?)<\/code>/gi, '`$1`')
    .replace(/<br\s*\/?>/gi, '\n')
    // Strip entire script blocks including content
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    // Strip share/social snippet blocks injected by old pipeline
    .replace(/Share This[\s\S]*?#\w+(\s+#\w+)*/g, '')
    .replace(/function copySnippet[\s\S]*?\}\s*/g, '')
    .replace(/https?:\/\/openstackdaily\.github\.io\/posts\/[^\s]*/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function parseJson(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

// ── Section code-block extraction ────────────────────────────────────────────

function extractCodeBlocks(content) {
  const codeBlocks = [];
  // Match fenced code blocks: ```lang\n...\n```
  const fenced = /```(\w*)\n([\s\S]*?)```/g;
  let cleanContent = content.replace(fenced, (_, lang, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push({ lang: lang || 'text', code: code.trimEnd() });
    return `\n\`\`\`PLACEHOLDER_${idx}\`\`\`\n`;
  });
  return { cleanContent, codeBlocks };
}

// ── Builder functions ─────────────────────────────────────────────────────────

function buildFrontmatter(post, question) {
  const sources = parseJson(post.sources, []);
  const tags = parseJson(post.tags, []);
  const date = post.createdAt ? String(post.createdAt).slice(0, 10) : new Date().toISOString().slice(0, 10);

  const lines = ['---'];
  lines.push(`id: ${yamlEscape(post.id || post.question_id || '')}`);
  lines.push(`title: ${yamlEscape(post.blogTitle || post.title || '')}`);
  lines.push(`slug: ${post.blogSlug || post.slug || ''}`);
  lines.push(`date: "${date}"`);
  lines.push(`author: "${AUTHOR.name}"`);
  lines.push(`channel: ${post.channel || ''}`);
  lines.push(`category: ${yamlEscape(post.category || '')}`);
  lines.push(`difficulty: ${post.difficulty || ''}`);
  lines.push(`tags: [${tags.map(t => JSON.stringify(t)).join(', ')}]`);
  lines.push(`description: ${yamlEscape(post.blogMeta || post.meta_description || '')}`);
  if (question && question.question) {
    lines.push(`question: ${yamlEscape(question.question)}`);
  }
  if (sources.length) {
    lines.push('sources:');
    sources.forEach(s => {
      lines.push(`  - title: ${yamlEscape(s.title)}`);
      lines.push(`    url: "${s.url}"`);
      lines.push(`    type: ${s.type || 'article'}`);
    });
  }
  lines.push('---');
  return lines.join('\n');
}

function buildBadgeTable(post) {
  const tags = parseJson(post.tags, []);
  return `| Difficulty | Channel | Tags |\n|---|---|---|\n| ${post.difficulty || ''} | ${post.channel || ''} | ${tags.join(', ')} |`;
}

function buildIntroduction(post) {
  const intro = post.blogIntro || post.introduction || '';
  return stripHtml(intro);
}

function buildInlineSVG(svgXml, caption) {
  if (!svgXml) return '';
  // Strip any <script> tags for safety
  const safe = svgXml.replace(/<script[\s\S]*?<\/script>/gi, '');
  return `<div align="center">\n\n${safe.trim()}\n\n*${caption || 'Illustration'}*\n\n</div>`;
}

function buildHeroSVG(post) {
  const svgContent = parseJson(post.svgContent || post.svg_content, {});
  const images = parseJson(post.images, []);
  const keys = Object.keys(svgContent);
  if (!keys.length) return '';
  const firstKey = keys[0];
  const img = images[0];
  const caption = img ? (img.caption || img.alt || 'Illustration') : 'Illustration';
  return buildInlineSVG(svgContent[firstKey], caption);
}

function buildRealWorldCase(post) {
  const rwe = parseJson(post.realWorldExample || post.real_world_example, null);
  if (!rwe || !rwe.company) return '';
  const rows = [
    rwe.challenge ? `| **Challenge** | ${stripHtml(rwe.challenge)} |` : null,
    rwe.solution  ? `| **Solution** | ${stripHtml(rwe.solution)} |`   : null,
    rwe.outcome   ? `| **Outcome** | ${stripHtml(rwe.outcome)} |`     : null,
    rwe.lesson    ? `| **Lesson** | ${stripHtml(rwe.lesson)} |`       : null,
  ].filter(Boolean);

  const scenario = rwe.scenario ? `\n> ${stripHtml(rwe.scenario)}\n>` : '';
  if (rows.length === 0) {
    return `> ### Real-World Case — ${rwe.company}\n>${scenario}`;
  }
  return `> ### Real-World Case — ${rwe.company}\n>${scenario}\n> | | |\n> |---|---|\n${rows.map(r => '> ' + r).join('\n')}`;
}

function buildSections(post) {
  const sections = parseJson(post.blogSections || post.sections, []);
  if (!sections.length) return '';

  const diagram = (post.diagram || '').trim();

  return sections.map(sec => {
    const heading = sec.title || sec.heading || '';
    const raw = (sec.content || '').trim();

    // Skip sections whose content IS the mermaid diagram
    const rawNorm = raw.replace(/\s+/g, ' ');
    const mermaidKeywords = ['flowchart ', 'graph ', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'gantt', 'pie '];
    if (diagram && mermaidKeywords.some(k => raw.startsWith(k))) {
      const diagNorm = diagram.replace(/\s+/g, ' ');
      // Match if first 40 chars align (handles HTML entity stripping differences)
      if (diagNorm.slice(0, 40) === rawNorm.slice(0, 40)) return null;
      // Also match if they share the same opening keyword + first node
      const rawHead = rawNorm.slice(0, 25);
      if (diagNorm.startsWith(rawHead)) return null;
    }

    const { cleanContent, codeBlocks } = extractCodeBlocks(raw);
    let body = stripHtml(cleanContent);
    codeBlocks.forEach((cb, i) => {
      body = body.replace(`\`\`\`PLACEHOLDER_${i}\`\`\``, `\`\`\`${cb.lang}\n${cb.code}\n\`\`\``);
    });
    if (!body.trim()) return null;
    return `## ${heading}\n\n${body.trim()}`;
  }).filter(Boolean).join('\n\n');
}

function buildMidSVG(post) {
  const svgContent = parseJson(post.svgContent || post.svg_content, {});
  const images = parseJson(post.images, []);
  const keys = Object.keys(svgContent);
  if (keys.length < 2) return '';
  const secondKey = keys[1];
  const img = images[1];
  const caption = img ? (img.caption || img.alt || 'Illustration') : 'Illustration';
  return buildInlineSVG(svgContent[secondKey], caption);
}

function buildFunFact(post) {
  const fact = post.funFact || post.fun_fact || '';
  if (!fact) return '';
  return `> **Did you know?**\n> ${stripHtml(fact)}`;
}

function buildKeyTakeaways(post) {
  const items = parseJson(post.quickReference || post.quick_reference, []);
  if (!items.length) return '';
  const bullets = items.map(item => `- ${stripHtml(typeof item === 'string' ? item : item.text || item.point || JSON.stringify(item))}`).join('\n');
  return `## Key Takeaways\n\n${bullets}`;
}

function buildGlossary(post) {
  const entries = parseJson(post.glossary, []);
  if (entries.length < 2) return '';
  const rows = entries.map(e => `| ${e.term || ''} | ${stripHtml(e.definition || '')} |`).join('\n');
  return `## Glossary\n\n| Term | Definition |\n|------|----------|\n${rows}`;
}

function buildMermaidDiagram(post) {
  const diagram = post.diagram || '';
  if (!diagram.trim()) return '';
  const label = post.diagramLabel || post.diagram_label || 'Architecture & Flow';
  return `## ${label}\n\n\`\`\`mermaid\n${diagram.trim()}\n\`\`\``;
}

function buildOriginalQA(post, question) {
  const q = question && question.question ? question.question : (post.question || '');
  const a = question && question.answer ? question.answer : (post.answer || '');
  if (!q) return '';
  return `<details>\n<summary><strong>Original Interview Question</strong></summary>\n\n**Q:** ${stripHtml(q)}\n\n**A:** ${stripHtml(a)}\n\n</details>`;
}

function buildConclusion(post) {
  const conclusion = post.blogConclusion || post.conclusion || '';
  if (!conclusion) return '';
  return `## Conclusion\n\n${stripHtml(conclusion)}`;
}

function buildReferences(post) {
  const sources = parseJson(post.sources, []);
  if (!sources.length) return '';
  const items = sources.map((s, i) => `${i + 1}. [${s.title}](${s.url}) — ${s.type || 'article'}`).join('\n');
  return `## References\n\n${items}`;
}

function buildSeeAlso(post) {
  const related = parseJson(post.relatedQuestions || post.related_questions, []);
  if (!related.length) return '';
  const items = related.map(r => `- [${r.title || r.question || ''}](/questions/${r.id || ''}) — ${r.channel || ''}`).join('\n');
  return `## See Also\n\n${items}`;
}

function buildAuthorFooter() {
  return `---\n\n**Author:** ${AUTHOR.name} — [GitHub](${AUTHOR.github}) · [LinkedIn](${AUTHOR.linkedin}) · [Website](${AUTHOR.website})`;
}

// ── Validation ────────────────────────────────────────────────────────────────

export function validateMD(mdString) {
  const errors = [];
  const warnings = [];

  // 1. Required frontmatter fields
  const fmMatch = mdString.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    errors.push('Missing YAML frontmatter');
  } else {
    const fm = fmMatch[1];
    for (const field of ['id', 'title', 'slug', 'date', 'channel', 'description']) {
      if (!new RegExp(`^${field}:`, 'm').test(fm)) {
        errors.push(`Missing required frontmatter field: ${field}`);
      }
    }
  }

  // 2. Body length
  const body = mdString.replace(/^---[\s\S]*?---\n/, '');
  if (body.length < 800) warnings.push(`Body too short: ${body.length} chars (min 800)`);

  // 3. SVG safety — only flag actual executable script blocks, not inline text examples
  const strippedForCheck = mdString
    .replace(/<svg[\s\S]*?<\/svg>/gi, '[SVG_BLOCK]')
    .replace(/`[^`]*<script[^`]*`/gi, '[CODE_EXAMPLE]')  // strip inline code examples
    .replace(/```[\s\S]*?```/g, '[CODE_BLOCK]');          // strip fenced code blocks
  if (/<script\s/i.test(strippedForCheck) || /javascript:\s*\w/i.test(strippedForCheck)) {
    errors.push('Contains unsafe executable script content');
  }

  // 4. Slug format
  const slugMatch = mdString.match(/^slug:\s*(.+)$/m);
  if (slugMatch) {
    const slug = slugMatch[1].trim();
    if (!/^[a-z0-9-]+$/.test(slug) || slug.length > 100) {
      errors.push(`Invalid slug format: ${slug}`);
    }
  }

  // 5. No broken /images/ refs
  if (/!\[.*?\]\(\/images\//.test(mdString)) {
    warnings.push('Contains /images/ path references — may break standalone rendering');
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Serialize a blog_posts DB row + question into a standalone .md string.
 * @param {object} post - blog_posts row (camelCase or snake_case keys)
 * @param {object} question - { question, answer } from questions table
 * @returns {string} complete standalone markdown
 */
export function serializeMD(post, question = {}) {
  const parts = [
    buildFrontmatter(post, question),
    '',
    buildBadgeTable(post),
    '',
    buildIntroduction(post),
    '',
    buildHeroSVG(post),
    '',
    '---',
    '',
    buildRealWorldCase(post),
    '',
    '---',
    '',
    buildSections(post),
    '',
    buildMidSVG(post),
    '',
    buildFunFact(post),
    '',
    '---',
    '',
    buildKeyTakeaways(post),
    '',
    buildGlossary(post),
    '',
    buildMermaidDiagram(post),
    '',
    buildOriginalQA(post, question),
    '',
    buildConclusion(post),
    '',
    '---',
    '',
    buildReferences(post),
    '',
    buildSeeAlso(post),
    '',
    buildAuthorFooter(),
  ].filter(part => part !== null && part !== undefined);

  // Collapse consecutive HRs (--- \n\n ---) that result from empty optional sections
  return parts.join('\n')
    .replace(/(\n---\n+){2,}/g, '\n\n---\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n';
}
