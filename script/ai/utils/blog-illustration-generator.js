/**
 * Blog Illustration Generator v6
 * AI-Powered Dynamic Scene Generation
 * Uses opencode-ai to generate contextual illustrations
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import ai from '../index.js';

const IMAGES_DIR = 'blog-output/images';
const W = 700, H = 380;

// GitHub dark theme colors
const COLORS = {
  bg: '#0d1117', bgCard: '#161b22', bgElevated: '#21262d',
  blue: '#58a6ff', purple: '#a371f7', green: '#3fb950',
  pink: '#f778ba', cyan: '#39c5cf', orange: '#d29922',
  red: '#f85149', yellow: '#e3b341',
  text: '#e6edf3', textMuted: '#8b949e', textDim: '#6e7681',
  border: '#30363d',
};

const FONT = "'SF Mono', 'Fira Code', Consolas, monospace";

// Lucide icons
const ICONS = {
  server: 'M2 9h20M2 15h20M6 9v6M18 9v6M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
  database: 'M21 5c0 1.1-4 2-9 2s-9-.9-9-2m18 0c0-1.1-4-2-9-2s-9 .9-9 2m18 0v14c0 1.1-4 2-9 2s-9-.9-9-2V5m18 7c0 1.1-4 2-9 2s-9-.9-9-2',
  cloud: 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z',
  network: 'M9 2v6M15 2v6M12 17v5M5 8h14M5 8a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2M12 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  container: 'M22 7L12 2 2 7v10l10 5 10-5V7zM12 22V12M22 7l-10 5M2 7l10 5',
  code: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
  terminal: 'M4 17l6-6-6-6M12 19h8',
  bug: 'M8 2l1.88 1.88M14.12 3.88L16 2M9 7.13v-1a3 3 0 1 1 6 0v1M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6M12 20v-9',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  shieldCheck: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
  lock: 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4',
  key: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  barChart: 'M12 20V10M18 20V4M6 20v-4',
  gauge: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 12a10 10 0 1 0 20 0 10 10 0 0 0-20 0M12 6V2M6 12H2M12 18v4M18 12h4',
  clock: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  checkCircle: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3',
  xCircle: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM15 9l-6 6M9 9l6 6',
  alertCircle: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01',
  smartphone: 'M12 18h.01M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  layers: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  box: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
  cog: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41',
  rocket: 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  target: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  trendingUp: 'M23 6l-9.5 9.5-5-5L1 18',
  bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  memory: 'M6 19v-3M10 19v-3M14 19v-3M18 19v-3M8 11V9M16 11V9M4 15h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2z',
  cpu: 'M6 6h12v12H6zM9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2',
};

// ============== SVG COMPONENTS ==============

const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const icon = (name, x, y, size = 24, color = COLORS.text) => {
  const p = ICONS[name];
  if (!p) return '';
  const s = size / 24;
  return `<g transform="translate(${x - size/2}, ${y - size/2}) scale(${s})"><path d="${p}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></g>`;
};

const iconCircle = (name, x, y, size = 48, color = COLORS.blue) => `
  <circle cx="${x}" cy="${y}" r="${size/2 + 8}" fill="${color}" opacity="0.1"/>
  <circle cx="${x}" cy="${y}" r="${size/2}" fill="${COLORS.bgCard}" stroke="${color}" stroke-width="2"/>
  ${icon(name, x, y, size * 0.5, color)}`;

const badge = (iconName, x, y, label, color = COLORS.blue) => {
  const w = Math.max(label.length * 7 + 20, 70);
  return `
  <rect x="${x - w/2}" y="${y - 28}" width="${w}" height="56" rx="8" fill="${COLORS.bgCard}" stroke="${color}" stroke-width="1.5"/>
  ${icon(iconName, x, y - 6, 20, color)}
  <text x="${x}" y="${y + 18}" text-anchor="middle" fill="${COLORS.textMuted}" font-size="10" font-family="${FONT}">${esc(label)}</text>`;
};

const statusPill = (x, y, state, text) => {
  const col = { ok: COLORS.green, warn: COLORS.orange, error: COLORS.red, info: COLORS.cyan }[state] || COLORS.textMuted;
  const w = text.length * 6.5 + 28;
  return `
  <rect x="${x}" y="${y}" width="${w}" height="24" rx="12" fill="${COLORS.bgCard}" stroke="${col}"/>
  <circle cx="${x + 12}" cy="${y + 12}" r="4" fill="${col}"/>
  <text x="${x + 22}" y="${y + 16}" fill="${COLORS.text}" font-size="10" font-family="${FONT}">${esc(text)}</text>`;
};

const metricCard = (x, y, iconName, label, value, unit, color = COLORS.blue, trend = null) => {
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '';
  const trendColor = trend === 'up' ? COLORS.green : trend === 'down' ? COLORS.red : '';
  return `
  <rect x="${x}" y="${y}" width="100" height="55" rx="6" fill="${COLORS.bgCard}" stroke="${COLORS.border}"/>
  ${icon(iconName, x + 18, y + 18, 18, color)}
  <text x="${x + 38}" y="${y + 20}" fill="${COLORS.textMuted}" font-size="9" font-family="${FONT}">${esc(label)}</text>
  <text x="${x + 10}" y="${y + 44}" fill="${color}" font-size="18" font-weight="600" font-family="${FONT}">${esc(value)}<tspan fill="${COLORS.textMuted}" font-size="10">${esc(unit)}</tspan>${trendIcon ? `<tspan fill="${trendColor}" font-size="12"> ${trendIcon}</tspan>` : ''}</text>`;
};

const progressBar = (x, y, w, pct, color, label = '') => `
  <rect x="${x}" y="${y}" width="${w}" height="8" rx="4" fill="${COLORS.bgElevated}"/>
  <rect x="${x}" y="${y}" width="${w * Math.min(pct, 100) / 100}" height="8" rx="4" fill="${color}"/>
  ${label ? `<text x="${x + w + 10}" y="${y + 7}" fill="${COLORS.textMuted}" font-size="10" font-family="${FONT}">${esc(label)}</text>` : ''}`;

const codePanel = (x, y, w, h, lines = [], title = 'code.ts') => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${COLORS.bgCard}" stroke="${COLORS.border}"/>
  <rect x="${x}" y="${y}" width="${w}" height="24" rx="8" fill="${COLORS.bgElevated}"/>
  <circle cx="${x + 14}" cy="${y + 12}" r="5" fill="${COLORS.red}" opacity="0.8"/>
  <circle cx="${x + 30}" cy="${y + 12}" r="5" fill="${COLORS.orange}" opacity="0.8"/>
  <circle cx="${x + 46}" cy="${y + 12}" r="5" fill="${COLORS.green}" opacity="0.8"/>
  <text x="${x + w/2}" y="${y + 16}" text-anchor="middle" fill="${COLORS.textDim}" font-size="10" font-family="${FONT}">${esc(title)}</text>
  ${lines.slice(0, Math.floor((h - 32) / 15)).map((l, i) => 
    `<text x="${x + 12}" y="${y + 42 + i * 15}" fill="${l.highlight ? COLORS.cyan : COLORS.text}" font-size="11" font-family="${FONT}">${esc(l.text)}</text>`
  ).join('')}`;

const terminalPanel = (x, y, w, h, lines = []) => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${COLORS.bg}" stroke="${COLORS.green}" stroke-width="1.5"/>
  <rect x="${x}" y="${y}" width="${w}" height="22" rx="8" fill="${COLORS.green}" opacity="0.15"/>
  ${icon('terminal', x + 16, y + 11, 14, COLORS.green)}
  <text x="${x + 30}" y="${y + 15}" fill="${COLORS.green}" font-size="10" font-family="${FONT}">terminal</text>
  ${lines.slice(0, Math.floor((h - 30) / 15)).map((l, i) => {
    const col = { command: COLORS.text, success: COLORS.green, error: COLORS.red, info: COLORS.cyan }[l.type] || COLORS.text;
    return `<text x="${x + 12}" y="${y + 38 + i * 15}" fill="${col}" font-size="11" font-family="${FONT}">${esc(l.text)}</text>`;
  }).join('')}`;

const connection = (x1, y1, x2, y2, color, label = '') => {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const lw = label ? label.length * 7 + 16 : 0;
  const d1 = (1.8 + Math.random() * 0.5).toFixed(1);
  const d2 = (2.2 + Math.random() * 0.5).toFixed(1);
  return `
  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" opacity="0.3"/>
  <circle r="3" fill="${color}">
    <animate attributeName="cx" values="${x1};${x2}" dur="${d1}s" repeatCount="indefinite"/>
    <animate attributeName="cy" values="${y1};${y2}" dur="${d1}s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0;1;1;0" dur="${d1}s" repeatCount="indefinite"/>
  </circle>
  <circle r="2" fill="${color}" opacity="0.6">
    <animate attributeName="cx" values="${x1};${x2}" dur="${d2}s" begin="0.6s" repeatCount="indefinite"/>
    <animate attributeName="cy" values="${y1};${y2}" dur="${d2}s" begin="0.6s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0;0.7;0.7;0" dur="${d2}s" begin="0.6s" repeatCount="indefinite"/>
  </circle>
  ${label ? `<rect x="${mx - lw/2}" y="${my - 10}" width="${lw}" height="20" rx="4" fill="${COLORS.bgCard}" stroke="${color}"/><text x="${mx}" y="${my + 4}" text-anchor="middle" fill="${color}" font-size="10" font-family="${FONT}">${esc(label)}</text>` : ''}`;
};

const gear = (x, y, size, color) => `
  <g transform="translate(${x}, ${y})">
    <g>${icon('cog', 0, 0, size, color)}<animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="10s" repeatCount="indefinite"/></g>
  </g>`;

const bottomLabel = (text, color = COLORS.textMuted) => {
  const w = text.length * 7.5 + 24;
  return `
  <rect x="${W/2 - w/2}" y="${H - 32}" width="${w}" height="26" rx="6" fill="${COLORS.bgCard}" stroke="${COLORS.border}"/>
  <text x="${W/2}" y="${H - 14}" text-anchor="middle" fill="${color}" font-size="12" font-family="${FONT}">${esc(text)}</text>`;
};


// ============== STRICT GRID LAYOUT RENDERER ==============

/**
 * Fixed grid positions - NO OVERLAPS POSSIBLE
 * Canvas: 700x380
 * 
 * ROW 1 (y=30-95):  [Metric1] [Metric2] [Metric3] ... [Icon]
 * ROW 2 (y=110-200): [CodePanel OR Terminal] ... [StatusIcon]
 * ROW 3 (y=210-280): [Badge1] [Badge2] [Badge3] [Badge4]
 * ROW 4 (y=290-340): [Status1] [Status2] [Status3] ... [Gear]
 * BOTTOM (y=348):   [Label]
 */

const GRID = {
  // Row 1: Metrics (y=30)
  metric1: { x: 20, y: 30 },
  metric2: { x: 125, y: 30 },
  metric3: { x: 230, y: 30 },
  topIcon: { x: 600, y: 60 },
  
  // Row 2: Panels (y=100)
  codePanel: { x: 20, y: 100, w: 200, h: 95 },
  terminal: { x: 240, y: 100, w: 200, h: 95 },
  statusIcon: { x: 530, y: 140 },
  
  // Row 3: Badges (y=220) - evenly spaced
  badge1: { x: 100, y: 220 },
  badge2: { x: 260, y: 220 },
  badge3: { x: 420, y: 220 },
  badge4: { x: 580, y: 220 },
  
  // Row 4: Status pills (y=295)
  status1: { x: 20, y: 295 },
  status2: { x: 180, y: 295 },
  status3: { x: 340, y: 295 },
  gear: { x: 640, y: 310 },
};

/**
 * Render scene with STRICT grid positioning
 */
function renderScene(spec) {
  const color = COLORS[spec.primaryColor] || COLORS.blue;
  const parts = [];
  const el = spec.elements || {};
  
  // Determine layout mode based on what elements exist
  const hasCode = el.codePanel?.show && el.codePanel.lines?.length;
  const hasTerminal = el.terminal?.show && el.terminal.lines?.length;
  const hasMetrics = el.metrics?.length > 0;
  
  // === ROW 1: Metrics OR Code+Terminal header area ===
  if (hasMetrics && !hasCode && !hasTerminal) {
    // Show up to 3 metrics in row 1
    el.metrics.slice(0, 3).forEach((m, i) => {
      const pos = [GRID.metric1, GRID.metric2, GRID.metric3][i];
      const iconMap = { latency: 'clock', requests: 'activity', errors: 'alertCircle', cpu: 'cpu', memory: 'memory', uptime: 'checkCircle', coverage: 'target', fps: 'gauge' };
      const iconName = iconMap[m.label?.toLowerCase()] || 'gauge';
      parts.push(metricCard(pos.x, pos.y, iconName, m.label || '', m.value || '0', m.unit || '', color, m.trend));
    });
  }
  
  // === ROW 2: Code Panel and/or Terminal ===
  if (hasCode) {
    const lines = el.codePanel.lines.slice(0, 5).map(l => ({
      text: String(l.text || '').substring(0, 28),
      highlight: l.highlight
    }));
    parts.push(codePanel(GRID.codePanel.x, GRID.codePanel.y, GRID.codePanel.w, GRID.codePanel.h, lines, el.codePanel.title || 'code.ts'));
  }
  
  if (hasTerminal) {
    const termX = hasCode ? GRID.terminal.x : GRID.codePanel.x;
    const lines = el.terminal.lines.slice(0, 5).map(l => ({
      text: String(l.text || '').substring(0, 30),
      type: l.type || 'info'
    }));
    parts.push(terminalPanel(termX, GRID.terminal.y, GRID.terminal.w, GRID.terminal.h, lines));
  }
  
  // If we have code/terminal, show metrics smaller on the right
  if ((hasCode || hasTerminal) && hasMetrics) {
    el.metrics.slice(0, 2).forEach((m, i) => {
      const x = 470 + i * 110;
      const iconMap = { latency: 'clock', requests: 'activity', errors: 'alertCircle', cpu: 'cpu', memory: 'memory', uptime: 'checkCircle' };
      const iconName = iconMap[m.label?.toLowerCase()] || 'gauge';
      parts.push(metricCard(x, 30, iconName, m.label || '', m.value || '0', m.unit || '', color, m.trend));
    });
  }
  
  // Central status icon (top right area)
  const sceneIcons = {
    debugging: 'bug', deployment: 'rocket', scaling: 'network', database: 'database',
    security: 'shieldCheck', performance: 'zap', testing: 'target', success: 'checkCircle',
    error: 'xCircle', mobile: 'smartphone', frontend: 'globe', api: 'send',
    monitoring: 'eye', architecture: 'layers'
  };
  const centralIcon = sceneIcons[spec.sceneType] || 'box';
  
  // Only show top icon if no code/terminal panels
  if (!hasCode && !hasTerminal) {
    parts.push(iconCircle(centralIcon, GRID.topIcon.x, GRID.topIcon.y, 45, color));
  }
  
  // === ROW 3: Badges (servers, databases, clouds) ===
  const allBadges = [];
  
  if (el.servers?.length) {
    el.servers.forEach(s => {
      const statusColor = { ok: COLORS.green, warn: COLORS.orange, error: COLORS.red }[s.status] || COLORS.blue;
      allBadges.push({ icon: 'server', label: String(s.label || 'Server').substring(0, 12), color: statusColor });
    });
  }
  if (el.databases?.length) {
    el.databases.forEach(d => {
      allBadges.push({ icon: 'database', label: String(d.label || 'Database').substring(0, 12), color: COLORS.purple });
    });
  }
  if (el.clouds?.length) {
    el.clouds.forEach(c => {
      allBadges.push({ icon: 'cloud', label: String(c.label || 'Cloud').substring(0, 12), color: COLORS.cyan });
    });
  }
  
  // Place up to 4 badges in fixed positions
  const badgePositions = [GRID.badge1, GRID.badge2, GRID.badge3, GRID.badge4];
  allBadges.slice(0, 4).forEach((b, i) => {
    parts.push(badge(b.icon, badgePositions[i].x, badgePositions[i].y, b.label, b.color));
  });
  
  // Connections between badges (only if we have 2+ badges)
  if (allBadges.length >= 2 && el.connections?.length) {
    el.connections.slice(0, 2).forEach((c, i) => {
      const fromIdx = Math.min(i, allBadges.length - 2);
      const toIdx = Math.min(i + 1, allBadges.length - 1);
      const fromX = badgePositions[fromIdx].x + 40;
      const toX = badgePositions[toIdx].x - 40;
      const label = String(c.label || '').substring(0, 10);
      parts.push(connection(fromX, GRID.badge1.y, toX, GRID.badge1.y, color, label));
    });
  }
  
  // === ROW 4: Status pills (fixed positions) ===
  if (el.statusItems?.length) {
    const statusPositions = [GRID.status1, GRID.status2, GRID.status3];
    el.statusItems.slice(0, 3).forEach((s, i) => {
      const text = String(s.text || '').substring(0, 15);
      parts.push(statusPill(statusPositions[i].x, statusPositions[i].y, s.state || 'info', text));
    });
  }
  
  // Gear icon (bottom right)
  if (el.icons?.some(ic => ic.type === 'gear')) {
    parts.push(gear(GRID.gear.x, GRID.gear.y, 28, color));
  }
  
  // Bottom label
  const labelText = String(spec.bottomLabel || spec.title || 'System Overview').substring(0, 35);
  parts.push(bottomLabel(labelText, color));
  
  return parts.join('\n');
}

// ============== FALLBACK SCENES ==============

const FALLBACK_SCENES = {
  architecture: { sceneType: 'architecture', title: 'System Architecture', primaryColor: 'cyan', bottomLabel: 'System Architecture',
    elements: { metrics: [{ label: 'Services', value: '5', unit: '' }, { label: 'Regions', value: '3', unit: '' }],
      servers: [{ label: 'API', position: 'left', status: 'ok' }], databases: [{ label: 'Database', position: 'center' }],
      clouds: [{ label: 'Cache', position: 'right' }], connections: [{ from: 'left', to: 'center', label: 'query' }],
      statusItems: [{ state: 'ok', text: 'Healthy' }], icons: [{ type: 'gear' }] }},
  
  scaling: { sceneType: 'scaling', title: 'Auto-scaling', primaryColor: 'cyan', bottomLabel: 'Auto-scaling Active',
    elements: { metrics: [{ label: 'RPS', value: '12.4', unit: 'K', trend: 'up' }, { label: 'Nodes', value: '5', unit: '' }],
      servers: [{ label: 'pod-1', position: 'left', status: 'ok' }, { label: 'pod-2', position: 'center', status: 'ok' }, { label: 'pod-3', position: 'right', status: 'warn' }],
      statusItems: [{ state: 'ok', text: 'Scaling' }, { state: 'info', text: 'CPU: 72%' }], icons: [{ type: 'gear' }] }},
  
  database: { sceneType: 'database', title: 'Database Cluster', primaryColor: 'purple', bottomLabel: 'PostgreSQL Cluster',
    elements: { metrics: [{ label: 'QPS', value: '2.3', unit: 'K' }, { label: 'Latency', value: '4.2', unit: 'ms' }],
      databases: [{ label: 'Primary', position: 'left' }, { label: 'Replica', position: 'right' }],
      connections: [{ from: 'left', to: 'right', label: 'sync' }],
      statusItems: [{ state: 'ok', text: 'Replication OK' }], icons: [{ type: 'gear' }] }},
  
  deployment: { sceneType: 'deployment', title: 'CI/CD Pipeline', primaryColor: 'green', bottomLabel: 'Production Ready',
    elements: { metrics: [{ label: 'Deploy', value: '2.3', unit: 'min' }],
      codePanel: { show: true, lines: [{ text: 'name: deploy' }, { text: 'on: [push]' }, { text: 'jobs: build' }], title: 'ci.yml' },
      servers: [{ label: 'Build', position: 'left', status: 'ok' }, { label: 'Prod', position: 'right', status: 'ok' }],
      connections: [{ from: 'left', to: 'right', label: 'deploy' }],
      statusItems: [{ state: 'ok', text: 'Pipeline passed' }], icons: [{ type: 'checkmark' }] }},
  
  security: { sceneType: 'security', title: 'Security', primaryColor: 'green', bottomLabel: 'Zero Trust Architecture',
    elements: { metrics: [{ label: 'Blocked', value: '847', unit: '' }, { label: 'Auth', value: '99.2', unit: '%' }],
      clouds: [{ label: 'Internet', position: 'left' }], servers: [{ label: 'Gateway', position: 'center', status: 'ok' }, { label: 'API', position: 'right', status: 'ok' }],
      connections: [{ from: 'left', to: 'center', label: 'HTTPS' }, { from: 'center', to: 'right', label: 'mTLS' }],
      statusItems: [{ state: 'ok', text: 'SSL/TLS' }, { state: 'ok', text: 'WAF active' }], icons: [{ type: 'shield' }] }},
  
  monitoring: { sceneType: 'monitoring', title: 'Observability', primaryColor: 'purple', bottomLabel: 'Observability Dashboard',
    elements: { metrics: [{ label: 'Uptime', value: '99.99', unit: '%' }, { label: 'Alerts', value: '0', unit: '' }, { label: 'P95', value: '23', unit: 'ms' }],
      terminal: { show: true, lines: [{ text: '$ kubectl top pods', type: 'command' }, { text: 'api-1  45%  1.2G', type: 'success' }] },
      statusItems: [{ state: 'ok', text: 'All healthy' }, { state: 'info', text: 'Auto-scale' }], icons: [{ type: 'gear' }] }},
  
  debugging: { sceneType: 'debugging', title: 'Debug Session', primaryColor: 'orange', bottomLabel: 'Debug Session Active',
    elements: { metrics: [{ label: 'Errors', value: '23', unit: '/hr' }, { label: 'MTTR', value: '4.2', unit: 'min' }],
      codePanel: { show: true, lines: [{ text: 'try {' }, { text: '  await fetch(url);', highlight: true }, { text: '} catch (err) {' }], title: 'debug.ts' },
      terminal: { show: true, lines: [{ text: 'TypeError: undefined', type: 'error' }, { text: 'at line 4', type: 'info' }] },
      statusItems: [{ state: 'error', text: 'Memory leak' }, { state: 'warn', text: 'High CPU' }], icons: [{ type: 'gear' }] }},
  
  testing: { sceneType: 'testing', title: 'Test Results', primaryColor: 'blue', bottomLabel: 'Test Suite Results',
    elements: { metrics: [{ label: 'Coverage', value: '87', unit: '%' }, { label: 'Passed', value: '141', unit: '' }, { label: 'Failed', value: '1', unit: '' }],
      codePanel: { show: true, lines: [{ text: 'describe("API")' }, { text: '  it("returns 200")' }, { text: '    expect(status)' }], title: 'api.test.ts' },
      statusItems: [{ state: 'ok', text: 'Unit tests' }, { state: 'warn', text: '1 failing' }], icons: [{ type: 'checkmark' }] }},
  
  api: { sceneType: 'api', title: 'API Gateway', primaryColor: 'blue', bottomLabel: 'API Gateway Architecture',
    elements: { metrics: [{ label: 'RPS', value: '8.4', unit: 'K' }, { label: 'P99', value: '45', unit: 'ms' }],
      codePanel: { show: true, lines: [{ text: 'GET /api/v2/users' }, { text: 'Authorization: Bearer' }, { text: '→ 200 OK (12ms)', highlight: true }], title: 'request.http' },
      servers: [{ label: 'Gateway', position: 'left', status: 'ok' }, { label: 'API', position: 'right', status: 'ok' }],
      connections: [{ from: 'left', to: 'right', label: 'REST' }],
      statusItems: [{ state: 'ok', text: 'Rate limit OK' }], icons: [{ type: 'gear' }] }},
  
  performance: { sceneType: 'performance', title: 'Performance', primaryColor: 'orange', bottomLabel: 'Performance Optimization',
    elements: { metrics: [{ label: 'P99', value: '23', unit: 'ms', trend: 'down' }, { label: 'RPS', value: '45', unit: 'K', trend: 'up' }],
      terminal: { show: true, lines: [{ text: '$ flame-graph analyze', type: 'command' }, { text: 'Hotspot: db.query()', type: 'error' }, { text: '✓ -65% latency', type: 'success' }] },
      statusItems: [{ state: 'ok', text: 'Optimized' }, { state: 'info', text: 'Cached' }], icons: [{ type: 'lightning' }] }},
  
  frontend: { sceneType: 'frontend', title: 'Frontend', primaryColor: 'cyan', bottomLabel: 'Frontend Performance',
    elements: { metrics: [{ label: 'LCP', value: '1.2', unit: 's' }, { label: 'FID', value: '45', unit: 'ms' }, { label: 'CLS', value: '0.02', unit: '' }],
      codePanel: { show: true, lines: [{ text: 'const App = () => {' }, { text: '  return <List />;' }, { text: '}' }], title: 'App.tsx' },
      statusItems: [{ state: 'ok', text: 'Core Web Vitals' }, { state: 'ok', text: 'Lighthouse: 98' }], icons: [{ type: 'checkmark' }] }},
  
  mobile: { sceneType: 'mobile', title: 'Mobile', primaryColor: 'cyan', bottomLabel: 'Mobile Performance',
    elements: { metrics: [{ label: 'FPS', value: '60', unit: '' }, { label: 'Memory', value: '42', unit: 'MB' }],
      codePanel: { show: true, lines: [{ text: 'func tableView(_ tv:' }, { text: '  cellForRowAt idx)' }, { text: '  { return cell }' }], title: 'TableVC.swift' },
      statusItems: [{ state: 'ok', text: 'Buttery smooth' }, { state: 'info', text: 'iOS + Android' }], icons: [{ type: 'checkmark' }] }},
  
  success: { sceneType: 'success', title: 'Success', primaryColor: 'green', bottomLabel: 'Deployment Successful',
    elements: { metrics: [{ label: 'Uptime', value: '100', unit: '%' }, { label: 'Users', value: '12.4', unit: 'K', trend: 'up' }],
      servers: [{ label: 'Production', position: 'left', status: 'ok' }], clouds: [{ label: 'CDN', position: 'right' }],
      connections: [{ from: 'left', to: 'right', label: 'cached' }],
      statusItems: [{ state: 'ok', text: 'All systems go' }, { state: 'ok', text: 'Zero downtime' }], icons: [{ type: 'checkmark' }] }},
  
  error: { sceneType: 'error', title: 'Incident', primaryColor: 'red', bottomLabel: 'Incident: Service Down',
    elements: { metrics: [{ label: 'Status', value: '503', unit: '' }, { label: 'Errors', value: '2.3', unit: 'K' }],
      terminal: { show: true, lines: [{ text: '$ kubectl logs pod', type: 'command' }, { text: 'ERROR: OOMKilled', type: 'error' }] },
      servers: [{ label: 'prod-1', position: 'left', status: 'error' }, { label: 'prod-2', position: 'right', status: 'warn' }],
      statusItems: [{ state: 'error', text: 'Service down' }, { state: 'error', text: 'OOM killed' }], icons: [{ type: 'xmark' }] }},
  
  default: { sceneType: 'default', title: 'System Overview', primaryColor: 'cyan', bottomLabel: 'System Overview',
    elements: { metrics: [{ label: 'Requests', value: '8.2', unit: 'K/s' }, { label: 'Latency', value: '12', unit: 'ms' }],
      servers: [{ label: 'API', position: 'left', status: 'ok' }], databases: [{ label: 'Database', position: 'right' }],
      connections: [{ from: 'left', to: 'right', label: 'query' }],
      statusItems: [{ state: 'ok', text: 'All healthy' }], icons: [{ type: 'gear' }] }}
};


// ============== SVG GENERATION ==============

function generateSVG(sceneSpec) {
  const content = renderScene(sceneSpec);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${COLORS.bg}"/>
      <stop offset="100%" style="stop-color:#161b22"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
  <g filter="url(#glow)">${content}</g>
</svg>`;
}

async function ensureImagesDir() {
  try {
    await fs.promises.mkdir(IMAGES_DIR, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

// ============== KEYWORD-BASED SCENE DETECTION (Fallback) ==============

const KEYWORDS = {
  debugging: ['debug', 'bug', 'error', 'fix', 'issue', 'trace', 'breakpoint', 'crash', 'exception'],
  deployment: ['deploy', 'ci', 'cd', 'pipeline', 'release', 'ship', 'production', 'staging', 'github actions'],
  scaling: ['scale', 'load', 'traffic', 'kubernetes', 'k8s', 'container', 'docker', 'cluster', 'replicas'],
  database: ['database', 'sql', 'postgres', 'mysql', 'mongo', 'query', 'migration', 'schema', 'orm'],
  security: ['security', 'auth', 'authentication', 'jwt', 'oauth', 'encrypt', 'ssl', 'tls', 'firewall'],
  performance: ['performance', 'optimize', 'speed', 'latency', 'cache', 'profil', 'benchmark', 'bottleneck'],
  testing: ['test', 'jest', 'vitest', 'playwright', 'cypress', 'coverage', 'unit', 'integration', 'e2e'],
  success: ['success', 'complete', 'done', 'achieve', 'launch', 'milestone', 'shipped'],
  error: ['fail', 'crash', 'down', 'outage', 'incident', '500', '503', 'timeout', 'oom'],
  mobile: ['mobile', 'ios', 'android', 'swift', 'kotlin', 'react native', 'flutter'],
  frontend: ['frontend', 'react', 'vue', 'angular', 'svelte', 'css', 'tailwind', 'component', 'ui'],
  api: ['api', 'rest', 'graphql', 'endpoint', 'gateway', 'microservice', 'grpc', 'webhook'],
  monitoring: ['monitor', 'observ', 'metric', 'log', 'alert', 'grafana', 'datadog', 'prometheus'],
  architecture: ['architecture', 'design', 'pattern', 'system', 'infrastructure', 'diagram', 'flow'],
};

function detectSceneType(title, content = '') {
  const text = `${title} ${content}`.toLowerCase();
  let bestScene = 'default';
  let bestScore = 0;

  for (const [scene, keywords] of Object.entries(KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) {
        score += title.toLowerCase().includes(kw) ? 3 : 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestScene = scene;
    }
  }
  return bestScene;
}

// ============== MAIN EXPORTS ==============

/**
 * Generate illustration using AI to create dynamic scene specification
 * @param {string} title - Blog post title
 * @param {string} content - Blog post content
 * @param {string} filename - Output filename (optional)
 * @param {object} options - Additional options (placement, channel, realWorldExample)
 * @returns {Promise<{path: string, scene: string, aiGenerated: boolean}>}
 */
export async function generateIllustration(title, content = '', filename = null, options = {}) {
  await ensureImagesDir();
  
  let sceneSpec;
  let aiGenerated = false;
  
  try {
    // Use AI to generate scene specification
    console.log(`🤖 Generating AI scene for: ${title.substring(0, 50)}...`);
    
    const aiResult = await ai.run('illustrationScene', {
      title,
      content: content.substring(0, 2000),
      placement: options.placement || 'after-intro',
      channel: options.channel || 'general',
      realWorldExample: options.realWorldExample
    }, { cache: true });
    
    if (aiResult && aiResult.sceneType) {
      sceneSpec = aiResult;
      aiGenerated = true;
      console.log(`✓ AI generated scene: ${sceneSpec.sceneType} (${sceneSpec.primaryColor})`);
    } else {
      throw new Error('Invalid AI response');
    }
  } catch (err) {
    // Fallback to keyword-based detection
    console.log(`⚠️ AI scene generation failed: ${err.message}`);
    console.log(`↳ Using keyword-based fallback...`);
    
    const sceneType = detectSceneType(title, content);
    sceneSpec = FALLBACK_SCENES[sceneType] || FALLBACK_SCENES.default;
    console.log(`✓ Fallback scene: ${sceneSpec.sceneType}`);
  }
  
  const svg = generateSVG(sceneSpec);
  
  const hash = crypto.createHash('md5').update(title).digest('hex').slice(0, 8);
  const outputFilename = filename || `img-${hash}`;
  const outputPath = path.join(IMAGES_DIR, `${outputFilename}.svg`);
  
  await fs.promises.writeFile(outputPath, svg, 'utf-8');
  
  return {
    path: outputPath,
    scene: sceneSpec.sceneType,
    filename: `${outputFilename}.svg`,
    aiGenerated
  };
}

/**
 * Generate illustrations for multiple blog posts
 */
export async function generateBlogIllustrations(posts) {
  await ensureImagesDir();
  const results = [];
  
  for (const post of posts) {
    try {
      const result = await generateIllustration(
        post.title,
        post.content || '',
        `img-${post.slug}`,
        { placement: post.placement, channel: post.channel, realWorldExample: post.realWorldExample }
      );
      results.push({ slug: post.slug, ...result });
      console.log(`✓ Generated: ${result.filename} (${result.scene}, AI: ${result.aiGenerated})`);
    } catch (err) {
      console.error(`✗ Failed for ${post.slug}: ${err.message}`);
      results.push({ slug: post.slug, error: err.message });
    }
  }
  return results;
}

/**
 * Generate a specific scene by name (for testing/preview)
 */
export function generateSceneSVG(sceneName) {
  const spec = FALLBACK_SCENES[sceneName] || FALLBACK_SCENES.default;
  return generateSVG(spec);
}

/**
 * Get available scene types
 */
export function getAvailableScenes() {
  return Object.keys(FALLBACK_SCENES);
}

/**
 * Detect scene type from content (keyword-based)
 */
export { detectSceneType as detectScene };

export default {
  generateIllustration,
  generateBlogIllustrations,
  generateSceneSVG,
  getAvailableScenes,
  detectScene: detectSceneType,
};
