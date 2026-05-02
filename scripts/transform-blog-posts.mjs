/**
 * Batch Blog Post Transformation — v2
 * =====================================
 * Permanently rewrites all 121 posts into clean structured markdown.
 *
 * Key fixes over v1:
 *  - Mermaid detection is CONTENT-DRIVEN (not heading-keyword-driven)
 *    Works for any section name: Flow, Cycle, Workflow, Comparison, etc.
 *  - Reformats semicolon-separated mermaid to multi-line
 *  - Properly handles posts already partially transformed by v1
 *
 * Template output per post:
 *   [Intro]
 *   ## Section
 *   [Prose or - **Term:** bullets]
 *   ## [Any Section with mermaid]
 *   [Optional text]
 *   ```mermaid
 *   [properly formatted, multi-line]
 *   ```
 *   ## Key Takeaways
 *   - item
 *   ## Wrapping Up
 *   [Conclusion]
 */

import fs from 'fs';

const DATA_FILE = './client/public/blog-data.json';
const CONCURRENCY = 20;

// ─── Mermaid ──────────────────────────────────────────────────────────────────

const MERMAID_TYPES = /^(graph\s+(?:TD|LR|RL|BT|TB)|flowchart(?:\s+(?:TD|LR|RL|BT|TB))?|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|gitGraph|erDiagram|gantt|pie\s+title|mindmap)/;

/** Reformat mermaid from single-line (or semicolon-separated) to multi-line. */
function reformatMermaid(raw) {
  let t = raw.trim();

  // Already multi-line? Only reformat if 0 newlines
  if (t.includes('\n') && !t.includes(';')) return t;

  // Replace semicolons with newlines (semicolon-separated mermaid)
  if (t.includes(';')) {
    t = t.replace(/;\s*/g, '\n  ').replace(/\n  $/, '');
  }

  // Single-line: inject newlines before node definitions
  // Split on " NODEID[" or " NODEID{" or " NODEID(" or " NODEID>" patterns
  // where NODEID is an uppercase letter followed by alphanumeric
  t = t
    // "graph TD A[x]" → "graph TD\n  A[x]"
    .replace(/^((?:graph|flowchart)\s+\w+)\s+([A-Z(])/m, '$1\n  $2')
    // "A[x] B[y]" → "A[x]\n  B[y]"
    .replace(/(\]|\))\s+([A-Z][A-Za-z0-9_]*\s*[\[({>])/g, '$1\n  $2')
    // "A[x] --> B[y]" — keep arrow on same line
    .replace(/(\]|\))\s*(-->|->|--\s*\w+\s*-->|==|===)\s*/g, ' $2 ')
    // Split on standalone arrow-less node lines
    .replace(/([A-Z][A-Za-z0-9_]*)\s+([A-Z][A-Za-z0-9_]*\s+-->)/g, '$1\n  $2')
    // subgraph / end
    .replace(/\s+subgraph\s+/g, '\n  subgraph ')
    .replace(/\s+end\b/g, '\n  end')
    // sequenceDiagram participants and arrows
    .replace(/(participant\s+\w+)\s+/g, '$1\n  ')
    .replace(/(->>|-->>|->|-->)\s+([A-Z])/g, '$1\n  $2');

  // If still no newlines, at least indent nodes
  if (!t.includes('\n')) {
    const header = t.match(/^(graph\s+\w+|flowchart\s+\w+|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|gitGraph|erDiagram|gantt)/)?.[0] || '';
    if (header) {
      const rest = t.slice(header.length).trim();
      t = `${header}\n  ${rest}`;
    }
  }

  return t;
}

/** Extract the properly-fenced mermaid from ## Architecture Diagram section. */
function extractArchMermaid(content) {
  const m = content.match(/## Architecture Diagram\s*\n+```mermaid\n([\s\S]*?)```/);
  if (!m) return null;
  const raw = m[1].trim();
  // If it has no newlines (semicolons or single-line), reformat it
  return (raw.includes('\n') && !raw.includes(';')) ? raw : reformatMermaid(raw);
}

// ─── Citations ────────────────────────────────────────────────────────────────

function removeCitations(text) {
  // Comma-separated clusters "word 1 , 2 , 6 ." → "word."
  // Allows optional commas between citation numbers
  text = text.replace(/(\w|\))(\s+\d{1,2}\s*,?\s*)+\./g, '$1.');
  // Clusters before capital word "word 1 , 2 , 3 NextWord" → "word NextWord"
  text = text.replace(/(\w|\))(\s+\d{1,2}\s*,?\s*)+(?=\s+[A-Z])/g, '$1');
  // Orphaned "2 ,." → "."
  text = text.replace(/\s+\d{1,2}\s*,\./g, '.');
  // "word 6 Word" → "word Word"
  text = text.replace(/([a-z,;])\s+\d{1,2}\s+([A-Z])/g, '$1 $2');
  // Trailing citations: " 6 , 2 ," at end of line → ""
  text = text.replace(/(\s+\d{1,2}\s*,?\s*)+$/gm, '');
  // "[N]" style
  text = text.replace(/\s*\[\d+\]/g, '');
  return text;
}

// ─── HTML Entity Decoder ─────────────────────────────────────────────────────

function decodeEntities(s) {
  return s
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&#x27;/g, "'").replace(/&#x2F;/g, '/')
    .replace(/&amp;lt;/g, '<').replace(/&amp;gt;/g, '>');
}

// ─── Key Takeaways Parser ─────────────────────────────────────────────────────

function parseKeyTakeawayItems(raw) {
  let text = raw
    .replace(/\s+\d{1,2}\s*\.\s*/g, '. ')
    .replace(/\s+\d{1,2}\s+/g, ' ')
    .trim();

  return text
    .split(/\.\s+(?=[A-Z])/)
    .map(s => s.replace(/\.$/, '').trim())
    .filter(s =>
      s.length > 10 &&
      s.length < 300 &&
      !/^(References|Share This|Did you know|function\s)/.test(s)
    );
}

// ─── Term:Definition Converter ────────────────────────────────────────────────

function convertTermDefinitions(paragraph) {
  // Detect "TermWords: definition ending with citation." repeated ≥2 times
  // Split on ". " before "CapWord(s): " pattern
  const TERM_START = /^([A-Z][A-Za-z\s\-']{1,40}(?:\s+in\s+[A-Za-z\s]+)?):\s+(.+)/;
  const SEP = /\.\s+(?=[A-Z][\w\s'-]{1,40}:\s+[A-Z])/g;

  const parts = paragraph.split(SEP);
  if (parts.length < 2) return null;

  const bullets = [];
  let proseParts = [];

  for (const part of parts) {
    const m = part.trim().match(TERM_START);
    if (m) {
      // Flush prose
      if (proseParts.length > 0) {
        bullets.push(proseParts.join(' ').trim());
        proseParts = [];
      }
      const term = m[1].trim();
      const def = m[2].trim()
        .replace(/(\s+\d{1,2})+\s*\.$/, '.')
        .replace(/\.$/, '').trim();
      bullets.push(`- **${term}:** ${def}`);
    } else {
      proseParts.push(part.trim());
    }
  }
  if (proseParts.length > 0) bullets.push(proseParts.join(' ').trim());

  const actualBullets = bullets.filter(b => b.startsWith('- '));
  if (actualBullets.length < 2) return null;

  return bullets.join('\n');
}

// ─── Real-World Case Study Formatter ─────────────────────────────────────────

function formatCaseStudies(text) {
  return text.replace(
    /Real-World Case Study\s+([A-Z][A-Za-z'\s]{0,40}?)\s+([\s\S]{10,400}?)Key Takeaway:\s*([^.\n]{10,200}\.?)/g,
    (_match, company, body, takeaway) => {
      const cleanBody = body.trim()
        .replace(/(\s+\d{1,2})+\s*\./g, '.').replace(/(\s+\d{1,2})+\s*/g, ' ').trim();
      const cleanTakeaway = takeaway.trim()
        .replace(/(\s+\d{1,2})+\s*\.?$/g, '').trim();
      return `\n\n> **Case Study — ${company.trim()}**\n> ${cleanBody}\n>\n> **Key Takeaway:** ${cleanTakeaway}\n\n`;
    }
  );
}

// ─── Noise Stripper (line-safe) ───────────────────────────────────────────────

function cleanLine(line) {
  let t = line;
  t = t.replace(/Share This[^\n]*/g, '');
  t = t.replace(/Did you know\?[^\n]*/g, '');
  t = t.replace(/\bReferences\s+\d[^\n]*/g, '');
  t = t.replace(/\bKey Takeaways\b[^\n]*/g, '');
  t = t.replace(/function\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/g, '');
  t = t.replace(/https?:\/\/openstackdaily\.github\.io\S*/g, '');
  t = t.replace(/https?:\/\/open-interview\.github\.io\S*/g, '');
  t = removeCitations(t);
  return t.trim();
}

// ─── Core Post Transformer ────────────────────────────────────────────────────

function transformPost(post) {
  let content = post.content;
  content = decodeEntities(content);
  content = formatCaseStudies(content);

  // === PHASE 1: Extract valuable data =========================================

  // 1a. Extract properly-formatted mermaid from Architecture Diagram
  const properMermaid = extractArchMermaid(content);

  // 1b. Extract Key Takeaways items
  const ktBlobMatch = content.match(/Key Takeaways\s+([\s\S]*?)(?=References\s+\d|Share This|function\s+\w|$)/);
  const keyTakeawayItems = ktBlobMatch ? parseKeyTakeawayItems(ktBlobMatch[1]) : [];

  // === PHASE 2: Line-by-line processing =======================================

  const lines = content.split('\n');
  const out = [];
  let i = 0;
  let inFence = false;
  let foundKeyTakeaways = false;

  while (i < lines.length) {
    const line = lines[i];

    // ── Fenced code block pass-through ──────────────────────────────────────
    if (line.startsWith('```')) {
      inFence = !inFence;
      if (inFence) {
        // Collect until closing fence
        const block = [line];
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) {
          block.push(lines[i]);
          i++;
        }
        block.push(i < lines.length ? lines[i] : '```');
        i++;

        // Check if it's a mermaid block — reformat if needed
        if (line === '```mermaid') {
          const inner = block.slice(1, -1).join('\n').trim();
          const reformatted = (inner.includes('\n') && !inner.includes(';'))
            ? inner
            : reformatMermaid(inner);
          out.push('```mermaid');
          out.push(reformatted);
          out.push('```');
        } else {
          out.push(...block);
        }
        inFence = false;
        continue;
      }
      i++;
      continue;
    }

    // ── Skip ## Conclusion (duplicate of ## Wrapping Up) ─────────────────────
    if (/^## Conclusion\s*$/.test(line)) {
      i++;
      while (i < lines.length && !lines[i].startsWith('## ')) i++;
      continue;
    }

    // ── Skip ## Architecture Diagram (mermaid merged into flow section) ───────
    if (/^## Architecture Diagram\s*$/.test(line)) {
      i++;
      while (i < lines.length && !lines[i].startsWith('## ')) i++;
      continue;
    }

    // ── Insert ## Key Takeaways before ## Wrapping Up ─────────────────────────
    if (/^## Wrapping Up\s*$/.test(line) && keyTakeawayItems.length > 0 && !foundKeyTakeaways) {
      foundKeyTakeaways = true;
      // Only insert if not already present in output
      const outText = out.join('\n');
      if (!outText.includes('## Key Takeaways')) {
        out.push('');
        out.push('## Key Takeaways');
        out.push('');
        for (const item of keyTakeawayItems) {
          const cleaned = item
            .replace(/(\s+\d{1,2})+\s*\.?$/g, '')
            .replace(/\.$/, '')
            .trim();
          if (cleaned.length > 10) out.push(`- ${cleaned}`);
        }
      }
      out.push('');
      out.push(line);
      i++;
      continue;
    }

    // ── Heading — pass through with spacing ───────────────────────────────────
    if (line.startsWith('#')) {
      // Ensure blank line before heading (if not at start)
      if (out.length > 0 && out[out.length - 1] !== '') out.push('');
      out.push(line);
      i++;
      continue;
    }

    // ── Blockquote (formatted case studies) — pass through ───────────────────
    if (line.startsWith('>')) {
      out.push(line);
      i++;
      continue;
    }

    // ── Existing bullet list lines — pass through cleaned ────────────────────
    if (/^[-*+]\s/.test(line) || /^\d+\.\s/.test(line)) {
      out.push(cleanLine(line) || line);
      i++;
      continue;
    }

    // ── Empty line ────────────────────────────────────────────────────────────
    if (line.trim() === '') {
      out.push('');
      i++;
      continue;
    }

    // ── Content line: check for raw mermaid FIRST ─────────────────────────────
    const trimmed = line.trim();

    if (MERMAID_TYPES.test(trimmed)) {
      // Strip trailing noise from raw mermaid line
      const noiseIdx = trimmed.search(/\b(Did you know|Key Takeaways|References\s+\d|Share This|function\s+\w)\b/);
      const mermaidSource = noiseIdx > 0 ? trimmed.substring(0, noiseIdx).trim() : trimmed;

      // Use properMermaid (from Architecture Diagram) or reformat the raw
      const mermaidContent = properMermaid || reformatMermaid(mermaidSource);

      // Ensure blank line before fence
      if (out.length > 0 && out[out.length - 1] !== '') out.push('');
      out.push('```mermaid');
      out.push(mermaidContent);
      out.push('```');

      // Skip the rest of this paragraph (it's all noise: Did you know, KT, References, Share This)
      i++;
      // Advance past any continuation of the same paragraph on next lines
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !lines[i].startsWith('#') &&
        !lines[i].startsWith('```')
      ) {
        i++;
      }
      continue;
    }

    // ── Regular prose line — clean noise and convert term:def ─────────────────
    const cleaned = cleanLine(line);

    if (!cleaned) {
      i++;
      continue;
    }

    // Try term:definition conversion for long content lines
    if (
      cleaned.length > 120 &&
      /[A-Z][\w\s'-]+:\s+[A-Z]/.test(cleaned) &&
      (cleaned.match(/:\s+[A-Z]/g) || []).length >= 2
    ) {
      const converted = convertTermDefinitions(cleaned);
      if (converted) {
        if (out.length > 0 && out[out.length - 1] !== '') out.push('');
        out.push(converted);
        i++;
        continue;
      }
    }

    out.push(cleaned);
    i++;
  }

  // === PHASE 3: Post-processing ================================================

  let result = out.join('\n');

  // Remove stray JS blobs
  result = result.replace(/function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?\}/g, '');

  // Collapse 3+ blank lines
  result = result.replace(/\n{3,}/g, '\n\n');

  // Ensure blank line after each ## heading
  result = result.replace(/(^## [^\n]+)\n(?!\n)/gm, '$1\n\n');

  // Trim trailing whitespace per line
  result = result.split('\n').map(l => l.trimEnd()).join('\n');

  result = result.trim();

  // === PHASE 4: Validate ======================================================
  const errors = validate(result, post.slug, keyTakeawayItems.length);

  return { content: result, errors, keyTakeawayCount: keyTakeawayItems.length, hasMermaid: !!properMermaid };
}

// ─── Validator ────────────────────────────────────────────────────────────────

function validate(content, slug, expectedKT) {
  const errors = [];

  if (content.includes('Share This'))       errors.push('NOISE: Share This remaining');
  if (content.includes('Did you know?'))    errors.push('NOISE: Did you know remaining');
  if (/\bReferences\s+\d/.test(content))   errors.push('NOISE: References blob remaining');
  if (content.includes('## Conclusion'))    errors.push('DUPLICATE: ## Conclusion present');
  if (content.includes('## Architecture Diagram')) errors.push('DUPLICATE: ## Architecture Diagram present');
  if (!content.includes('## Wrapping Up')) errors.push('STRUCTURE: Missing ## Wrapping Up');
  if (expectedKT > 0 && !content.includes('## Key Takeaways')) {
    errors.push('STRUCTURE: Missing ## Key Takeaways');
  }
  if (content.includes('openstackdaily') || content.includes('open-interview.github.io')) {
    errors.push('URL: Platform URL remaining');
  }

  // Raw mermaid check
  const lines = content.split('\n');
  let inFence = false;
  for (const line of lines) {
    if (line.startsWith('```')) { inFence = !inFence; continue; }
    if (!inFence && MERMAID_TYPES.test(line.trim())) {
      errors.push(`MERMAID: Raw unfenced line: "${line.substring(0, 50)}..."`);
      break;
    }
  }

  // Mermaid content quality checks
  const mermaidBlocks = [...content.matchAll(/```mermaid\n([\s\S]*?)```/g)];
  for (const [, inner] of mermaidBlocks) {
    const hasNewlinesOrSemis = inner.includes('\n') || inner.includes(';');
    if (!hasNewlinesOrSemis) errors.push('MERMAID: Block has no newlines or semicolons');
    if (inner.trim().length < 10) errors.push('MERMAID: Block is empty/too short');
  }

  if (content.length < 400) errors.push(`SANITY: Content too short (${content.length} chars)`);

  return errors;
}

// ─── Parallel Queue Runner ────────────────────────────────────────────────────

async function runWithConcurrency(tasks, concurrency, fn) {
  const results = new Array(tasks.length);
  let nextIdx = 0;

  async function worker(id) {
    while (nextIdx < tasks.length) {
      const idx = nextIdx++;
      try { results[idx] = await fn(tasks[idx], idx, id); }
      catch (e) { results[idx] = { error: e.message }; }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, (_, id) => worker(id)));
  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('📖 Loading blog data...');
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  const data = JSON.parse(raw);
  const posts = data.posts;
  console.log(`   ${posts.length} posts loaded\n`);

  // ── Idempotency guard ──────────────────────────────────────────────────────
  // Original data has ## Architecture Diagram sections (stripped by transform).
  // If none remain, the data is already transformed.
  const needsTransform = posts.filter(p => p.content.includes('## Architecture Diagram')).length;
  if (needsTransform === 0) {
    console.log(`⚠️  Data appears already transformed (no ## Architecture Diagram sections found).`);
    console.log('   Pass --force to override.\n');
    if (!process.argv.includes('--force')) process.exit(0);
    console.log('   --force flag detected. Proceeding anyway...\n');
  } else {
    console.log(`   ${needsTransform} posts need transformation (have ## Architecture Diagram).\n`);
  }

  console.log(`🚀 Starting transformation — ${CONCURRENCY} parallel workers...\n`);

  const t0 = Date.now();
  let ok = 0, fail = 0, mermaidCount = 0, ktCount = 0;

  const results = await runWithConcurrency(posts, CONCURRENCY, async (post, idx, wid) => {
    const r = transformPost(post);
    const sym = r.errors.length === 0 ? '✓' : '✗';
    const tags = [r.hasMermaid ? '[mermaid]' : '', r.keyTakeawayCount > 0 ? `[${r.keyTakeawayCount} KT]` : ''].filter(Boolean).join(' ');
    process.stdout.write(
      `  W${String(wid+1).padStart(2,'0')} ${sym} [${String(idx+1).padStart(3,'0')}/${posts.length}] ${post.slug.substring(0,52).padEnd(52)} ${tags}\n`
    );
    if (r.errors.length > 0) {
      for (const e of r.errors) process.stdout.write(`       ↳ ${e}\n`);
    }
    return r;
  });

  for (let i = 0; i < posts.length; i++) {
    const r = results[i];
    if (r && !r.error) {
      posts[i] = { ...posts[i], content: r.content };
      r.errors.length === 0 ? ok++ : fail++;
      if (r.hasMermaid) mermaidCount++;
      if (r.keyTakeawayCount > 0) ktCount++;
    }
  }

  console.log('\n💾 Writing transformed data...');
  fs.writeFileSync(DATA_FILE, JSON.stringify(data), 'utf8');

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('\n' + '═'.repeat(60));
  console.log('📊 TRANSFORMATION REPORT');
  console.log('═'.repeat(60));
  console.log(`  Posts:           ${posts.length}`);
  console.log(`  ✓ Succeeded:     ${ok}`);
  console.log(`  ✗ Failed:        ${fail}`);
  console.log(`  With mermaid:    ${mermaidCount}`);
  console.log(`  With KT section: ${ktCount}`);
  console.log(`  Time:            ${elapsed}s`);
  console.log('═'.repeat(60));

  if (fail > 0) { console.log('\n⚠️  Some posts still have issues.\n'); process.exit(1); }
  else { console.log('\n✅ All posts transformed successfully!\n'); }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
