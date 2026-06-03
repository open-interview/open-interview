/**
 * Unified SVG Generation Integration
 * Integrates all SVG generators + AI + new skills into a single pipeline
 * for blog posts.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as d3 from 'd3';
import rough from 'roughjs';

const IMAGES_DIR = 'blog-output/images';

// Scene type definitions for intelligent generator selection
const SCENE_PROFILES = {
  architecture: { generators: ['d3', 'modern', 'rough', 'blog'], keywords: ['architecture', 'system design', 'microservices', 'infrastructure', 'deployment'] },
  scaling: { generators: ['d3', 'modern', 'blog'], keywords: ['scaling', 'load balancer', 'horizontal', 'vertical scaling', 'auto-scaling'] },
  database: { generators: ['d3', 'modern', 'blog'], keywords: ['database', 'sql', 'nosql', 'index', 'query', 'replication', 'sharding'] },
  performance: { generators: ['d3', 'modern', 'pixel', 'blog'], keywords: ['performance', 'latency', 'throughput', 'optimization', 'benchmark'] },
  security: { generators: ['modern', 'pixel', 'blog'], keywords: ['security', 'auth', 'oauth', 'jwt', 'encryption', 'firewall', 'zero trust'] },
  deployment: { generators: ['modern', 'blog'], keywords: ['deployment', 'ci/cd', 'pipeline', 'release', 'rollout', 'canary'] },
  testing: { generators: ['modern', 'blog'], keywords: ['testing', 'test', 'tdd', 'unit test', 'integration test', 'e2e'] },
  debugging: { generators: ['pixel', 'cartoon', 'blog'], keywords: ['debug', 'bug', 'error', 'exception', 'crash', 'issue'] },
  api: { generators: ['d3', 'modern', 'blog'], keywords: ['api', 'rest', 'graphql', 'endpoint', 'request', 'response'] },
  monitoring: { generators: ['d3', 'modern', 'pixel', 'blog'], keywords: ['monitoring', 'observability', 'metrics', 'dashboard', 'alert'] },
  frontend: { generators: ['modern', 'blog'], keywords: ['frontend', 'react', 'ui', 'component', 'css', 'javascript'] },
  collaboration: { generators: ['cartoon', 'pixel', 'modern'], keywords: ['collaboration', 'team', 'agile', 'scrum', 'standup'] },
  coding: { generators: ['pixel', 'cartoon'], keywords: ['coding', 'programming', 'algorithm', 'leetcode', 'code'] },
  interview: { generators: ['cartoon', 'pixel'], keywords: ['interview', 'career', 'job', 'faang', 'preparation'] },
  meeting: { generators: ['cartoon', 'pixel'], keywords: ['meeting', 'standup', 'retro', 'planning'] },
  brainstorming: { generators: ['cartoon', 'pixel'], keywords: ['brainstorm', 'ideas', 'creative', 'design thinking'] },
  success: { generators: ['modern', 'pixel', 'cartoon'], keywords: ['success', 'milestone', 'achievement', 'launch'] },
  cloud: { generators: ['modern', 'd3', 'blog'], keywords: ['cloud', 'aws', 'gcp', 'azure', 'kubernetes', 'docker'] },
  ai: { generators: ['modern', 'pixel'], keywords: ['ai', 'machine learning', 'ml', 'deep learning', 'neural', 'llm', 'gpt'] },
  data: { generators: ['d3', 'modern', 'blog'], keywords: ['data', 'analytics', 'big data', 'pipeline', 'etl', 'streaming'] },
};

// Builder helpers for inline SVG composition
const SVG = {
  viewBox: (w, h) => `viewBox="0 0 ${w} ${h}"`,
  rect: (x, y, w, h, opts = {}) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}"${opts.rx ? ` rx="${opts.rx}"` : ''}${opts.fill ? ` fill="${opts.fill}"` : ''}${opts.stroke ? ` stroke="${opts.stroke}"` : ''}${opts.strokeWidth ? ` stroke-width="${opts.strokeWidth}"` : ''}${opts.class ? ` class="${opts.class}"` : ''}/>`,
  circle: (cx, cy, r, opts = {}) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}"${opts.fill ? ` fill="${opts.fill}"` : ''}${opts.stroke ? ` stroke="${opts.stroke}"` : ''}${opts.strokeWidth ? ` stroke-width="${opts.strokeWidth}"` : ''}/>`,
  text: (x, y, text, opts = {}) =>
    `<text x="${x}" y="${y}"${opts.anchor ? ` text-anchor="${opts.anchor}"` : ''}${opts.fill ? ` fill="${opts.fill}"` : ''}${opts.fontSize ? ` font-size="${opts.fontSize}"` : ''}${opts.fontWeight ? ` font-weight="${opts.fontWeight}"` : ''}${opts.fontFamily ? ` font-family="${opts.fontFamily}"` : ''}>${String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>`,
  path: (d, opts = {}) =>
    `<path d="${d}"${opts.fill ? ` fill="${opts.fill}"` : ' fill="none"'}${opts.stroke ? ` stroke="${opts.stroke}"` : ''}${opts.strokeWidth ? ` stroke-width="${opts.strokeWidth}"` : ''}${opts.strokeLinecap ? ` stroke-linecap="${opts.strokeLinecap}"` : ''}${opts.opacity ? ` opacity="${opts.opacity}"` : ''}/>`,
  group: (content, opts = {}) => {
    const transform = opts.transform ? ` transform="${opts.transform}"` : '';
    return `<g${transform}>\n${content}\n</g>`;
  },
  gradient: (id, stops) => {
    const stopEls = stops.map((s, i) =>
      `<stop offset="${s.offset || (i * 100 / (stops.length - 1)) + '%'}" style="stop-color:${s.color};stop-opacity:${s.opacity || 1}" />`
    ).join('\n    ');
    return `<linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">\n    ${stopEls}\n  </linearGradient>`;
  },
};

// Detect scene type from title and content
function detectScene(title = '', content = '') {
  const text = `${title} ${content}`.toLowerCase();
  let bestScene = 'default';
  let bestScore = 0;

  for (const [scene, profile] of Object.entries(SCENE_PROFILES)) {
    const score = profile.keywords.reduce((acc, kw) => {
      const re = new RegExp(kw.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
      const matches = (text.match(re) || []).length;
      return acc + matches * (title.toLowerCase().includes(kw) ? 3 : 1);
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      bestScene = scene;
    }
  }
  return bestScene;
}

// Select best generator for a scene
function selectGenerators(scene) {
  const profile = SCENE_PROFILES[scene];
  if (!profile) return ['blog'];
  return profile.generators;
}

// ============== D3-BASED GENERATOR ==============

function generateD3SVG(scene, title) {
  const W = 700, H = 480;
  const bgColor = '#0d1117';
  const textColor = '#e6edf3';
  const accentColors = ['#58a6ff', '#a371f7', '#3fb950', '#d29922', '#f85149', '#39c5cf'];

  let svgContent = '';

  if (scene === 'architecture' || scene === 'api') {
    // Layered architecture diagram
    const layers = [
      { label: 'Client Layer', items: ['Web App', 'Mobile', 'API Client'], y: 40, color: accentColors[0] },
      { label: 'API Gateway', items: ['Auth', 'Rate Limit', 'Routing'], y: 150, color: accentColors[1] },
      { label: 'Services', items: ['Service A', 'Service B', 'Service C'], y: 260, color: accentColors[2] },
      { label: 'Data Layer', items: ['Primary DB', 'Cache', 'Queue'], y: 370, color: accentColors[3] },
    ];

    const boxW = 130, boxH = 40, gap = 16;
    const totalW = layers[0].items.length * (boxW + gap) - gap;
    const startX = (W - totalW) / 2;

    for (const layer of layers) {
      const layerW = layer.items.length * (boxW + gap) - gap;
      const lx = (W - layerW) / 2;

      svgContent += SVG.rect(lx - 10, layer.y - 10, layerW + 20, boxH + 40, {
        fill: '#161b22', stroke: '#30363d', rx: '8'
      });

      svgContent += SVG.text(W / 2, layer.y + 16, layer.label, {
        fill: textColor, fontSize: '11', anchor: 'middle', fontFamily: 'monospace'
      });

      for (let i = 0; i < layer.items.length; i++) {
        const ix = lx + i * (boxW + gap);
        svgContent += SVG.rect(ix, layer.y + 26, boxW, boxH, {
          fill: layer.color, rx: '6'
        });
        svgContent += SVG.text(ix + boxW / 2, layer.y + 50, layer.items[i], {
          fill: '#0d1117', fontSize: '11', anchor: 'middle', fontFamily: 'monospace', fontWeight: 'bold'
        });
      }

      // Arrow between layers
      if (layer !== layers[layers.length - 1]) {
        const nextLayer = layers[layers.indexOf(layer) + 1];
        const arrowY = layer.y + boxH + 34;
        svgContent += SVG.line ? '' : ''; // skip, just connect visually
      }
    }
  } else if (scene === 'performance' || scene === 'data') {
    // Chart-style visualization
    const data = [30, 85, 55, 92, 45, 78, 65, 88, 42, 76, 60, 95];
    const chartW = 500, chartH = 250, chartX = 100, chartY = 100;
    const maxVal = Math.max(...data);
    const barW = chartW / data.length - 4;

    svgContent += SVG.rect(chartX - 20, chartY - 30, chartW + 40, chartH + 80, {
      fill: '#161b22', stroke: '#30363d', rx: '12'
    });

    svgContent += SVG.text(chartX + chartW / 2, chartY - 10, 'Performance Metrics', {
      fill: textColor, fontSize: '16', anchor: 'middle', fontFamily: 'monospace', fontWeight: 'bold'
    });

    for (let i = 0; i < data.length; i++) {
      const barH = (data[i] / maxVal) * (chartH - 40);
      const bx = chartX + i * (barW + 4) + 2;
      const by = chartY + chartH - 30 - barH;
      const color = accentColors[i % accentColors.length];

      svgContent += SVG.rect(bx, by, barW, barH, { fill: color, rx: '3', opacity: '0.85' });
    }

    // Y-axis labels
    svgContent += SVG.text(chartX - 8, chartY + chartH - 30, '0', {
      fill: '#8b949e', fontSize: '10', anchor: 'end', fontFamily: 'monospace'
    });
    svgContent += SVG.text(chartX - 8, chartY + 10, `${maxVal}`, {
      fill: '#8b949e', fontSize: '10', anchor: 'end', fontFamily: 'monospace'
    });
  } else if (scene === 'database') {
    // Database cluster diagram
    const cx = W / 2;
    svgContent += SVG.circle(cx, 120, 50, { fill: accentColors[0] });
    svgContent += SVG.text(cx, 126, 'DB', { fill: '#0d1117', fontSize: '14', anchor: 'middle', fontFamily: 'monospace', fontWeight: 'bold' });
    svgContent += SVG.text(cx, 190, 'Primary', { fill: textColor, fontSize: '13', anchor: 'middle', fontFamily: 'monospace' });

    const replicas = [
      { x: cx - 180, y: 290, color: accentColors[2] },
      { x: cx, y: 310, color: accentColors[3] },
      { x: cx + 180, y: 290, color: accentColors[4] },
    ];
    for (const r of replicas) {
      svgContent += SVG.circle(r.x, r.y, 35, { fill: r.color });
      svgContent += SVG.text(r.x, r.y + 5, 'R', { fill: '#0d1117', fontSize: '12', anchor: 'middle', fontFamily: 'monospace', fontWeight: 'bold' });
      svgContent += SVG.text(r.x, r.y + 55, 'Replica', { fill: textColor, fontSize: '11', anchor: 'middle', fontFamily: 'monospace' });

      // Sync arrows
      const midX = (cx + r.x) / 2;
      const midY = (120 + r.y) / 2;
      svgContent += SVG.path(`M${cx} 170 L${r.x} ${r.y - 35}`, { stroke: '#30363d', strokeWidth: '1.5' });
    }
  } else {
    // Generic data visualization
    const cx = W / 2, cy = 200;
    const radius = 120;
    const categories = ['Scalability', 'Reliability', 'Performance', 'Cost', 'Security'];
    const scores = [88, 92, 78, 85, 95];

    svgContent += SVG.rect(50, 30, W - 100, 400, {
      fill: '#161b22', stroke: '#30363d', rx: '16'
    });

    svgContent += SVG.text(cx, 65, 'System Health Overview', {
      fill: textColor, fontSize: '18', anchor: 'middle', fontFamily: 'monospace', fontWeight: 'bold'
    });

    for (let i = 0; i < categories.length; i++) {
      const angle = (i / categories.length) * 2 * Math.PI - Math.PI / 2;
      const labelAngle = angle;
      const lx = cx + (radius + 30) * Math.cos(labelAngle);
      const ly = cy + (radius + 30) * Math.sin(labelAngle);
      const valX = cx + radius * Math.cos(angle) * (scores[i] / 100);
      const valY = cy + radius * Math.sin(angle) * (scores[i] / 100);
      const color = accentColors[i % accentColors.length];

      // Axis line
      svgContent += SVG.path(`M${cx} ${cy} L${cx + (radius + 10) * Math.cos(angle)} ${cy + (radius + 10) * Math.sin(angle)}`, {
        stroke: '#30363d', strokeWidth: '1'
      });

      // Data point
      svgContent += SVG.circle(valX, valY, 6, { fill: color });

      // Label
      svgContent += SVG.text(lx, ly + 4, `${categories[i]} ${scores[i]}%`, {
        fill: textColor, fontSize: '11', anchor: 'middle', fontFamily: 'monospace'
      });
    }
  }

  // Title bar
  const titleBarY = 440;
  svgContent += SVG.rect(20, titleBarY, W - 40, 28, {
    fill: '#21262d', stroke: '#30363d', rx: '8'
  });
  svgContent += SVG.text(W / 2, titleBarY + 19, title.substring(0, 60), {
    fill: textColor, fontSize: '12', anchor: 'middle', fontFamily: 'monospace'
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="d3-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d1117"/>
      <stop offset="100%" stop-color="#161b22"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#d3-bg)"/>
  ${svgContent}
</svg>`;
}

// ============== ROUGH.JS INSPIRED GENERATOR ==============

function generateRoughSVG(scene, title) {
  const W = 700, H = 480;
  const bgColor = '#f8f9fa';
  const textColor = '#1a1a2e';
  const colors = ['#e94560', '#0f3460', '#16213e', '#533483', '#e07c24'];

  let svgContent = '';

  // Hand-drawn style boxes
  const drawBox = (x, y, w, h, colorIdx = 0, label = '') => {
    const color = colors[colorIdx % colors.length];
    // Double-line sketchy effect
    svgContent += SVG.rect(x, y, w, h, { fill: 'none', stroke: color, strokeWidth: '2.5', rx: '4' });
    svgContent += SVG.rect(x + 2, y + 2, w - 4, h - 4, { fill: 'none', stroke: color, strokeWidth: '1', rx: '3', opacity: '0.3' });
    if (label) {
      svgContent += SVG.text(x + w / 2, y + h / 2 + 4, label, {
        fill: textColor, fontSize: '13', anchor: 'middle', fontFamily: 'serif', fontWeight: 'bold'
      });
    }
    return { x, y, w, h };
  };

  if (scene === 'collaboration' || scene === 'meeting' || scene === 'brainstorming') {
    // People/circle layout
    const centers = [
      { x: 150, y: 180, label: 'Team A' },
      { x: 350, y: 140, label: 'Team B' },
      { x: 550, y: 180, label: 'Team C' },
      { x: 250, y: 310, label: 'Team D' },
      { x: 450, y: 310, label: 'Team E' },
    ];

    // Connection lines
    for (const c of centers) {
      for (const c2 of centers) {
        if (c !== c2) {
          svgContent += SVG.path(`M${c.x} ${c.y} Q${(c.x + c2.x) / 2} ${(c.y + c2.y) / 2 - 40} ${c2.x} ${c2.y}`, {
            stroke: '#dee2e6', strokeWidth: '1', opacity: '0.5'
          });
        }
      }
    }

    for (const c of centers) {
      const ci = centers.indexOf(c);
      svgContent += SVG.circle(c.x, c.y, 32, { fill: colors[ci % colors.length], opacity: '0.85' });
      svgContent += SVG.text(c.x, c.y + 4, ci === 0 ? 'P' : ci === 1 ? 'M' : ci === 2 ? 'D' : ci === 3 ? 'S' : 'B', {
        fill: '#fff', fontSize: '14', anchor: 'middle', fontFamily: 'serif', fontWeight: 'bold'
      });
      svgContent += SVG.text(c.x, c.y + 55, c.label, {
        fill: textColor, fontSize: '11', anchor: 'middle', fontFamily: 'serif'
      });
    }
  } else {
    // Sketchy process flow
    const steps = ['Plan', 'Build', 'Test', 'Deploy', 'Monitor'];
    const boxW = 100, boxH = 60, gap = 20;
    const totalW = steps.length * (boxW + gap) - gap;
    const startX = (W - totalW) / 2;

    for (let i = 0; i < steps.length; i++) {
      const bx = startX + i * (boxW + gap);
      drawBox(bx, 200, boxW, boxH, i, steps[i]);

      // Arrow
      if (i < steps.length - 1) {
        const ax1 = bx + boxW;
        const ax2 = bx + boxW + gap;
        const ay = 230;
        svgContent += SVG.path(`M${ax1} ${ay} L${ax2} ${ay}`, {
          stroke: '#adb5bd', strokeWidth: '2'
        });
        // Arrowhead
        svgContent += SVG.path(`M${ax2 - 5} ${ay - 4} L${ax2} ${ay} L${ax2 - 5} ${ay + 4}`, {
          stroke: '#adb5bd', strokeWidth: '1.5'
        });
      }
    }
  }

  // Title
  const titleBarY = 430;
  svgContent += SVG.rect(20, titleBarY, W - 40, 36, {
    fill: '#e9ecef', stroke: '#ced4da', rx: '8'
  });
  svgContent += SVG.text(W / 2, titleBarY + 24, title.substring(0, 60), {
    fill: textColor, fontSize: '12', anchor: 'middle', fontFamily: 'serif'
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${bgColor}"/>
  ${svgContent}
</svg>`;
}

// ============== CHOOSE GENERATOR ==============

async function generateFromExistingGenerator(scene, title, content, preferred) {
  try {
    const { default: illustrators } = await import('./blog-illustration-generator.js');
    const generators = {
      blog: () => illustrators.generateIllustration(title, content),
      pixel: () => illustrators.generatePixelIllustration(title, content),
      modern: () => illustrators.generateModernIllustration(title, content),
      cartoon: () => illustrators.generateCartoonIllustration(title, content),
      animated: () => illustrators.generateAnimatedIllustration(title, content),
    };
    const gen = generators[preferred];
    if (gen) return await gen();
    return await generators.blog();
  } catch (e) {
    return null;
  }
}

async function generateFromAISVG(title, scene) {
  try {
    const sceneProfile = SCENE_PROFILES[scene];
    const isArchitectural = ['architecture', 'api', 'deployment', 'database'].includes(scene);
    const isDataDriven = ['performance', 'data', 'monitoring'].includes(scene);

    // Use rough for hand-drawn style, d3 for data-driven, etc.
    if (isDataDriven) {
      const svg = generateD3SVG(scene, title);
      return await saveSVG(svg, title, 'd3');
    }
    if (isArchitectural) {
      const svg = generateD3SVG(scene, title);
      return await saveSVG(svg, title, 'd3');
    }
    if (['collaboration', 'meeting', 'brainstorming', 'coding'].includes(scene)) {
      const svg = generateRoughSVG(scene, title);
      return await saveSVG(svg, title, 'rough');
    }

    const svg = generateD3SVG(scene, title);
    return await saveSVG(svg, title, 'd3');
  } catch (e) {
    return null;
  }
}

async function saveSVG(svg, title, prefix) {
  try {
    await fs.promises.mkdir(IMAGES_DIR, { recursive: true });
    const hash = crypto.createHash('md5').update(String(title)).digest('hex').slice(0, 8);
    const filename = `${prefix}-${hash}.svg`;
    const outputPath = path.join(IMAGES_DIR, filename);
    await fs.promises.writeFile(outputPath, svg, 'utf-8');
    return { path: outputPath, filename, scene: 'auto' };
  } catch (e) {
    return null;
  }
}

// ============== MAIN EXPORT ==============

/**
 * Generate an SVG illustration for a blog post.
 * Automatically selects the best generator based on scene detection.
 *
 * @param {string} title - Blog post title
 * @param {string} content - Blog post content (for scene detection)
 * @param {Object} options
 * @param {string} [options.preferred] - Preferred generator type (blog|pixel|modern|cartoon|animated|d3|rough)
 * @param {string} [options.filename] - Custom output filename
 * @returns {Promise<{path: string, scene: string, filename: string, generator: string}>}
 */
export async function generateBlogSVG(title, content = '', options = {}) {
  const scene = detectScene(title, content);
  const preferred = options.preferred || selectGenerators(scene)[0];

  // Try preferred generator first
  if (['blog', 'pixel', 'modern', 'cartoon', 'animated'].includes(preferred)) {
    const result = await generateFromExistingGenerator(scene, title, content, preferred);
    if (result) return { ...result, generator: preferred, scene };
  }

  // Try D3 or Rough generators
  if (['d3', 'rough'].includes(preferred)) {
    const result = await generateFromAISVG(title, scene);
    if (result) return { ...result, generator: preferred, scene };
  }

  // Fallback to blog generator
  const result = await generateFromExistingGenerator(scene, title, content, 'blog');
  if (result) return { ...result, generator: 'blog', scene };

  // Final D3 fallback
  const svg = generateD3SVG(scene, title);
  const saved = await saveSVG(svg, title, 'd3');
  return { ...saved, generator: 'd3', scene };
}

/**
 * Batch generate SVGs for multiple blog posts.
 */
export async function generateBlogBatchSVGs(posts, options = {}) {
  const results = [];
  for (const post of posts) {
    try {
      const result = await generateBlogSVG(post.title, post.content || post.blogIntro || '', options);
      results.push({ slug: post.blogSlug || post.slug, ...result });
    } catch (err) {
      results.push({ slug: post.blogSlug || post.slug, error: err.message });
    }
  }
  return results;
}

export { detectScene, selectGenerators, SCENE_PROFILES };
export default { generateBlogSVG, generateBlogBatchSVGs, detectScene, selectGenerators };
