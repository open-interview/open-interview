/**
 * AI-Powered SVG Image Generator
 * Uses opencode/big-pickle (free, 200k context) to generate custom LinkedIn card SVGs.
 * Each image is tailored to the post topic — no hardcoded templates.
 *
 * Falls back to existing template generators if AI fails or times out.
 */

import { spawn } from 'child_process';

const MODEL = 'opencode/big-pickle';
const TIMEOUT_MS = 60000; // 60s — SVG generation needs more time

// LinkedIn link preview dimensions
const W = 1200;
const H = 627;

// Channel → accent color + icon hint
const CHANNEL_STYLE = {
  'aws':                { color: '#FF9900', label: 'AWS' },
  'aws-saa':            { color: '#FF9900', label: 'AWS SAA' },
  'aws-devops-pro':     { color: '#FF9900', label: 'AWS DevOps' },
  'aws-sysops':         { color: '#FF9900', label: 'AWS SysOps' },
  'aws-ml-specialty':   { color: '#FF9900', label: 'AWS ML' },
  'aws-ai-practitioner':{ color: '#FF9900', label: 'AWS AI' },
  'terraform':          { color: '#7B42BC', label: 'Terraform' },
  'terraform-associate':{ color: '#7B42BC', label: 'Terraform' },
  'kubernetes':         { color: '#326CE5', label: 'Kubernetes' },
  'docker-dca':         { color: '#2496ED', label: 'Docker' },
  'devops':             { color: '#00C7B7', label: 'DevOps' },
  'sre':                { color: '#E8453C', label: 'SRE' },
  'linux':              { color: '#FCC624', label: 'Linux' },
  'gcp-devops-engineer':{ color: '#4285F4', label: 'GCP DevOps' },
  'llm-ops':            { color: '#A371F7', label: 'LLMOps' },
  'generative-ai':      { color: '#A371F7', label: 'Generative AI' },
  'networking':         { color: '#39C5CF', label: 'Networking' },
  'security':           { color: '#F85149', label: 'Security' },
  'system-design':      { color: '#3FB950', label: 'System Design' },
};

function getChannelStyle(channel) {
  return CHANNEL_STYLE[channel] || { color: '#58A6FF', label: channel || 'Tech' };
}

/**
 * Call opencode CLI and return raw text output (no JSON wrapping)
 */
function callOpencodeRaw(prompt) {
  return new Promise((resolve, reject) => {
    let output = '';
    let resolved = false;

    const proc = spawn('opencode', ['run', '--model', MODEL, prompt], {
      timeout: TIMEOUT_MS,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        proc.kill('SIGTERM');
        reject(new Error('AI SVG generation timed out'));
      }
    }, TIMEOUT_MS);

    proc.stdout.on('data', d => { output += d.toString(); });
    proc.stderr.on('data', d => { output += d.toString(); });

    proc.on('close', () => {
      clearTimeout(timer);
      if (!resolved) {
        resolved = true;
        resolve(output);
      }
    });

    proc.on('error', err => {
      clearTimeout(timer);
      if (!resolved) { resolved = true; reject(err); }
    });
  });
}

/**
 * Extract SVG from raw AI response
 */
function extractSVG(text) {
  // Try ```svg ... ``` block
  const svgBlock = text.match(/```svg\s*([\s\S]+?)\s*```/i);
  if (svgBlock) return svgBlock[1].trim();

  // Try ``` ... ``` block containing <svg
  const codeBlock = text.match(/```[a-z]*\s*(<svg[\s\S]+?<\/svg>)\s*```/i);
  if (codeBlock) return codeBlock[1].trim();

  // Try bare <svg>...</svg>
  const baresvg = text.match(/<svg[\s\S]+?<\/svg>/i);
  if (baresvg) return baresvg[0].trim();

  return null;
}

/**
 * Validate the SVG is usable (not empty, has content)
 */
function validateSVG(svg) {
  if (!svg || svg.length < 200) return false;
  if (!svg.includes('<svg')) return false;
  if (!svg.includes('</svg>')) return false;
  return true;
}

/**
 * Generate a LinkedIn card SVG using AI
 * @param {string} title - Post title
 * @param {string} channel - Tech channel (e.g. 'kubernetes', 'terraform')
 * @param {string} excerpt - Short description (optional)
 * @returns {Promise<string|null>} SVG string or null on failure
 */
export async function generateAISvg(title, channel = '', excerpt = '') {
  const { color, label } = getChannelStyle(channel);

  // Truncate title for the prompt — SVG text wrapping instructions handle length
  const shortTitle = title.length > 120 ? title.substring(0, 117) + '...' : title;

  const prompt = `Generate a LinkedIn post card as a single self-contained SVG image.

SPECIFICATIONS:
- Size: ${W}x${H} pixels (viewBox="0 0 ${W} ${H}")
- Style: dark tech aesthetic, GitHub dark theme
- Background: deep dark gradient from #0d1117 to #161b22
- Accent color: ${color} (use for highlights, borders, glows)
- Topic label: "${label}"
- Title text: "${shortTitle}"
${excerpt ? `- Subtitle: "${excerpt.substring(0, 100)}"` : ''}

LAYOUT REQUIREMENTS:
1. Full dark background with subtle gradient
2. Thin accent-colored top border stripe (full width, ~4px)
3. Topic badge (pill shape, top-left area, accent color background, white text, e.g. "# ${label}")
4. Large bold title text (center or left-aligned, white, font-size ~48-56px for short titles, smaller for long ones, wrap across multiple tspan lines if needed — keep within safe margins)
5. Tech visual element in the right half or bottom — use ONLY inline SVG shapes (circles, rects, lines, paths). Pick ONE relevant visual based on the topic:
   - Kubernetes: hexagons connected with lines (pod topology)
   - AWS/Cloud: layered rectangles (cloud architecture layers)
   - Terraform: interlocked blocks/rectangles
   - Docker: nested rounded rects (containers)
   - Linux/Terminal: a simple terminal window with fake code lines
   - SRE/DevOps: a simple gauge/dial or timeline
   - Security: a shield outline
   - Networking: connected nodes
   - System Design: a 3-tier box diagram
   - General/default: abstract geometric nodes and connectors
6. Bottom bar: solid accent-colored strip with "open-interview.github.io" in small white text

STRICT RULES:
- NO external resources (no images, no fonts from URLs — use system fonts: Arial, sans-serif)
- NO JavaScript
- All text must be inside SVG text/tspan elements
- Keep total SVG under 8000 characters
- Output ONLY the SVG code inside a \`\`\`svg code block, nothing else

\`\`\`svg
<svg ...> ... </svg>
\`\`\``;

  try {
    console.log(`   🤖 Generating AI SVG (${MODEL})...`);
    const raw = await callOpencodeRaw(prompt);
    const svg = extractSVG(raw);

    if (!validateSVG(svg)) {
      console.log('   ⚠️ AI SVG invalid or too short, will fallback');
      return null;
    }

    // Ensure correct dimensions are set
    const normalised = svg
      .replace(/width="[^"]*"/, `width="${W}"`)
      .replace(/height="[^"]*"/, `height="${H}"`);

    console.log(`   ✅ AI SVG generated (${normalised.length} chars)`);
    return normalised;
  } catch (err) {
    console.log(`   ⚠️ AI SVG error: ${err.message}`);
    return null;
  }
}

export default { generateAISvg };
