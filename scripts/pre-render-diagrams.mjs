#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const QUESTIONS_DIR = path.join(ROOT, 'data', 'questions');
const OUTPUT_DIR = path.join(ROOT, 'client', 'public', 'data', 'diagrams');

function shimSvgElement(el) {
  if (!el.getBBox) el.getBBox = () => ({ x: 0, y: 0, width: 100, height: 50 });
  if (!el.getCTM) el.getCTM = () => null;
  if (!el.getScreenCTM) el.getScreenCTM = () => null;
  if (!el.getTotalLength) el.getTotalLength = () => 0;
  if (!el.getPointAtLength) el.getPointAtLength = () => ({ x: 0, y: 0 });
  if (!el.getComputedTextLength) el.getComputedTextLength = () => 0;
  if (!el.getStartPositionOfChar) el.getStartPositionOfChar = () => ({ x: 0, y: 0 });
  if (!el.getEndPositionOfChar) el.getEndPositionOfChar = () => ({ x: 0, y: 0 });
  if (!el.getExtentOfChar) el.getExtentOfChar = () => ({ x: 0, y: 0, width: 0, height: 0 });
  if (!el.getRotationOfChar) el.getRotationOfChar = () => 0;
  if (!el.getCharNumAtPosition) el.getCharNumAtPosition = () => 0;
  if (!el.getSubStringLength) el.getSubStringLength = () => 0;
  if (!el.isPointInFill) el.isPointInFill = () => false;
  if (!el.isPointInStroke) el.isPointInStroke = () => false;
  return el;
}

function setupDOM() {
  const dom = new JSDOM('<!DOCTYPE html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
  });

  const w = dom.window;
  global.document = w.document;
  global.window = w;
  if (Object.getOwnPropertyDescriptor(global, 'navigator')?.get) {
    Object.defineProperty(global, 'navigator', { value: w.navigator, writable: true, configurable: true });
  } else {
    global.navigator = w.navigator;
  }
  global.HTMLElement = w.HTMLElement;
  global.SVGElement = w.SVGElement;
  global.Element = w.Element;
  global.NodeList = w.NodeList;
  global.HTMLCollection = w.HTMLCollection;
  global.DOMParser = w.DOMParser;
  global.getComputedStyle = w.getComputedStyle.bind(w);

  const origCreateElementNS = document.createElementNS.bind(document);
  document.createElementNS = function (ns, name) {
    return shimSvgElement(origCreateElementNS(ns, name));
  };
}

function hashText(text) {
  return crypto.createHash('sha256').update(text.trim()).digest('hex').slice(0, 32);
}

function getSvgPath(hash) {
  return path.join(OUTPUT_DIR, hash.slice(0, 2), `${hash}.svg`);
}

async function initMermaid() {
  const m = (await import('mermaid')).default;
  m.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
      background: '#0d1117', mainBkg: '#161b22',
      primaryColor: '#1f3d5c', primaryTextColor: '#e6edf3',
      primaryBorderColor: '#388bfd', lineColor: '#8b949e',
      secondaryColor: '#1a3a2a', tertiaryColor: '#2d1e40',
      titleColor: '#e6edf3', nodeBorder: '#388bfd',
      clusterBkg: '#161b22', clusterBorder: '#30363d',
      edgeLabelBackground: '#21262d',
    },
    securityLevel: 'loose',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: 14,
    flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis', nodeSpacing: 50, rankSpacing: 50 },
    sequence: { diagramMarginX: 50, diagramMarginY: 20, boxMargin: 10, noteMargin: 10, messageMargin: 35, mirrorActors: false, useMaxWidth: true },
  });
  return m;
}

function renderDiagram(mermaid, code) {
  return new Promise((resolve, reject) => {
    const id = `d-${Math.random().toString(36).slice(2, 9)}`;
    let settled = false;
    try {
      mermaid.render(id, code, (svg) => {
        if (settled) return;
        settled = true;
        if (svg.includes('class="error-icon') || svg.includes('aria-roledescription="error"')) {
          reject(new Error('Mermaid parse error'));
        } else {
          resolve(svg);
        }
      });
    } catch (e) {
      if (!settled) { settled = true; reject(e); }
    }
  });
}

function extractCode(diagram) {
  if (!diagram) return null;
  const trimmed = diagram.trim();
  const match = trimmed.match(/^```mermaid\s*\n([\s\S]*?)```/);
  return match ? match[1].trim() : trimmed;
}

function fixMermaidSyntax(code) {
  const special = /[()\[\]{}]/;

  function wrapLabel(line) {
    let result = '';
    let i = 0;
    while (i < line.length) {
      if (line[i] === '[' || line[i] === '{') {
        const close = line[i] === '[' ? ']' : '}';
        let depth = 1;
        let j = i + 1;
        while (j < line.length && depth > 0) {
          if (line[j] === line[i]) depth++;
          else if (line[j] === close) depth--;
          if (depth > 0) j++;
        }
        const label = line.slice(i + 1, j);
        if (label && !label.startsWith('"') && !label.startsWith("'") && special.test(label)) {
          result += (line[i] === '[') ? `["${label}"]` : `{"${label}"}`;
        } else {
          result += line.slice(i, j + 1);
        }
        i = j + 1;
      } else {
        result += line[i];
        i++;
      }
    }
    return result;
  }

  return code.split('\n').map(wrapLabel).join('\n');
}

function loadQuestions(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  return Array.isArray(data) ? data : (data.questions || []);
}

async function main() {
  console.log('=== Pre-render Mermaid Diagrams ===');
  console.log('Setting up jsdom environment...');
  setupDOM();

  console.log('Initializing mermaid...');
  const mermaid = await initMermaid();
  console.log('Mermaid ready.\n');

  const files = fs.readdirSync(QUESTIONS_DIR)
    .filter(f => f.endsWith('.json'))
    .sort()
    .map(f => path.join(QUESTIONS_DIR, f));

  let totalQuestions = 0;
  let totalWithDiagrams = 0;
  let rendered = 0;
  let failed = 0;
  let skippedCached = 0;
  let skippedEmpty = 0;
  const hashToId = {};
  const failures = [];

  for (const filePath of files) {
    const questions = loadQuestions(filePath);
    const fileName = path.basename(filePath);
    let fileCount = 0;

    for (const q of questions) {
      if (!q.diagram) continue;

      let code = extractCode(q.diagram);
      if (!code) { skippedEmpty++; continue; }

      let originalCode = code;
      code = fixMermaidSyntax(code);

      const h = hashText(code);
      hashToId[h] = q.id;
      const outPath = getSvgPath(h);

      if (fs.existsSync(outPath)) {
        skippedCached++;
        continue;
      }

      fileCount++;
      totalWithDiagrams++;

      try {
        const svgStr = await renderDiagram(mermaid, code);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, svgStr, 'utf-8');
        rendered++;
      } catch (err) {
        failed++;
        failures.push({ id: q.id, file: fileName, error: err.message, code: originalCode.slice(0, 120) });
      }
    }

    totalQuestions += questions.length;
    if (fileCount > 0) {
      console.log(`  ${fileName}: ${fileCount} diagrams`);
    }
  }

  const index = {};
  for (const [hash, qid] of Object.entries(hashToId)) {
    index[qid] = { hash, url: `/data/diagrams/${hash.slice(0, 2)}/${hash}.svg` };
  }
  const indexPath = path.join(OUTPUT_DIR, 'index.json');
  fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

  fs.writeFileSync(path.join(OUTPUT_DIR, 'build.json'), JSON.stringify({
    builtAt: new Date().toISOString(), rendered, total: totalWithDiagrams, failed,
  }, null, 2));

  console.log(`\n=== Summary ===`);
  console.log(`  Total questions:       ${totalQuestions}`);
  console.log(`  With diagrams:         ${totalWithDiagrams}`);
  console.log(`  Rendered (new):        ${rendered}`);
  console.log(`  Failed:                ${failed}`);
  console.log(`  Skipped (cached):      ${skippedCached}`);
  console.log(`  Skipped (empty):       ${skippedEmpty}`);
  console.log(`  Index entries:         ${Object.keys(index).length}`);

  if (failures.length > 0) {
    console.log(`\n=== Failures (${failures.length}) ===`);
    for (const f of failures.slice(0, 15)) {
      console.log(`  [${f.id} in ${f.file}] ${f.error}`);
    }
    fs.writeFileSync(path.join(OUTPUT_DIR, 'failures.json'), JSON.stringify(failures, null, 2));
    console.log(`  Full list: ${path.join(OUTPUT_DIR, 'failures.json')}`);
  }

  console.log('\nDone.');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
