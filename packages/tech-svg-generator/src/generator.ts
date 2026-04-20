/**
 * Main SVG generator
 */

import { SCENES } from './scenes.js';
import { getTheme } from './themes.js';
import type { SceneType, GenerateOptions, GenerateResult } from './types.js';

/**
 * Keywords for automatic scene detection
 */
const KEYWORDS: Record<SceneType, string[]> = {
  architecture: ['architecture', 'design', 'pattern', 'system', 'infrastructure', 'microservice', 'distributed'],
  scaling: ['scale', 'load', 'traffic', 'kubernetes', 'k8s', 'container', 'docker', 'cluster', 'replicas', 'horizontal', 'auto-scaling'],
  database: ['database', 'sql', 'postgres', 'mysql', 'mongo', 'query', 'migration', 'schema', 'orm', 'redis', 'cache', 'replication'],
  deployment: ['deploy', 'ci', 'cd', 'pipeline', 'release', 'ship', 'production', 'staging', 'github actions', 'jenkins', 'devops'],
  security: ['security', 'auth', 'authentication', 'jwt', 'oauth', 'encrypt', 'ssl', 'tls', 'firewall', 'vulnerability', 'zero trust'],
  debugging: ['debug', 'bug', 'error', 'fix', 'issue', 'trace', 'breakpoint', 'crash', 'exception', 'troubleshoot', 'root cause'],
  testing: ['test', 'jest', 'vitest', 'playwright', 'cypress', 'coverage', 'unit', 'integration', 'e2e', 'tdd', 'mock'],
  performance: ['performance', 'optimize', 'speed', 'latency', 'cache', 'profil', 'benchmark', 'bottleneck', 'memory', 'cpu'],
  api: ['api', 'rest', 'graphql', 'endpoint', 'gateway', 'grpc', 'webhook', 'http', 'request', 'response'],
  monitoring: ['monitor', 'observ', 'metric', 'log', 'alert', 'grafana', 'datadog', 'prometheus', 'dashboard', 'trace'],
  frontend: ['frontend', 'react', 'vue', 'angular', 'svelte', 'css', 'tailwind', 'component', 'ui', 'web vitals', 'lcp', 'fid'],
  success: ['success', 'complete', 'done', 'achieve', 'launch', 'milestone', 'shipped', 'celebrate', 'win'],
  error: ['fail', 'crash', 'down', 'outage', 'incident', '500', '503', 'timeout', 'oom', 'killed', 'alert'],
  default: [],
};

/**
 * Detect the best scene type based on title and content keywords
 */
export function detectScene(title: string, content: string = ''): SceneType {
  const text = `${title} ${content}`.toLowerCase();
  let best: SceneType = 'default';
  let score = 0;

  for (const [scene, keywords] of Object.entries(KEYWORDS)) {
    if (scene === 'default') continue;
    
    let s = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) {
        s += title.toLowerCase().includes(kw) ? 3 : 1;
      }
    }
    if (s > score) {
      score = s;
      best = scene as SceneType;
    }
  }
  
  return best;
}

/**
 * Get list of available scene types
 */
export function getAvailableScenes(): SceneType[] {
  return Object.keys(SCENES) as SceneType[];
}

/**
 * Generate an SVG illustration
 */
export function generateSVG(
  title: string,
  content: string = '',
  options: GenerateOptions = {}
): GenerateResult {
  const {
    width = 700,
    height = 420,
    theme: themeName,
    scene: forcedScene,
  } = options;

  const theme = getTheme(themeName);
  const colors = theme.colors;
  const sceneType = forcedScene || detectScene(title, content);
  const sceneRenderer = SCENES[sceneType] || SCENES.default;
  const sceneContent = sceneRenderer(title, colors, width, height);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.bg}"/>
      <stop offset="100%" stop-color="${colors.card}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  ${sceneContent}
</svg>`;

  return {
    svg,
    scene: sceneType,
    width,
    height,
  };
}

/**
 * Generate an illustration and return as a complete result object
 */
export function generateIllustration(
  title: string,
  content: string = '',
  options: GenerateOptions = {}
): GenerateResult {
  return generateSVG(title, content, options);
}
