#!/usr/bin/env node
/**
 * Bulk-fix truncated/invalid Mermaid diagrams in question data files.
 *
 * Common issues:
 *   1. Truncated diagrams (cut off mid-syntax) — most common failure
 *   2. Missing closing brackets/quotes
 *   3. Incomplete node declarations
 *
 * Heuristic: try rendering each line progressively; if at any point
 * the diagram becomes too broken to work, roll back to the last valid line.
 */

import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const QUESTIONS_DIR = path.join(ROOT, 'data', 'questions');

// ─── JSDOM + Mermaid setup (same as pre-render-diagrams.mjs) ──────────────

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

async function initMermaid() {
  const m = (await import('mermaid')).default;
  m.initialize({
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'loose',
    fontFamily: 'monospace',
    flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
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
          reject(new Error('Parse error'));
        } else {
          resolve(svg);
        }
      });
    } catch (e) {
      if (!settled) { settled = true; reject(e); }
    }
  });
}

function isValidMermaidStart(code) {
  if (!code || code.trim().length < 10) return false;
  const first = code.trim().split('\n')[0].toLowerCase();
  const starts = ['graph', 'flowchart', 'sequencediagram', 'classdiagram', 'statediagram', 'erdiagram', 'journey', 'gantt', 'pie', 'gitgraph', 'mindmap', 'timeline'];
  return starts.some(s => first.startsWith(s));
}

function extractCode(d) {
  if (!d) return null;
  const trimmed = d.trim();
  const match = trimmed.match(/^```mermaid\s*\n([\s\S]*?)```/);
  return match ? match[1].trim() : trimmed;
}

// ─── Fix truncated diagrams ───────────────────────────────────────────────

function fixTruncatedDiagram(raw) {
  let code = extractCode(raw);
  if (!code) return raw;
  if (!isValidMermaidStart(code)) return raw; // not mermaid at all, leave as-is

  // If it already ends with a complete statement, no fix needed
  const lines = code.split('\n');
  const lastLine = lines[lines.length - 1].trim();

  // A complete line ends with a node name or arrow target
  const looksComplete = /\]|\)|>"|>|END|end["']?$/.test(lastLine) || /^[A-Za-z]/.test(lastLine);

  if (looksComplete) return raw;

  // Truncated — try dropping the last line
  let fixed = lines.slice(0, -1).join('\n').trim();
  if (fixed.length > 10 && isValidMermaidStart(fixed)) {
    return code.replace(code.split('\n').slice(0, -1).join('\n'), fixed);
  }

  return raw;
}

// ─── Validate by trying to render ─────────────────────────────────────────

async function validateDiagram(mermaid, code) {
  try {
    await renderDiagram(mermaid, code);
    return true;
  } catch {
    return false;
  }
}

// ─── Progressive fix: try truncating one line at a time ───────────────────

function tryFixTruncation(code) {
  const lines = code.split('\n');
  for (let i = lines.length - 1; i >= 1; i--) {
    const candidate = lines.slice(0, i).join('\n').trim();
    if (candidate.length > 10 && isValidMermaidStart(candidate)) {
      return candidate;
    }
  }
  return null;
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Bulk Fix Diagrams ===\n');

  const files = fs.readdirSync(QUESTIONS_DIR)
    .filter(f => f.endsWith('.json'))
    .sort()
    .map(f => path.join(QUESTIONS_DIR, f));

  // First pass: identify broken diagrams by trying to validate
  // We need mermaid for this
  setupDOM();
  const mermaid = await initMermaid();

  let total = 0;
  let valid = 0;
  let fixed = 0;
  let unfixable = 0;
  let empty = 0;

  for (const filePath of files) {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const questions = Array.isArray(raw) ? raw : (raw.questions || []);
    const fileName = path.basename(filePath);

    let fileChanged = false;
    let fileFixed = 0;

    for (const q of questions) {
      if (!q.diagram || q.diagram.trim().length < 10) {
        empty++;
        continue;
      }

      total++;
      const code = extractCode(q.diagram);
      if (!code) { empty++; continue; }

      // Try original
      if (await validateDiagram(mermaid, code)) {
        valid++;
        continue;
      }

      // Try fixed
      const fixedCode = tryFixTruncation(code);
      if (fixedCode && await validateDiagram(mermaid, fixedCode)) {
        q.diagram = q.diagram.trim().replace(code, fixedCode);
        fixed++;
        fileFixed++;
        fileChanged = true;
        continue;
      }

      // Can't fix — strip the diagram so it's not broken
      unfixable++;
    }

    if (fileChanged) {
      if (Array.isArray(raw)) {
        fs.writeFileSync(filePath, JSON.stringify(raw, null, 2));
      } else {
        raw.questions = questions;
        fs.writeFileSync(filePath, JSON.stringify(raw, null, 2));
      }
      console.log(`  ${fileName}: fixed ${fileFixed} diagrams`);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`  Total with diagrams: ${total}`);
  console.log(`  Already valid:       ${valid}`);
  console.log(`  Fixed:               ${fixed}`);
  console.log(`  Unfixable:           ${unfixable}`);
  console.log(`  No diagram:          ${empty}`);
  console.log('\nDone.');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
