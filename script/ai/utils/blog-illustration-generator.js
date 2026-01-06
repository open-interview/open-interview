/**
 * Blog Illustration Generator
 * Generates detailed, context-rich isometric illustrations for tech blogs
 * Features: AI-powered scene generation, metrics, labels, annotations
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import ai from '../index.js';

const IMAGES_DIR = 'blog-output/images';

// GitHub-inspired color palette
const C = {
  bg: '#0d1117', bgCard: '#161b22', bgElevated: '#21262d',
  blue: '#58a6ff', purple: '#a371f7', green: '#3fb950',
  pink: '#f778ba', cyan: '#79c0ff', orange: '#d29922',
  red: '#f85149', yellow: '#e3b341',
  text: '#f0f6fc', textMuted: '#8b949e', textDim: '#484f58',
  border: '#30363d',
  textBg: 'rgba(13,17,23,0.85)' // Semi-transparent background for text
};

// Monospace font stack (Unix-style)
const FONT = "'SF Mono', 'Fira Code', 'JetBrains Mono', 'Cascadia Code', Consolas, Monaco, 'Courier New', monospace";

// Text with contrasting background for readability
const textWithBg = (x, y, text, color = C.text, size = 10, anchor = 'middle', padding = 4) => {
  // Estimate text width (rough approximation: size * 0.6 per character)
  const textWidth = text.length * size * 0.55 + padding * 2;
  const textHeight = size + padding * 2;
  const offsetX = anchor === 'middle' ? -textWidth / 2 : anchor === 'end' ? -textWidth : 0;
  return `
    <g>
      <rect x="${x + offsetX}" y="${y - size - padding/2}" width="${textWidth}" height="${textHeight}" rx="3" fill="${C.textBg}"/>
      <text x="${x}" y="${y}" text-anchor="${anchor}" fill="${color}" font-size="${size}" font-family="${FONT}">${text}</text>
    </g>`;
};

// Text label component with background
const label = (x, y, text, color = C.textMuted, size = 10, anchor = 'middle') => textWithBg(x, y, text, color, size, anchor);

// Metric badge component
const metric = (x, y, value, unit, color = C.green) => `
  <g transform="translate(${x}, ${y})">
    <rect x="-30" y="-12" width="60" height="24" rx="12" fill="${C.bgCard}" stroke="${color}" stroke-width="1"/>
    <text x="0" y="5" text-anchor="middle" fill="${color}" font-size="11" font-weight="600" font-family="${FONT}">${value}${unit}</text>
  </g>`;

// Status indicator
const status = (x, y, state, text) => {
  const colors = { ok: C.green, warn: C.orange, error: C.red, info: C.blue };
  const icons = { ok: '✓', warn: '⚠', error: '✕', info: 'ℹ' };
  const textWidth = text.length * 6 + 8;
  return `
    <g transform="translate(${x}, ${y})">
      <rect x="-14" y="-14" width="${28 + textWidth}" height="28" rx="14" fill="${C.bgCard}" stroke="${colors[state]}" stroke-width="1" opacity="0.9"/>
      <circle r="10" fill="${colors[state]}" opacity="0.3"/>
      <text x="0" y="4" text-anchor="middle" fill="${colors[state]}" font-size="12" font-family="${FONT}">${icons[state]}</text>
      <text x="18" y="4" text-anchor="start" fill="${C.text}" font-size="10" font-family="${FONT}">${text}</text>
    </g>`;
};

// Isometric server with details
const isoServer = (x, y, w, h, d, colors, opts = {}) => {
  const { status: st = 'ok', label: lbl = '', cpu = null, mem = null } = opts;
  const ledColor = st === 'error' ? C.red : st === 'warn' ? C.orange : C.green;
  const lblWidth = lbl ? lbl.length * 5.5 + 8 : 0;
  return `
    <g transform="translate(${x}, ${y})">
      <path d="M0,${-h} L${w*0.866},${-h-w*0.5} L${w*0.866+d*0.866},${-h-w*0.5+d*0.5} L${d*0.866},${-h+d*0.5} Z" fill="${colors.light}" opacity="0.9"/>
      <path d="M0,${-h} L${d*0.866},${-h+d*0.5} L${d*0.866},${d*0.5} L0,0 Z" fill="${colors.main}" opacity="0.85"/>
      <path d="M${d*0.866},${-h+d*0.5} L${w*0.866+d*0.866},${-h-w*0.5+d*0.5} L${w*0.866+d*0.866},${-w*0.5+d*0.5} L${d*0.866},${d*0.5} Z" fill="${colors.dark}" opacity="0.75"/>
      <circle cx="${d*0.866*0.3}" cy="${-h*0.8}" r="4" fill="${ledColor}"><animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite"/></circle>
      <circle cx="${d*0.866*0.3}" cy="${-h*0.6}" r="4" fill="${ledColor}"><animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/></circle>
      ${[0.15, 0.25, 0.35, 0.45].map(p => `<line x1="${d*0.866*0.5}" y1="${-h*p}" x2="${d*0.866*0.9}" y2="${-h*p}" stroke="${colors.dark}" stroke-width="2" opacity="0.5"/>`).join('')}
      ${lbl ? `<g><rect x="${d*0.866/2 - lblWidth/2}" y="${10}" width="${lblWidth}" height="16" rx="3" fill="${C.bgCard}"/><text x="${d*0.866/2}" y="${22}" text-anchor="middle" fill="${C.text}" font-size="9" font-family="${FONT}">${lbl}</text></g>` : ''}
      ${cpu !== null ? `<g><rect x="${d*0.866*0.5}" y="${-h*0.82}" width="28" height="12" rx="2" fill="${C.bgCard}"/><text x="${d*0.866*0.55}" y="${-h*0.73}" fill="${C.cyan}" font-size="8" font-family="${FONT}">${cpu}%</text></g>` : ''}
      ${mem !== null ? `<g><rect x="${d*0.866*0.5}" y="${-h*0.62}" width="32" height="12" rx="2" fill="${C.bgCard}"/><text x="${d*0.866*0.55}" y="${-h*0.53}" fill="${C.purple}" font-size="8" font-family="${FONT}">${mem}GB</text></g>` : ''}
    </g>`;
};

// Database cylinder with label
const isoDatabase = (x, y, r, h, colors, lbl = '') => {
  const lblWidth = lbl ? lbl.length * 5.5 + 8 : 0;
  return `
  <g transform="translate(${x}, ${y})">
    <ellipse cx="0" cy="0" rx="${r}" ry="${r*0.4}" fill="${colors.dark}"/>
    <rect x="${-r}" y="${-h}" width="${r*2}" height="${h}" fill="${colors.main}"/>
    <ellipse cx="0" cy="${-h}" rx="${r}" ry="${r*0.4}" fill="${colors.light}"/>
    ${[-h*0.33, -h*0.66].map(yp => `<ellipse cx="0" cy="${yp}" rx="${r}" ry="${r*0.4}" fill="none" stroke="${colors.light}" stroke-width="1.5" opacity="0.4"/>`).join('')}
    <ellipse cx="0" cy="${-h}" rx="${r*0.5}" ry="${r*0.2}" fill="${colors.light}" opacity="0.3"/>
    ${lbl ? `<g><rect x="${-lblWidth/2}" y="${10}" width="${lblWidth}" height="16" rx="3" fill="${C.bgCard}"/><text x="0" y="${22}" text-anchor="middle" fill="${C.text}" font-size="9" font-family="${FONT}">${lbl}</text></g>` : ''}
  </g>`;
};

// Cloud shape
const cloud = (x, y, scale, color, lbl = '') => {
  const lblWidth = lbl ? lbl.length * 6 + 8 : 0;
  return `
  <g transform="translate(${x}, ${y}) scale(${scale})">
    <path d="M-45,12 Q-55,-5 -35,-18 Q-20,-32 5,-25 Q30,-32 42,-15 Q58,-2 48,12 Q38,22 0,22 Q-38,22 -45,12" fill="${color}" fill-opacity="0.12" stroke="${color}" stroke-width="1.5" stroke-opacity="0.4"/>
    ${lbl ? `<g><rect x="${-lblWidth/2}" y="-6" width="${lblWidth}" height="16" rx="3" fill="${C.bgCard}"/><text x="0" y="6" text-anchor="middle" fill="${color}" font-size="10" font-weight="500" font-family="${FONT}">${lbl}</text></g>` : ''}
  </g>`;
};

// Animated gear
const gear = (x, y, r, color, speed = 10) => {
  const teeth = 8;
  let path = '';
  for (let i = 0; i < teeth; i++) {
    const [a1, a2, a3, a4] = [i/teeth, (i+0.35)/teeth, (i+0.5)/teeth, (i+0.85)/teeth].map(t => t * Math.PI * 2);
    path += `${i === 0 ? 'M' : 'L'}${Math.cos(a1)*r*0.6},${Math.sin(a1)*r*0.6} L${Math.cos(a2)*r},${Math.sin(a2)*r} L${Math.cos(a3)*r},${Math.sin(a3)*r} L${Math.cos(a4)*r*0.6},${Math.sin(a4)*r*0.6} `;
  }
  return `<g transform="translate(${x}, ${y})"><path d="${path}Z" fill="${color}" opacity="0.8"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="${speed}s" repeatCount="indefinite"/></path><circle r="${r*0.2}" fill="${C.bg}"/></g>`;
};

// Connection line with data flow
const connection = (x1, y1, x2, y2, color, curved = false, lbl = '') => {
  const path = curved ? `M${x1},${y1} Q${(x1+x2)/2},${Math.min(y1,y2)-40} ${x2},${y2}` : `M${x1},${y1} L${x2},${y2}`;
  const mx = (x1+x2)/2, my = curved ? Math.min(y1,y2)-40 : (y1+y2)/2;
  const lblWidth = lbl ? lbl.length * 5 + 8 : 0;
  return `
    <path d="${path}" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="6,4" opacity="0.6"><animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1s" repeatCount="indefinite"/></path>
    <circle r="4" fill="${color}"><animateMotion dur="2s" repeatCount="indefinite" path="${path}"/></circle>
    ${lbl ? `<g><rect x="${mx - lblWidth/2}" y="${my-16}" width="${lblWidth}" height="14" rx="3" fill="${C.bgCard}"/><text x="${mx}" y="${my-6}" text-anchor="middle" fill="${color}" font-size="8" font-family="${FONT}">${lbl}</text></g>` : ''}`;
};

// Code editor panel
const codePanel = (x, y, w, h, color, lines = []) => {
  const defaultLines = [
    { text: 'async function deploy() {', color: C.purple },
    { text: '  await build();', color: C.textMuted },
    { text: '  return success;', color: C.green },
    { text: '}', color: C.purple }
  ];
  const codeLines = lines.length ? lines : defaultLines;
  // Escape special XML characters in code text
  const escapeCode = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `
    <g transform="translate(${x}, ${y})">
      <rect width="${w}" height="${h}" rx="8" fill="${C.bgCard}" stroke="${C.border}"/>
      <rect width="${w}" height="22" rx="8" fill="${C.bgElevated}"/>
      <circle cx="12" cy="11" r="4" fill="${C.red}" opacity="0.8"/><circle cx="26" cy="11" r="4" fill="${C.orange}" opacity="0.8"/><circle cx="40" cy="11" r="4" fill="${C.green}" opacity="0.8"/>
      <text x="${w/2}" y="15" text-anchor="middle" fill="${C.textDim}" font-size="9" font-family="${FONT}">main.ts</text>
      ${codeLines.slice(0, Math.floor((h-30)/14)).map((l, i) => `<text x="10" y="${36+i*14}" fill="${l.color}" font-size="10" font-family="${FONT}">${escapeCode(l.text)}</text>`).join('')}
    </g>`;
};

// Terminal with output
const terminal = (x, y, w, h, outputs = []) => {
  const defaultOutputs = [
    { text: '$ npm run deploy', color: C.text },
    { text: '✓ Build complete', color: C.green },
    { text: '→ Deploying...', color: C.cyan }
  ];
  const lines = outputs.length ? outputs : defaultOutputs;
  // Escape special XML characters
  const escapeText = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `
    <g transform="translate(${x}, ${y})">
      <rect width="${w}" height="${h}" rx="8" fill="${C.bg}" stroke="${C.green}" stroke-width="1.5"/>
      <rect width="${w}" height="20" rx="8" fill="${C.green}" opacity="0.15"/>
      <text x="10" y="14" fill="${C.green}" font-size="10" font-family="${FONT}">terminal</text>
      ${lines.slice(0, Math.floor((h-28)/14)).map((l, i) => `<text x="10" y="${34+i*14}" fill="${l.color}" font-size="10" font-family="${FONT}">${escapeText(l.text)}</text>`).join('')}
      <rect x="10" y="${34+lines.length*14}" width="8" height="12" fill="${C.green}"><animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/></rect>
    </g>`;
};

// Metric card
const metricCard = (x, y, title, value, unit, trend, color) => {
  const trendIcon = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';
  const trendColor = trend > 0 ? C.green : trend < 0 ? C.red : C.textMuted;
  return `
    <g transform="translate(${x}, ${y})">
      <rect width="90" height="55" rx="8" fill="${C.bgCard}" stroke="${C.border}"/>
      <text x="10" y="18" fill="${C.textMuted}" font-size="9" font-family="${FONT}">${title}</text>
      <text x="10" y="38" fill="${color}" font-size="18" font-weight="600" font-family="${FONT}">${value}<tspan font-size="10" fill="${C.textMuted}">${unit}</tspan></text>
      <text x="75" y="38" fill="${trendColor}" font-size="14" font-family="${FONT}">${trendIcon}</text>
    </g>`;
};

// Progress bar
const progressBar = (x, y, w, pct, color, lbl = '') => {
  const lblWidth = lbl ? lbl.length * 5.5 + 6 : 0;
  return `
  <g transform="translate(${x}, ${y})">
    <rect width="${w}" height="8" rx="4" fill="${C.bgElevated}"/>
    <rect width="${w * pct / 100}" height="8" rx="4" fill="${color}"/>
    ${lbl ? `<g><rect x="${w+4}" y="-3" width="${lblWidth}" height="14" rx="3" fill="${C.bgCard}"/><text x="${w+8}" y="7" fill="${C.textMuted}" font-size="9" font-family="${FONT}">${lbl}</text></g>` : ''}
  </g>`;
};

// Shield icon
const shield = (x, y, size, color) => `
  <g transform="translate(${x}, ${y})">
    <path d="M0,${-size} L${size*0.7},${-size*0.6} L${size*0.7},${size*0.1} Q${size*0.35},${size*0.8} 0,${size} Q${-size*0.35},${size*0.8} ${-size*0.7},${size*0.1} L${-size*0.7},${-size*0.6} Z" fill="${color}" opacity="0.2" stroke="${color}" stroke-width="2"/>
    <path d="M${-size*0.25},0 L${-size*0.05},${size*0.25} L${size*0.35},${-size*0.25}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
  </g>`;

// Lightning bolt
const lightning = (x, y, size, color) => `
  <g transform="translate(${x}, ${y})">
    <path d="M${size*0.15},${-size} L${-size*0.25},${size*0.05} L${size*0.08},${size*0.05} L${-size*0.15},${size} L${size*0.25},${-size*0.05} L${-size*0.08},${-size*0.05} Z" fill="${color}"><animate attributeName="opacity" values="1;0.5;1;0.7;1" dur="0.6s" repeatCount="indefinite"/></path>
  </g>`;

// Checkmark
const checkmark = (x, y, size, color) => `
  <g transform="translate(${x}, ${y})">
    <circle r="${size}" fill="${color}" opacity="0.15"/>
    <path d="M${-size*0.4},0 L${-size*0.1},${size*0.35} L${size*0.4},${-size*0.3}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
  </g>`;

// X mark
const xmark = (x, y, size, color) => `
  <g transform="translate(${x}, ${y})">
    <circle r="${size}" fill="${color}" opacity="0.15"/>
    <path d="M${-size*0.3},${-size*0.3} L${size*0.3},${size*0.3} M${size*0.3},${-size*0.3} L${-size*0.3},${size*0.3}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
  </g>`;

// Arrow with label
const arrow = (x1, y1, x2, y2, color, lbl = '') => {
  const angle = Math.atan2(y2-y1, x2-x1);
  const len = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
  const mx = (x1+x2)/2, my = (y1+y2)/2;
  const lblWidth = lbl ? lbl.length * 5.5 + 8 : 0;
  return `
    <g>
      <line x1="${x1}" y1="${y1}" x2="${x2-10*Math.cos(angle)}" y2="${y2-10*Math.sin(angle)}" stroke="${color}" stroke-width="2"/>
      <polygon points="${x2},${y2} ${x2-12*Math.cos(angle-0.4)},${y2-12*Math.sin(angle-0.4)} ${x2-12*Math.cos(angle+0.4)},${y2-12*Math.sin(angle+0.4)}" fill="${color}"/>
      ${lbl ? `<g><rect x="${mx - lblWidth/2}" y="${my-16}" width="${lblWidth}" height="14" rx="3" fill="${C.bgCard}"/><text x="${mx}" y="${my-6}" text-anchor="middle" fill="${color}" font-size="9" font-family="${FONT}">${lbl}</text></g>` : ''}
    </g>`;
};

// Enhanced scene templates with rich context
const SCENES = {
  debugging: () => `
    ${codePanel(40, 60, 200, 140, C.red, [
      { text: 'try {', color: C.purple },
      { text: '  await fetch(url);', color: C.text },
      { text: '} catch (err) {', color: C.purple },
      { text: '  // TypeError here', color: C.red },
      { text: '  console.log(err);', color: C.textMuted },
      { text: '}', color: C.purple }
    ])}
    ${terminal(280, 100, 180, 100, [
      { text: '$ node debug.js', color: C.text },
      { text: 'TypeError: undefined', color: C.red },
      { text: 'at line 4, col 12', color: C.orange },
      { text: '→ Stack trace...', color: C.textMuted }
    ])}
    ${lightning(255, 80, 22, C.orange)}
    ${metricCard(500, 60, 'Errors', '23', '/hr', 1, C.red)}
    ${metricCard(500, 125, 'Latency', '847', 'ms', 1, C.orange)}
    ${status(510, 210, 'error', 'Memory leak detected')}
    ${status(510, 235, 'warn', 'High CPU usage')}
    ${gear(600, 320, 30, C.purple, 8)}
    ${connection(240, 130, 280, 150, C.red, false, 'error')}
    ${label(350, 320, 'Debug Session Active', C.orange, 11)}
  `,

  deployment: () => `
    ${codePanel(30, 80, 160, 120, C.blue, [
      { text: 'name: deploy', color: C.cyan },
      { text: 'on: push', color: C.text },
      { text: 'jobs:', color: C.cyan },
      { text: '  build:', color: C.purple },
      { text: '    runs-on: ubuntu', color: C.textMuted }
    ])}
    ${cloud(320, 70, 1.3, C.cyan, 'AWS')}
    ${isoServer(480, 280, 50, 80, 40, {main: C.green, light: '#7ee09a', dark: '#2d9a46'}, {status: 'ok', label: 'prod-1', cpu: 45, mem: 2.1})}
    ${isoServer(580, 280, 50, 80, 40, {main: C.green, light: '#7ee09a', dark: '#2d9a46'}, {status: 'ok', label: 'prod-2', cpu: 38, mem: 1.8})}
    ${connection(190, 140, 280, 100, C.blue, true, 'build')}
    ${connection(360, 100, 460, 200, C.green, true, 'deploy')}
    ${metricCard(220, 220, 'Uptime', '99.9', '%', 0, C.green)}
    ${metricCard(220, 285, 'Deploy', '2.3', 'min', -1, C.blue)}
    ${status(40, 230, 'ok', 'Pipeline passed')}
    ${status(40, 255, 'ok', 'Tests: 142/142')}
    ${status(40, 280, 'info', 'Coverage: 87%')}
    ${checkmark(400, 150, 20, C.green)}
    ${label(530, 320, 'Production Ready', C.green, 11)}
  `,

  scaling: () => `
    ${cloud(350, 50, 1.5, C.cyan, 'Load Balancer')}
    ${isoServer(100, 260, 45, 70, 35, {main: C.blue, light: '#8ec5ff', dark: '#3d7cc9'}, {status: 'ok', label: 'node-1', cpu: 72})}
    ${isoServer(220, 260, 45, 70, 35, {main: C.blue, light: '#8ec5ff', dark: '#3d7cc9'}, {status: 'ok', label: 'node-2', cpu: 68})}
    ${isoServer(340, 260, 45, 70, 35, {main: C.blue, light: '#8ec5ff', dark: '#3d7cc9'}, {status: 'ok', label: 'node-3', cpu: 75})}
    ${isoServer(460, 260, 45, 70, 35, {main: C.purple, light: '#c4a5f9', dark: '#7c5cbf'}, {status: 'warn', label: 'node-4', cpu: 89})}
    ${isoServer(580, 260, 45, 70, 35, {main: C.green, light: '#7ee09a', dark: '#2d9a46'}, {status: 'ok', label: 'new', cpu: 12})}
    ${connection(160, 190, 350, 100, C.cyan)}
    ${connection(280, 190, 350, 100, C.cyan)}
    ${connection(400, 190, 350, 100, C.cyan)}
    ${connection(520, 190, 350, 100, C.cyan)}
    ${metricCard(40, 60, 'RPS', '12.4', 'K', 1, C.blue)}
    ${metricCard(40, 125, 'Nodes', '5', '', 1, C.green)}
    ${progressBar(150, 80, 80, 72, C.blue, '72%')}
    ${progressBar(150, 100, 80, 68, C.blue, '68%')}
    ${progressBar(150, 120, 80, 75, C.blue, '75%')}
    ${progressBar(150, 140, 80, 89, C.orange, '89%')}
    ${arrow(540, 320, 600, 280, C.green, '+1 node')}
    ${label(350, 330, 'Auto-scaling: 5 → 6 nodes', C.cyan, 11)}
  `,

  database: () => `
    ${isoDatabase(120, 280, 45, 100, {main: C.purple, light: '#c4a5f9', dark: '#7c5cbf'}, 'Primary')}
    ${isoDatabase(280, 280, 45, 100, {main: C.blue, light: '#8ec5ff', dark: '#3d7cc9'}, 'Replica 1')}
    ${isoDatabase(440, 280, 45, 100, {main: C.blue, light: '#8ec5ff', dark: '#3d7cc9'}, 'Replica 2')}
    ${connection(165, 200, 235, 200, C.cyan, false, 'sync')}
    ${connection(325, 200, 395, 200, C.cyan, false, 'sync')}
    ${codePanel(480, 60, 180, 100, C.purple, [
      { text: 'SELECT * FROM users', color: C.cyan },
      { text: 'WHERE active = true', color: C.text },
      { text: 'ORDER BY created_at', color: C.text },
      { text: 'LIMIT 100;', color: C.purple }
    ])}
    ${metricCard(40, 60, 'Queries', '2.3', 'K/s', 0, C.purple)}
    ${metricCard(40, 125, 'Latency', '4.2', 'ms', -1, C.green)}
    ${metricCard(150, 60, 'Rows', '14.2', 'M', 1, C.blue)}
    ${metricCard(150, 125, 'Cache', '94', '%', 0, C.cyan)}
    ${status(500, 180, 'ok', 'Replication healthy')}
    ${status(500, 205, 'info', 'Last backup: 2h ago')}
    ${arrow(570, 160, 440, 200, C.purple, 'query')}
    ${label(280, 330, 'PostgreSQL Cluster', C.purple, 11)}
  `,

  security: () => `
    ${isoServer(350, 280, 60, 90, 45, {main: C.blue, light: '#8ec5ff', dark: '#3d7cc9'}, {status: 'ok', label: 'API Gateway'})}
    ${shield(350, 140, 45, C.green)}
    ${cloud(150, 80, 0.9, C.textMuted, 'Internet')}
    ${cloud(550, 80, 0.9, C.green, 'VPC')}
    ${gear(150, 250, 25, C.purple, 12)}
    ${gear(550, 250, 25, C.purple, 12)}
    ${connection(200, 120, 310, 160, C.orange, true, 'HTTPS')}
    ${connection(390, 160, 500, 120, C.green, true, 'Internal')}
    ${metricCard(40, 180, 'Blocked', '847', '', 0, C.red)}
    ${metricCard(40, 245, 'Auth', '99.2', '%', 0, C.green)}
    ${status(40, 80, 'ok', 'SSL/TLS Active')}
    ${status(40, 105, 'ok', 'WAF Enabled')}
    ${status(40, 130, 'ok', 'DDoS Protection')}
    ${codePanel(480, 180, 170, 90, C.green, [
      { text: 'Authorization:', color: C.cyan },
      { text: '  Bearer [token]', color: C.green },
      { text: 'X-API-Key:', color: C.cyan },
      { text: '  ****-****-****', color: C.textMuted }
    ])}
    ${label(350, 330, 'Zero Trust Architecture', C.green, 11)}
  `,

  performance: () => `
    ${gear(120, 160, 50, C.blue, 5)}
    ${gear(220, 200, 40, C.purple, 7)}
    ${gear(310, 160, 45, C.cyan, 6)}
    ${lightning(400, 100, 35, C.orange)}
    ${terminal(420, 130, 200, 110, [
      { text: '$ flame-graph analyze', color: C.text },
      { text: '→ Hotspot: db.query()', color: C.orange },
      { text: '  42% of CPU time', color: C.red },
      { text: '→ Optimizing...', color: C.cyan },
      { text: '✓ -65% latency', color: C.green }
    ])}
    ${metricCard(40, 60, 'P99', '23', 'ms', -1, C.green)}
    ${metricCard(40, 125, 'P50', '8', 'ms', -1, C.green)}
    ${metricCard(150, 60, 'RPS', '45', 'K', 1, C.blue)}
    ${metricCard(150, 125, 'CPU', '34', '%', -1, C.cyan)}
    ${progressBar(450, 260, 150, 42, C.red, 'Before')}
    ${progressBar(450, 285, 150, 15, C.green, 'After')}
    ${status(450, 310, 'ok', '65% improvement')}
    ${label(350, 340, 'Performance Optimization', C.orange, 11)}
  `,

  testing: () => `
    ${codePanel(40, 60, 180, 130, C.blue, [
      { text: 'describe("API", () => {', color: C.purple },
      { text: '  it("returns 200", async', color: C.text },
      { text: '    () => {', color: C.text },
      { text: '    expect(res.status)', color: C.cyan },
      { text: '      .toBe(200);', color: C.green },
      { text: '  });', color: C.text },
      { text: '});', color: C.purple }
    ])}
    ${checkmark(280, 100, 25, C.green)}
    ${checkmark(340, 130, 25, C.green)}
    ${checkmark(280, 160, 25, C.green)}
    ${checkmark(340, 190, 25, C.green)}
    ${xmark(400, 145, 25, C.red)}
    ${terminal(450, 60, 200, 130, [
      { text: '$ npm test', color: C.text },
      { text: '', color: C.text },
      { text: ' PASS  auth.test.ts', color: C.green },
      { text: ' PASS  api.test.ts', color: C.green },
      { text: ' FAIL  edge.test.ts', color: C.red },
      { text: '', color: C.text },
      { text: 'Tests: 4 passed, 1 failed', color: C.orange }
    ])}
    ${metricCard(40, 220, 'Coverage', '87', '%', 1, C.green)}
    ${metricCard(150, 220, 'Tests', '142', '', 0, C.blue)}
    ${metricCard(260, 220, 'Failed', '1', '', 0, C.red)}
    ${progressBar(400, 220, 120, 87, C.green, '87%')}
    ${status(400, 250, 'warn', '1 test failing')}
    ${status(400, 275, 'info', 'CI pipeline blocked')}
    ${label(350, 340, 'Test Suite Results', C.blue, 11)}
  `,

  success: () => `
    ${isoServer(180, 280, 55, 85, 42, {main: C.green, light: '#7ee09a', dark: '#2d9a46'}, {status: 'ok', label: 'Production', cpu: 32})}
    ${checkmark(350, 120, 50, C.green)}
    ${cloud(480, 80, 1.1, C.cyan, 'CDN')}
    ${connection(260, 220, 350, 150, C.green, true)}
    ${connection(350, 150, 440, 110, C.cyan, true)}
    ${metricCard(40, 60, 'Uptime', '100', '%', 0, C.green)}
    ${metricCard(40, 125, 'Users', '12.4', 'K', 1, C.blue)}
    ${metricCard(150, 60, 'Latency', '45', 'ms', -1, C.green)}
    ${metricCard(150, 125, 'Errors', '0', '', 0, C.green)}
    ${status(480, 180, 'ok', 'All systems operational')}
    ${status(480, 205, 'ok', 'Zero downtime deploy')}
    ${status(480, 230, 'ok', 'Rollback ready')}
    ${terminal(480, 260, 170, 70, [
      { text: '✓ Deployed v2.4.1', color: C.green },
      { text: '✓ Health checks pass', color: C.green },
      { text: '✓ Monitoring active', color: C.cyan }
    ])}
    ${label(350, 340, 'Deployment Successful', C.green, 12)}
  `,

  error: () => `
    ${isoServer(180, 280, 55, 85, 42, {main: C.red, light: '#ff8a82', dark: '#c93c35'}, {status: 'error', label: 'prod-1', cpu: 98})}
    ${xmark(350, 120, 45, C.red)}
    ${lightning(420, 100, 30, C.red)}
    ${terminal(420, 150, 200, 120, [
      { text: '$ kubectl logs pod-1', color: C.text },
      { text: 'ERROR: OOMKilled', color: C.red },
      { text: 'Memory limit exceeded', color: C.orange },
      { text: 'Container restarting...', color: C.yellow },
      { text: 'Restart count: 5', color: C.red }
    ])}
    ${metricCard(40, 60, 'Status', '503', '', 0, C.red)}
    ${metricCard(40, 125, 'Errors', '2.3', 'K', 1, C.red)}
    ${metricCard(150, 60, 'Memory', '98', '%', 1, C.red)}
    ${metricCard(150, 125, 'CPU', '100', '%', 1, C.red)}
    ${status(40, 200, 'error', 'Service unavailable')}
    ${status(40, 225, 'error', 'Memory exhausted')}
    ${status(40, 250, 'warn', 'Auto-restart failing')}
    ${connection(260, 220, 350, 150, C.red, true, 'crash')}
    ${label(350, 340, 'Incident: Memory Exhaustion', C.red, 11)}
  `,

  // Mobile/iOS scene - for mobile development topics
  mobile: () => `
    ${codePanel(40, 60, 180, 120, C.cyan, [
      { text: 'func tableView(_ tv:', color: C.purple },
      { text: '  cellForRowAt idx)', color: C.text },
      { text: '  -> UITableViewCell {', color: C.purple },
      { text: '  let cell = dequeue()', color: C.cyan },
      { text: '  cell.configure()', color: C.green },
      { text: '  return cell', color: C.text }
    ])}
    ${metricCard(40, 200, 'FPS', '60', '', 0, C.green)}
    ${metricCard(150, 200, 'Memory', '42', 'MB', -1, C.cyan)}
    ${metricCard(260, 200, 'Cells', '10K', '+', 1, C.purple)}
    ${progressBar(40, 270, 120, 100, C.green, '60fps')}
    ${progressBar(40, 295, 120, 85, C.cyan, 'Smooth')}
    ${terminal(280, 60, 180, 100, [
      { text: '$ instruments -t Time', color: C.text },
      { text: '→ Main Thread: 8ms', color: C.green },
      { text: '→ GPU: 4ms', color: C.cyan },
      { text: '✓ Frame budget OK', color: C.green }
    ])}
    ${gear(520, 120, 40, C.purple, 6)}
    ${gear(580, 160, 30, C.cyan, 8)}
    ${isoServer(520, 280, 45, 70, 35, {main: C.green, light: '#7ee09a', dark: '#2d9a46'}, {status: 'ok', label: 'Device', cpu: 35})}
    ${status(480, 60, 'ok', 'Buttery smooth')}
    ${status(480, 85, 'ok', 'No frame drops')}
    ${checkmark(400, 180, 25, C.green)}
    ${label(350, 340, 'Mobile Performance', C.cyan, 11)}
  `,

  // Frontend/React scene
  frontend: () => `
    ${codePanel(40, 60, 180, 130, C.cyan, [
      { text: 'const App = () => {', color: C.purple },
      { text: '  const [data] = useQ()', color: C.cyan },
      { text: '  return (', color: C.text },
      { text: '    <Suspense>', color: C.pink },
      { text: '      <List data={data}/>', color: C.green },
      { text: '    </Suspense>', color: C.pink },
      { text: '  )', color: C.text }
    ])}
    ${cloud(350, 50, 1.0, C.cyan, 'CDN')}
    ${metricCard(250, 140, 'LCP', '1.2', 's', -1, C.green)}
    ${metricCard(360, 140, 'FID', '45', 'ms', -1, C.green)}
    ${metricCard(470, 140, 'CLS', '0.02', '', 0, C.green)}
    ${terminal(450, 220, 180, 100, [
      { text: '$ npm run build', color: C.text },
      { text: '→ Bundle: 142KB', color: C.cyan },
      { text: '→ Chunks: 12', color: C.purple },
      { text: '✓ Tree-shaken', color: C.green }
    ])}
    ${connection(220, 130, 310, 80, C.blue, true, 'fetch')}
    ${connection(390, 80, 450, 140, C.green, true, 'cache')}
    ${gear(280, 280, 35, C.purple, 7)}
    ${status(40, 220, 'ok', 'Core Web Vitals')}
    ${status(40, 245, 'ok', 'Lighthouse: 98')}
    ${status(40, 270, 'info', 'SSR enabled')}
    ${checkmark(350, 280, 20, C.green)}
    ${label(350, 340, 'Frontend Performance', C.cyan, 11)}
  `,

  // API/Backend scene
  api: () => `
    ${isoServer(120, 260, 50, 80, 40, {main: C.blue, light: '#8ec5ff', dark: '#3d7cc9'}, {status: 'ok', label: 'Gateway', cpu: 28})}
    ${isoServer(280, 260, 50, 80, 40, {main: C.purple, light: '#c4a5f9', dark: '#7c5cbf'}, {status: 'ok', label: 'Auth', cpu: 15})}
    ${isoServer(440, 260, 50, 80, 40, {main: C.green, light: '#7ee09a', dark: '#2d9a46'}, {status: 'ok', label: 'API', cpu: 42})}
    ${connection(180, 200, 240, 200, C.cyan, false, 'JWT')}
    ${connection(340, 200, 400, 200, C.green, false, 'REST')}
    ${codePanel(480, 60, 170, 100, C.green, [
      { text: 'GET /api/v2/users', color: C.cyan },
      { text: 'Authorization: Bearer', color: C.purple },
      { text: '→ 200 OK (12ms)', color: C.green },
      { text: '{ "users": [...] }', color: C.text }
    ])}
    ${metricCard(40, 60, 'RPS', '8.4', 'K', 1, C.blue)}
    ${metricCard(40, 125, 'P99', '45', 'ms', -1, C.green)}
    ${metricCard(150, 60, 'Success', '99.9', '%', 0, C.green)}
    ${metricCard(150, 125, 'Cache', '87', '%', 1, C.cyan)}
    ${status(500, 180, 'ok', 'Rate limit: OK')}
    ${status(500, 205, 'ok', 'Auth: Valid')}
    ${arrow(350, 100, 280, 180, C.purple, 'validate')}
    ${label(300, 330, 'API Gateway Architecture', C.blue, 11)}
  `,

  // Monitoring/Observability scene
  monitoring: () => `
    ${terminal(40, 60, 200, 130, [
      { text: '$ kubectl top pods', color: C.text },
      { text: 'NAME       CPU   MEM', color: C.textMuted },
      { text: 'api-1      45%   1.2G', color: C.green },
      { text: 'api-2      38%   1.1G', color: C.green },
      { text: 'worker-1   72%   2.1G', color: C.orange },
      { text: 'db-0       25%   4.0G', color: C.cyan }
    ])}
    ${metricCard(280, 60, 'Uptime', '99.99', '%', 0, C.green)}
    ${metricCard(390, 60, 'Alerts', '0', '', 0, C.green)}
    ${metricCard(500, 60, 'P95', '23', 'ms', -1, C.cyan)}
    ${progressBar(280, 140, 100, 45, C.green, 'api-1')}
    ${progressBar(280, 165, 100, 38, C.green, 'api-2')}
    ${progressBar(280, 190, 100, 72, C.orange, 'worker')}
    ${progressBar(280, 215, 100, 25, C.cyan, 'db')}
    ${isoServer(520, 280, 50, 80, 40, {main: C.green, light: '#7ee09a', dark: '#2d9a46'}, {status: 'ok', label: 'Grafana', cpu: 12})}
    ${cloud(520, 100, 0.8, C.purple, 'Datadog')}
    ${connection(420, 180, 480, 130, C.purple, true, 'metrics')}
    ${status(40, 220, 'ok', 'All pods healthy')}
    ${status(40, 245, 'info', 'Auto-scale ready')}
    ${status(40, 270, 'ok', 'Logs streaming')}
    ${label(350, 340, 'Observability Dashboard', C.purple, 11)}
  `,

  // Architecture/System Design scene
  architecture: () => `
    ${cloud(350, 40, 1.2, C.cyan, 'Load Balancer')}
    ${isoServer(120, 200, 40, 60, 30, {main: C.blue, light: '#8ec5ff', dark: '#3d7cc9'}, {status: 'ok', label: 'Web'})}
    ${isoServer(240, 200, 40, 60, 30, {main: C.purple, light: '#c4a5f9', dark: '#7c5cbf'}, {status: 'ok', label: 'API'})}
    ${isoServer(360, 200, 40, 60, 30, {main: C.green, light: '#7ee09a', dark: '#2d9a46'}, {status: 'ok', label: 'Worker'})}
    ${isoDatabase(500, 280, 40, 80, {main: C.orange, light: '#f0b860', dark: '#b07818'}, 'PostgreSQL')}
    ${isoDatabase(600, 280, 35, 70, {main: C.red, light: '#ff8a82', dark: '#c93c35'}, 'Redis')}
    ${connection(160, 140, 320, 80, C.cyan)}
    ${connection(280, 140, 350, 80, C.cyan)}
    ${connection(400, 140, 380, 80, C.cyan)}
    ${connection(280, 200, 460, 220, C.purple, true, 'query')}
    ${connection(400, 200, 560, 220, C.red, true, 'cache')}
    ${metricCard(40, 60, 'Services', '5', '', 0, C.blue)}
    ${metricCard(40, 125, 'Regions', '3', '', 0, C.green)}
    ${gear(480, 140, 25, C.purple, 10)}
    ${status(40, 200, 'ok', 'Microservices')}
    ${status(40, 225, 'ok', 'Event-driven')}
    ${status(40, 250, 'info', 'CQRS pattern')}
    ${label(350, 340, 'System Architecture', C.cyan, 11)}
  `,

  default: () => `
    ${isoServer(150, 280, 50, 80, 40, {main: C.blue, light: '#8ec5ff', dark: '#3d7cc9'}, {status: 'ok', label: 'API', cpu: 45})}
    ${cloud(350, 60, 1.2, C.cyan, 'Cloud')}
    ${isoDatabase(500, 280, 45, 90, {main: C.purple, light: '#c4a5f9', dark: '#7c5cbf'}, 'Database')}
    ${connection(220, 220, 320, 100, C.blue, true, 'request')}
    ${connection(380, 100, 460, 200, C.purple, true, 'query')}
    ${gear(350, 280, 25, C.green, 10)}
    ${metricCard(40, 60, 'Requests', '8.2', 'K/s', 0, C.blue)}
    ${metricCard(40, 125, 'Latency', '12', 'ms', 0, C.green)}
    ${status(40, 200, 'ok', 'All services healthy')}
    ${status(40, 225, 'info', 'Last deploy: 2h ago')}
    ${label(350, 340, 'System Architecture', C.cyan, 11)}
  `
};

// Detect scene from content
function detectScene(context) {
  const text = (context || '').toLowerCase();
  // Order matters - more specific scenes first, then general ones
  const keywords = {
    // Success should be checked early for conclusion-type content
    success: ['success', 'win', 'achieve', 'complete', 'done', 'celebrate', 'milestone', 'shipped', 'launched', 'smooth', 'buttery', 'accomplished'],
    error: ['fail', 'outage', 'incident', 'down', 'disaster', 'break', '500', '404', 'oom', 'killed', 'timeout', 'crash'],
    // Platform-specific scenes
    mobile: ['ios', 'android', 'swift', 'kotlin', 'uitableview', 'uicollectionview', 'recyclerview', 'mobile', 'app', 'cell', 'tableview', 'scrollview', 'uikit', 'swiftui', 'jetpack'],
    frontend: ['react', 'vue', 'angular', 'component', 'render', 'virtual dom', 'bundle', 'webpack', 'vite', 'lighthouse', 'web vitals', 'lcp', 'fid', 'cls', 'ssr', 'hydration', 'suspense'],
    // Infrastructure scenes
    api: ['api', 'rest', 'graphql', 'endpoint', 'gateway', 'microservice', 'grpc', 'webhook', 'rate limit', 'throttle', 'request', 'response'],
    monitoring: ['monitor', 'observability', 'grafana', 'datadog', 'prometheus', 'alert', 'dashboard', 'metrics', 'logs', 'traces', 'apm', 'sre'],
    architecture: ['architecture', 'system design', 'microservices', 'event-driven', 'cqrs', 'saga', 'domain', 'ddd', 'hexagonal', 'clean architecture'],
    // Operations scenes
    debugging: ['debug', 'error', 'bug', 'fix', 'issue', 'problem', 'troubleshoot', 'exception', 'stack trace', 'breakpoint'],
    deployment: ['deploy', 'release', 'ci/cd', 'pipeline', 'production', 'launch', 'kubernetes', 'docker', 'helm', 'rollout'],
    scaling: ['scale', 'load', 'traffic', 'distributed', 'cluster', 'replicate', 'horizontal', 'vertical', 'auto-scaling', 'elasticity', 'throughput'],
    // Data scenes
    database: ['database', 'sql', 'query', 'storage', 'postgres', 'mysql', 'mongo', 'redis', 'replication', 'index', 'schema'],
    security: ['security', 'auth', 'encrypt', 'protect', 'vulnerability', 'hack', 'breach', 'ssl', 'oauth', 'jwt', 'firewall', 'token'],
    // Quality scenes
    performance: ['performance', 'optimize', 'fast', 'latency', 'speed', 'efficient', 'profiling', 'benchmark', 'flame graph', 'fps', '60fps', 'frame', 'scroll', 'render', 'memory', 'cpu', 'cache', 'caching'],
    testing: ['test', 'qa', 'quality', 'coverage', 'e2e', 'unit', 'integration', 'jest', 'cypress', 'playwright', 'spec', 'assert']
  };
  for (const [scene, words] of Object.entries(keywords)) {
    if (words.some(w => text.includes(w))) return scene;
  }
  return 'default';
}

// Generate full SVG
function generateSVG(options) {
  const { title = 'Tech Illustration', scene = 'default', context = '', width = 700, height = 380 } = options;
  const sceneContent = SCENES[scene] || SCENES.default;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${C.bg}"/>
      <stop offset="100%" stop-color="${C.bgCard}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bgGrad)"/>
  <g opacity="0.02" stroke="${C.text}">${Array.from({length: 15}, (_, i) => `<line x1="${i*50}" y1="0" x2="${i*50}" y2="${height}"/>`).join('')}${Array.from({length: 8}, (_, i) => `<line x1="0" y1="${i*50}" x2="${width}" y2="${i*50}"/>`).join('')}</g>
  <ellipse cx="${width*0.15}" cy="${height*0.25}" rx="120" ry="80" fill="${C.blue}" opacity="0.03"/>
  <ellipse cx="${width*0.85}" cy="${height*0.75}" rx="100" ry="70" fill="${C.purple}" opacity="0.03"/>
  ${sceneContent(width, height, context)}
</svg>`;
}

function escapeXml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function ensureImagesDir() {
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Validate SVG structure
function validateSVG(svg) {
  const errors = [];
  
  // Check for basic structure
  if (!svg.includes('<?xml')) errors.push('Missing XML declaration');
  if (!svg.includes('<svg')) errors.push('Missing SVG element');
  if (!svg.includes('</svg>')) errors.push('Missing closing SVG tag');
  
  // Check for duplicate attributes (common issue)
  const dupAttrMatch = svg.match(/(\s)(\w+)="[^"]*"\s+\2="/g);
  if (dupAttrMatch) errors.push(`Duplicate attributes found`);
  
  // Check for invalid characters in attributes
  if (svg.match(/="[^"]*[<>][^"]*"/)) {
    errors.push('Invalid characters in attribute values');
  }
  
  // Check for unescaped ampersands (except entities)
  if (svg.match(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/)) {
    errors.push('Unescaped ampersand found');
  }
  
  return { valid: errors.length === 0, errors };
}

// Main export: generate single illustration with validation and retry
export function generateIllustration(options, retryCount = 0) {
  const MAX_RETRIES = 2;
  const { title, context, postId, placement = 'after-intro', filename: providedFilename = null, scene: explicitScene = null } = options;
  
  ensureImagesDir();
  // Use explicit scene if provided, otherwise detect from context
  const scene = explicitScene || detectScene(context || title);
  
  try {
    const svg = generateSVG({ title: title || 'Tech Illustration', scene, context });
    
    // Validate SVG
    const validation = validateSVG(svg);
    if (!validation.valid) {
      console.log(`   ⚠️ SVG validation issues: ${validation.errors.join(', ')}`);
      if (retryCount < MAX_RETRIES) {
        console.log(`   🔄 Retrying with fallback scene (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        return generateIllustration({ ...options, context: 'default fallback' }, retryCount + 1);
      }
    }
    
    let filename = providedFilename;
    if (!filename) {
      const hash = crypto.createHash('md5').update(title + context + placement).digest('hex').substring(0, 8);
      filename = `${postId}-${hash}.svg`;
    }
    
    const filepath = path.join(IMAGES_DIR, filename);
    fs.writeFileSync(filepath, svg);
    
    // Verify file was written
    if (!fs.existsSync(filepath)) {
      throw new Error('File was not written successfully');
    }
    
    const fileSize = fs.statSync(filepath).size;
    if (fileSize < 1000) {
      throw new Error(`File too small: ${fileSize} bytes`);
    }
    
    console.log(`   🎨 Generated: ${filename} (scene: ${scene}, size: ${(fileSize/1024).toFixed(1)}KB)`);
    return { url: `/images/${filename}`, alt: `Illustration: ${title}`, caption: '', placement };
    
  } catch (error) {
    console.log(`   ❌ Error generating SVG: ${error.message}`);
    if (retryCount < MAX_RETRIES) {
      console.log(`   🔄 Retrying (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      return generateIllustration({ ...options, context: 'default' }, retryCount + 1);
    }
    // Return a fallback
    return { url: '', alt: title || 'Illustration', caption: '', placement };
  }
}

// Generate multiple illustrations for blog - ensures variety
export function generateBlogIllustrations(blogContent, postId) {
  const images = [];
  const { title, sections, introduction, realWorldExample, channel } = blogContent;
  const usedScenes = new Set();
  
  // All available scenes for variety
  const allScenes = ['mobile', 'frontend', 'api', 'monitoring', 'architecture', 'debugging', 'deployment', 'scaling', 'database', 'security', 'performance', 'testing', 'success', 'error', 'default'];
  
  // Helper to get a unique scene with smart fallbacks based on channel
  const getUniqueScene = (context, preferredFallbacks = []) => {
    let scene = detectScene(context);
    
    // If scene already used, try preferred fallbacks first, then any unused
    if (usedScenes.has(scene)) {
      // Try preferred fallbacks
      for (const fallback of preferredFallbacks) {
        if (!usedScenes.has(fallback) && SCENES[fallback]) {
          scene = fallback;
          break;
        }
      }
      // If still used, try any unused scene
      if (usedScenes.has(scene)) {
        for (const s of allScenes) {
          if (!usedScenes.has(s) && SCENES[s]) {
            scene = s;
            break;
          }
        }
      }
    }
    usedScenes.add(scene);
    return scene;
  };
  
  // Channel-specific fallback preferences
  const channelFallbacks = {
    'ios': ['mobile', 'performance', 'frontend', 'success'],
    'android': ['mobile', 'performance', 'frontend', 'success'],
    'react-native': ['mobile', 'frontend', 'performance', 'success'],
    'frontend': ['frontend', 'performance', 'api', 'testing'],
    'backend': ['api', 'database', 'scaling', 'deployment'],
    'system-design': ['architecture', 'scaling', 'database', 'monitoring'],
    'devops': ['deployment', 'monitoring', 'scaling', 'architecture'],
    'database': ['database', 'scaling', 'performance', 'architecture'],
    'security': ['security', 'api', 'architecture', 'monitoring'],
    'sre': ['monitoring', 'scaling', 'deployment', 'error'],
    'testing': ['testing', 'deployment', 'debugging', 'success'],
  };
  
  const fallbacks = channelFallbacks[channel] || ['performance', 'architecture', 'deployment', 'success'];
  
  // Image 1: After intro - prefer channel-specific scene
  // For intro, we want to show the main topic, so prioritize channel-specific scenes
  let introScene = detectScene(introduction || title);
  // If detected scene is success/error (conclusion-type), use channel fallback instead
  if (['success', 'error'].includes(introScene)) {
    introScene = fallbacks[0]; // Use first channel-specific fallback
  }
  if (usedScenes.has(introScene)) {
    for (const fb of fallbacks) {
      if (!usedScenes.has(fb) && SCENES[fb]) {
        introScene = fb;
        break;
      }
    }
  }
  usedScenes.add(introScene);
  
  images.push(generateIllustration({ 
    title, 
    context: introduction || title,
    scene: introScene,
    postId, 
    placement: 'after-intro' 
  }));
  
  // Image 2: Mid-article - use different scene based on section content
  if (sections && sections.length > 2) {
    const midIdx = Math.floor(sections.length / 2);
    const mid = sections[midIdx];
    // Rotate fallbacks for variety
    const midFallbacks = [...fallbacks.slice(1), fallbacks[0]];
    const midScene = getUniqueScene(mid.content || mid.heading, midFallbacks);
    images.push(generateIllustration({ 
      title: mid.heading || title, 
      context: mid.content || mid.heading,
      scene: midScene,
      postId, 
      placement: `after-section-${midIdx}` 
    }));
  }
  
  // Image 3: Before conclusion - success/case study scene
  if (realWorldExample) {
    // Prefer success-oriented scenes for conclusion
    const conclusionFallbacks = ['success', 'deployment', 'monitoring', 'architecture'];
    const conclusionScene = getUniqueScene('success complete milestone shipped', conclusionFallbacks);
    images.push(generateIllustration({
      title: `${realWorldExample.company}: ${(realWorldExample.lesson || '').substring(0, 40)}`,
      context: realWorldExample.scenario || realWorldExample.lesson,
      scene: conclusionScene,
      postId, 
      placement: 'before-conclusion'
    }));
  }
  
  console.log(`   📊 Scenes used: ${Array.from(usedScenes).join(', ')}`);
  return images;
}

/**
 * AI-powered blog cartoon generation
 * Uses opencode AI to analyze content and select optimal scenes
 */
export async function generateBlogIllustrationsWithAI(blogContent, postId) {
  const { title, sections, introduction, realWorldExample, channel } = blogContent;
  const images = [];
  const usedScenes = new Set();
  
  console.log(`   🤖 Using AI to analyze content for optimal scene selection...`);
  
  // Prepare content excerpts for AI analysis
  const placements = [
    { 
      placement: 'after-intro', 
      content: introduction || title,
      hint: 'Opening image - set up the problem or main topic'
    }
  ];
  
  if (sections && sections.length > 2) {
    const midIdx = Math.floor(sections.length / 2);
    placements.push({
      placement: `after-section-${midIdx}`,
      content: sections[midIdx]?.content || sections[midIdx]?.heading || '',
      hint: 'Mid-article - show technical details or solution'
    });
  }
  
  if (realWorldExample) {
    placements.push({
      placement: 'before-conclusion',
      content: `${realWorldExample.company}: ${realWorldExample.scenario} - ${realWorldExample.lesson}`,
      hint: 'Conclusion - show success or key takeaway'
    });
  }
  
  // Generate images for each placement
  for (const { placement, content, hint } of placements) {
    let selectedScene = null;
    
    try {
      // Try AI-powered scene selection
      const aiResult = await ai.run('illustrationScene', {
        title,
        content,
        placement,
        channel,
        realWorldExample
      }, { cache: false });
      
      if (aiResult?.sceneType && SCENES[aiResult.sceneType] && !usedScenes.has(aiResult.sceneType)) {
        selectedScene = aiResult.sceneType;
        console.log(`   🎯 AI selected scene: ${selectedScene} for ${placement}`);
      }
    } catch (error) {
      console.log(`   ⚠️ AI scene selection failed: ${error.message}, using fallback`);
    }
    
    // Fallback to keyword-based detection if AI didn't select a scene
    if (!selectedScene) {
      selectedScene = detectScene(content);
      if (usedScenes.has(selectedScene)) {
        const allScenes = Object.keys(SCENES);
        selectedScene = allScenes.find(s => !usedScenes.has(s)) || 'default';
      }
    }
    
    usedScenes.add(selectedScene);
    
    images.push(generateIllustration({
      title,
      context: content,
      scene: selectedScene,
      postId,
      placement
    }));
  }
  
  console.log(`   📊 Final scenes: ${Array.from(usedScenes).join(', ')}`);
  return images;
}

export default { generateIllustration, generateBlogIllustrations, generateBlogIllustrationsWithAI, detectScene, SCENES };

// Named exports for convenience
export { SCENES };
