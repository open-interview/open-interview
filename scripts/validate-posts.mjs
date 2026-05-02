/**
 * Post-transformation validation & render simulation
 * Checks every post against the expected template structure.
 */
import fs from 'fs';

const DATA_FILE = './client/public/blog-data.json';
const MERMAID_TYPES = /^(graph\s+(?:TD|LR|RL|BT|TB)|flowchart(?:\s+(?:TD|LR|RL|BT|TB))?|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|gitGraph|erDiagram|gantt)/;

function validatePost(post) {
  const c = post.content;
  const lines = c.split('\n');
  const issues = [];

  // Noise checks
  if (/Share This/.test(c))               issues.push({ level: 'ERROR', msg: 'Share This blob remaining' });
  if (/Did you know\?/.test(c))           issues.push({ level: 'ERROR', msg: 'Did you know blob remaining' });
  if (/\bReferences\s+\d/.test(c))        issues.push({ level: 'ERROR', msg: 'References blob remaining' });
  if (/Key Takeaways\b[^#\n]{50,}/.test(c)) issues.push({ level: 'ERROR', msg: 'Key Takeaways inline blob remaining' });
  if (/openstackdaily/.test(c))           issues.push({ level: 'WARN',  msg: 'openstackdaily URL remaining' });
  if (/function\s+\w+\s*\(/.test(c))     issues.push({ level: 'WARN',  msg: 'JS function blob remaining' });

  // Structure checks
  if (!c.includes('## Wrapping Up'))      issues.push({ level: 'ERROR', msg: 'Missing ## Wrapping Up' });
  if (c.includes('## Conclusion'))        issues.push({ level: 'ERROR', msg: 'Duplicate ## Conclusion present' });
  if (c.includes('## Architecture Diagram')) issues.push({ level: 'WARN', msg: '## Architecture Diagram still present' });

  // Mermaid checks
  let inFence = false;
  for (const line of lines) {
    if (line.startsWith('```')) { inFence = !inFence; continue; }
    if (!inFence && MERMAID_TYPES.test(line.trim())) {
      issues.push({ level: 'ERROR', msg: `Raw unfenced mermaid: "${line.substring(0,60)}..."` });
      break;
    }
  }

  const mermaidBlocks = [...c.matchAll(/```mermaid\n([\s\S]*?)```/g)];
  for (const [, inner] of mermaidBlocks) {
    if (!inner.includes('\n')) issues.push({ level: 'ERROR', msg: 'Mermaid block has no newlines' });
    if (inner.trim().length < 10) issues.push({ level: 'ERROR', msg: 'Mermaid block is empty/too short' });
  }

  // Bullet list check (should exist for posts with term:def sections)
  const hasBullets = lines.some(l => /^- /.test(l));
  if (!hasBullets) issues.push({ level: 'INFO', msg: 'No bullet lists (may be intentional)' });

  // Key Takeaways check
  const hasKT = c.includes('## Key Takeaways');
  if (!hasKT) issues.push({ level: 'WARN', msg: 'No ## Key Takeaways section' });

  // Length sanity
  if (c.length < 500) issues.push({ level: 'ERROR', msg: `Content too short: ${c.length} chars` });

  // Citation remnants
  const citationCount = (c.match(/\s+\d{1,2}\s+(?=[A-Z.])/g) || []).length;
  if (citationCount > 5) issues.push({ level: 'WARN', msg: `~${citationCount} possible citation remnants` });

  return issues;
}

function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const posts = data.posts;

  let errors = 0, warns = 0, infos = 0;
  const failing = [];

  for (const post of posts) {
    const issues = validatePost(post);
    const errs = issues.filter(i => i.level === 'ERROR');
    const wrns = issues.filter(i => i.level === 'WARN');
    const inf  = issues.filter(i => i.level === 'INFO');
    errors += errs.length;
    warns  += wrns.length;
    infos  += inf.length;

    if (errs.length > 0) {
      failing.push({ slug: post.slug, issues: errs });
      console.log(`✗ ${post.slug.substring(0,60)}`);
      for (const e of errs) console.log(`    ERROR: ${e.msg}`);
    } else if (wrns.length > 0) {
      console.log(`⚠ ${post.slug.substring(0,60)}`);
      for (const w of wrns) console.log(`    WARN: ${w.msg}`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('VALIDATION SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Posts:   ${posts.length}`);
  console.log(`  Errors:  ${errors}`);
  console.log(`  Warns:   ${warns}`);
  console.log(`  Infos:   ${infos}`);
  console.log(`  Failing: ${failing.length}`);
  console.log('═'.repeat(60));

  // Stats
  const withBullets = posts.filter(p => p.content.split('\n').some(l => /^- /.test(l))).length;
  const withKT      = posts.filter(p => p.content.includes('## Key Takeaways')).length;
  const withMermaid = posts.filter(p => /```mermaid/.test(p.content)).length;
  const noNoise     = posts.filter(p => !/Share This|Did you know\?|\bReferences\s+\d/.test(p.content)).length;
  console.log('\n📊 CONTENT STATS:');
  console.log(`  With bullet lists:     ${withBullets} / ${posts.length}`);
  console.log(`  With Key Takeaways:    ${withKT} / ${posts.length}`);
  console.log(`  With mermaid fence:    ${withMermaid} / ${posts.length}`);
  console.log(`  Fully noise-free:      ${noNoise} / ${posts.length}`);

  process.exit(failing.length > 0 ? 1 : 0);
}

main();
