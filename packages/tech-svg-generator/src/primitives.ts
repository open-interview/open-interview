/**
 * SVG primitive components for building illustrations
 */

import { ICONS } from './icons.js';
import type { ThemeColors, CodeLine, TerminalLine } from './types.js';

const FONT = "'SF Mono', Menlo, Monaco, 'Courier New', monospace";

/**
 * Escape HTML entities
 */
export function escapeHtml(text: string | null | undefined): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Render an icon at position
 */
export function icon(
  name: string,
  x: number,
  y: number,
  size: number = 24,
  color: string
): string {
  const path = ICONS[name];
  if (!path) return '';
  const scale = size / 24;
  return `<g transform="translate(${x - size / 2}, ${y - size / 2}) scale(${scale})">
    <path d="${path}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

/**
 * Card with icon and label
 */
export function card(
  x: number,
  y: number,
  w: number,
  h: number,
  iconName: string,
  label: string,
  colors: ThemeColors,
  accentColor?: string,
  sublabel?: string
): string {
  const color = accentColor || colors.blue;
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${colors.card}" stroke="${color}" stroke-width="2"/>
  ${icon(iconName, x + w / 2, y + h / 2 - (sublabel ? 8 : 0), Math.min(w, h) * 0.35, color)}
  <text x="${x + w / 2}" y="${y + h - 16}" text-anchor="middle" fill="${colors.text}" font-size="12" font-family="${FONT}">${escapeHtml(label.substring(0, 12))}</text>
  ${sublabel ? `<text x="${x + w / 2}" y="${y + h - 4}" text-anchor="middle" fill="${colors.muted}" font-size="10" font-family="${FONT}">${escapeHtml(sublabel.substring(0, 15))}</text>` : ''}
`;
}

/**
 * Metric display box
 */
export function metric(
  x: number,
  y: number,
  label: string,
  value: string,
  colors: ThemeColors,
  unit: string = '',
  accentColor?: string
): string {
  const color = accentColor || colors.blue;
  return `
  <rect x="${x}" y="${y}" width="110" height="60" rx="8" fill="${colors.card}" stroke="${colors.border}"/>
  <text x="${x + 55}" y="${y + 22}" text-anchor="middle" fill="${colors.muted}" font-size="11" font-family="${FONT}">${escapeHtml(label.substring(0, 12))}</text>
  <text x="${x + 55}" y="${y + 46}" text-anchor="middle" fill="${color}" font-size="18" font-family="${FONT}">${escapeHtml(value)}<tspan fill="${colors.muted}" font-size="11">${escapeHtml(unit)}</tspan></text>
`;
}

/**
 * Status indicator with text
 */
export function status(
  x: number,
  y: number,
  state: 'ok' | 'warn' | 'error' | 'info',
  text: string,
  colors: ThemeColors
): string {
  const stateColors: Record<string, string> = {
    ok: colors.green,
    warn: colors.orange,
    error: colors.red,
    info: colors.cyan,
  };
  const color = stateColors[state] || colors.muted;
  return `
  <circle cx="${x}" cy="${y}" r="6" fill="${color}"/>
  <text x="${x + 14}" y="${y + 4}" fill="${colors.text}" font-size="11" font-family="${FONT}">${escapeHtml(text.substring(0, 30))}</text>`;
}

/**
 * Arrow connector between points
 */
export function arrow(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  label: string = '',
  dashed: boolean = false,
  colors?: ThemeColors
): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dash = dashed ? 'stroke-dasharray="6 4"' : '';
  const markerId = `ah${x1}${y1}${x2}${y2}`;
  const cardBg = colors?.card || '#161b22';
  const mutedColor = colors?.muted || '#8b949e';
  
  return `
  <defs><marker id="${markerId}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
    <path d="M0,0 L8,4 L0,8 Z" fill="${color}"/>
  </marker></defs>
  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2" ${dash} marker-end="url(#${markerId})"/>
  ${label ? `<rect x="${mx - 25}" y="${my - 10}" width="50" height="20" rx="4" fill="${cardBg}"/>
  <text x="${mx}" y="${my + 4}" text-anchor="middle" fill="${mutedColor}" font-size="10" font-family="${FONT}">${escapeHtml(label.substring(0, 8))}</text>` : ''}`;
}

/**
 * Code snippet block
 */
export function codeSnippet(
  x: number,
  y: number,
  w: number,
  h: number,
  lines: CodeLine[],
  colors: ThemeColors,
  title: string = 'code.ts'
): string {
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${colors.elevated}" stroke="${colors.border}"/>
  <rect x="${x}" y="${y}" width="${w}" height="28" rx="8" fill="${colors.card}"/>
  <circle cx="${x + 16}" cy="${y + 14}" r="5" fill="${colors.red}" opacity="0.8"/>
  <circle cx="${x + 32}" cy="${y + 14}" r="5" fill="${colors.orange}" opacity="0.8"/>
  <circle cx="${x + 48}" cy="${y + 14}" r="5" fill="${colors.green}" opacity="0.8"/>
  <text x="${x + w / 2}" y="${y + 18}" text-anchor="middle" fill="${colors.dim}" font-size="10" font-family="${FONT}">${escapeHtml(title.substring(0, 20))}</text>
  ${lines.slice(0, 5).map((l, i) => `<text x="${x + 12}" y="${y + 48 + i * 18}" fill="${l.hl ? colors.cyan : colors.text}" font-size="11" font-family="${FONT}">${escapeHtml(l.t.substring(0, 32))}</text>`).join('')}
`;
}

/**
 * Terminal block
 */
export function terminalBlock(
  x: number,
  y: number,
  w: number,
  h: number,
  lines: TerminalLine[],
  colors: ThemeColors
): string {
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${colors.bg}" stroke="${colors.green}"/>
  <text x="${x + 12}" y="${y + 20}" fill="${colors.green}" font-size="11" font-family="${FONT}">$ terminal</text>
  ${lines.slice(0, 4).map((l, i) => {
    const col = l.err ? colors.red : l.ok ? colors.green : colors.text;
    return `<text x="${x + 12}" y="${y + 44 + i * 18}" fill="${col}" font-size="11" font-family="${FONT}">${escapeHtml(l.t.substring(0, 35))}</text>`;
  }).join('')}
`;
}

/**
 * Title bar at bottom with multi-line support
 */
export function titleBar(
  text: string,
  width: number,
  height: number,
  colors: ThemeColors
): string {
  const maxCharsPerLine = 60;
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  // Limit to 2 lines max
  if (lines.length > 2) {
    lines[1] = lines[1].substring(0, maxCharsPerLine - 3) + '...';
    lines.length = 2;
  }

  const boxHeight = lines.length === 1 ? 36 : 50;
  const startY = height - boxHeight - 8;

  return `
  <rect x="30" y="${startY}" width="${width - 60}" height="${boxHeight}" rx="8" fill="${colors.card}" stroke="${colors.border}"/>
  ${lines.map((line, i) => `<text x="${width / 2}" y="${startY + 22 + i * 16}" text-anchor="middle" fill="${colors.text}" font-size="11" font-family="${FONT}">${escapeHtml(line)}</text>`).join('')}`;
}
