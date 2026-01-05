#!/usr/bin/env node
/**
 * Comic Strip Image Generator
 * 
 * Generates actual PNG comic strip images from Interview Theater episodes.
 * Uses Puppeteer to render HTML panels to images.
 * 
 * Usage:
 *   node script/generate-comic-images.js --episode <episode-dir>
 *   node script/generate-comic-images.js --topic "Design a URL Shortener"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
let episodeDir = null;
let topic = null;
let candidateLevel = 'mid';
let panelWidth = 800;
let panelHeight = 600;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--episode' && args[i + 1]) {
    episodeDir = args[i + 1];
    i++;
  } else if (args[i] === '--topic' && args[i + 1]) {
    topic = args[i + 1];
    i++;
  } else if (args[i] === '--level' && args[i + 1]) {
    candidateLevel = args[i + 1];
    i++;
  } else if (args[i] === '--width' && args[i + 1]) {
    panelWidth = parseInt(args[i + 1]);
    i++;
  } else if (args[i] === '--height' && args[i + 1]) {
    panelHeight = parseInt(args[i + 1]);
    i++;
  } else if (args[i] === '--help') {
    console.log(`
🖼️  Comic Strip Image Generator

Generates actual PNG comic strip images from Interview Theater episodes.

Usage:
  node script/generate-comic-images.js [options]

Options:
  --episode <dir>        Path to existing episode directory
  --topic <string>       Generate new episode with this topic
  --level <string>       Candidate level: junior, mid, senior, staff (default: mid)
  --width <number>       Panel width in pixels (default: 800)
  --height <number>      Panel height in pixels (default: 600)
  --help                 Show this help message

Examples:
  node script/generate-comic-images.js --episode blog-output/theater/episode-xxx
  node script/generate-comic-images.js --topic "Explain Microservices" --level senior

Output:
  - Individual panel images (panel-001.png, panel-002.png, etc.)
  - Full comic strip image (comic-strip.png)
`);
    process.exit(0);
  }
}

// Find Chrome executable
function findChrome() {
  const paths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    process.env.CHROME_PATH
  ].filter(Boolean);
  
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// Character configurations with comicgen
const CHARACTERS = {
  candidate: { name: 'dee', color: '#22c55e' },
  interviewer: { name: 'dey', color: '#6366f1' }
};

const EMOTIONS = {
  neutral: 'neutral',
  thinking: 'afraid',
  confident: 'happy',
  nervous: 'afraid',
  explaining: 'talking',
  questioning: 'talking',
  impressed: 'happy',
  skeptical: 'angry'
};

const POSES = ['handsfolded', 'handsonhip', 'pointingup', 'explaining', 'thumbsup', 'yuhoo'];

function getEmotion(text) {
  const lower = text.toLowerCase();
  if (lower.includes('think') || lower.includes('hmm') || lower.includes('let me')) return 'thinking';
  if (lower.includes('great') || lower.includes('good') || lower.includes('excellent')) return 'impressed';
  if (lower.includes('?')) return 'questioning';
  if (lower.includes('confident') || lower.includes('sure')) return 'confident';
  return 'neutral';
}


// Generate HTML for a single comic panel
function generatePanelHTML(panel, width, height) {
  const { speaker, text, thought_bubble, subtext, technique_used, characterName, panelNum, sceneTitle } = panel;
  const char = CHARACTERS[speaker] || CHARACTERS.candidate;
  const emotion = EMOTIONS[getEmotion(text + (subtext || ''))] || 'neutral';
  const pose = POSES[panelNum % POSES.length];
  const comicgenUrl = `https://gramener.com/comicgen/v1/${char.name}/${emotion}/${pose}.svg`;
  
  const isThought = !!thought_bubble;
  const bubbleText = thought_bubble || text;
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: ${width}px;
      height: ${height}px;
      font-family: 'Comic Neue', cursive;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      display: flex;
      overflow: hidden;
    }
    .panel {
      width: 100%;
      height: 100%;
      border: 6px solid #000;
      border-radius: 16px;
      display: flex;
      padding: 20px;
      position: relative;
      background: linear-gradient(180deg, #1e2a4a 0%, #16213e 100%);
    }
    .character-area {
      width: 35%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      padding-bottom: 10px;
    }
    .character-img {
      width: 180px;
      height: 270px;
      object-fit: contain;
      filter: drop-shadow(3px 3px 0 #000);
    }
    .character-name {
      font-family: 'Bangers', cursive;
      font-size: 18px;
      color: white;
      background: ${char.color};
      padding: 4px 16px;
      border-radius: 20px;
      margin-top: 8px;
      border: 2px solid #000;
    }
    .bubble-area {
      width: 65%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding-left: 20px;
    }
    .speech-bubble {
      background: ${isThought ? '#e8e8e8' : '#ffffff'};
      color: #1a1a2e;
      padding: 20px 25px;
      border-radius: ${isThought ? '50%' : '20px'};
      border: 4px solid #000;
      ${isThought ? 'border-style: dashed;' : ''}
      font-size: 18px;
      line-height: 1.5;
      position: relative;
      box-shadow: 4px 4px 0 #000;
      max-width: 100%;
    }
    .speech-bubble::before {
      content: '';
      position: absolute;
      left: -25px;
      top: 40px;
      border: 15px solid transparent;
      border-right-color: #000;
      ${isThought ? 'display: none;' : ''}
    }
    .speech-bubble::after {
      content: '${isThought ? '💭' : ''}';
      position: absolute;
      left: -35px;
      top: 30px;
      font-size: 30px;
      ${isThought ? '' : 'content: ""; border: 12px solid transparent; border-right-color: white; left: -22px; top: 42px;'}
    }
    .technique-tag {
      display: inline-block;
      background: ${char.color};
      color: white;
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 12px;
      margin-top: 12px;
      border: 2px solid #000;
    }
    .scene-badge {
      position: absolute;
      top: 15px;
      left: 15px;
      background: #e94560;
      color: white;
      font-family: 'Bangers', cursive;
      font-size: 14px;
      padding: 4px 12px;
      border-radius: 20px;
      border: 2px solid #000;
    }
    .panel-number {
      position: absolute;
      bottom: 15px;
      right: 15px;
      background: rgba(0,0,0,0.5);
      color: white;
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 10px;
    }
  </style>
</head>
<body>
  <div class="panel">
    ${sceneTitle ? `<div class="scene-badge">${sceneTitle}</div>` : ''}
    <div class="character-area">
      <img src="${comicgenUrl}" class="character-img" crossorigin="anonymous" 
           onerror="this.style.display='none'"/>
      <div class="character-name">${characterName}</div>
    </div>
    <div class="bubble-area">
      <div class="speech-bubble">
        ${bubbleText}
        ${technique_used ? `<div class="technique-tag">⚡ ${technique_used}</div>` : ''}
      </div>
    </div>
    <div class="panel-number">#${String(panelNum).padStart(2, '0')}</div>
  </div>
</body>
</html>`;
}

// Generate scene title panel HTML
function generateSceneTitleHTML(scene, width, height) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: ${width}px;
      height: ${height}px;
      font-family: 'Comic Neue', cursive;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .panel {
      width: 100%;
      height: 100%;
      border: 6px solid #000;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
      text-align: center;
      padding: 30px;
    }
    .scene-number {
      font-family: 'Bangers', cursive;
      font-size: 28px;
      color: white;
      background: rgba(0,0,0,0.3);
      padding: 8px 24px;
      border-radius: 30px;
      margin-bottom: 20px;
      border: 3px solid #000;
    }
    .scene-title {
      font-family: 'Bangers', cursive;
      font-size: 48px;
      color: white;
      text-shadow: 4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000;
      letter-spacing: 3px;
      margin-bottom: 20px;
    }
    .scene-setting {
      font-size: 18px;
      color: rgba(255,255,255,0.9);
      font-style: italic;
      max-width: 80%;
    }
  </style>
</head>
<body>
  <div class="panel">
    <div class="scene-number">SCENE ${scene.scene_number}</div>
    <div class="scene-title">${scene.title}</div>
    ${scene.setting ? `<div class="scene-setting">📍 ${scene.setting}</div>` : ''}
  </div>
</body>
</html>`;
}

// Generate decision point panel HTML
function generateDecisionHTML(decision, sceneNum, width, height) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: ${width}px;
      height: ${height}px;
      font-family: 'Comic Neue', cursive;
    }
    .panel {
      width: 100%;
      height: 100%;
      border: 6px solid #000;
      border-radius: 16px;
      background: linear-gradient(135deg, #1e1e3f 0%, #2d2d5a 100%);
      padding: 25px;
      display: flex;
      flex-direction: column;
    }
    .header {
      font-family: 'Bangers', cursive;
      font-size: 32px;
      color: #e94560;
      text-align: center;
      margin-bottom: 15px;
      text-shadow: 2px 2px 0 #000;
    }
    .question {
      font-size: 20px;
      color: white;
      text-align: center;
      margin-bottom: 20px;
    }
    .options {
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
    }
    .option {
      display: flex;
      align-items: center;
      gap: 15px;
      background: #16213e;
      border: 3px solid #0f3460;
      border-radius: 12px;
      padding: 12px 15px;
    }
    .option-letter {
      width: 36px;
      height: 36px;
      background: #e94560;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Bangers', cursive;
      font-size: 20px;
      flex-shrink: 0;
      border: 2px solid #000;
    }
    .option-text {
      color: white;
      font-size: 16px;
    }
    .best-answer {
      margin-top: 15px;
      padding: 12px;
      background: rgba(34, 197, 94, 0.2);
      border-radius: 10px;
      color: #22c55e;
      font-weight: bold;
      text-align: center;
      border: 2px solid #22c55e;
    }
  </style>
</head>
<body>
  <div class="panel">
    <div class="header">🤔 WHAT WOULD YOU DO?</div>
    <div class="question">${decision.question}</div>
    <div class="options">
      ${decision.options.map((opt, i) => `
        <div class="option">
          <div class="option-letter">${String.fromCharCode(65 + i)}</div>
          <div class="option-text">${opt.choice}</div>
        </div>
      `).join('')}
    </div>
    <div class="best-answer">✅ ${decision.best_choice}</div>
  </div>
</body>
</html>`;
}


// Generate resolution/ending panel HTML
function generateResolutionHTML(resolution, width, height) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: ${width}px;
      height: ${height}px;
      font-family: 'Comic Neue', cursive;
    }
    .panel {
      width: 100%;
      height: 100%;
      border: 6px solid #000;
      border-radius: 16px;
      background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
      padding: 25px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .header {
      font-family: 'Bangers', cursive;
      font-size: 36px;
      color: white;
      text-shadow: 3px 3px 0 #000;
      margin-bottom: 20px;
    }
    .outcome {
      font-family: 'Bangers', cursive;
      font-size: 48px;
      color: white;
      background: ${resolution.outcome === 'hire' || resolution.outcome === 'strong-hire' ? '#22c55e' : '#dc2626'};
      padding: 12px 40px;
      border-radius: 50px;
      border: 4px solid #000;
      box-shadow: 4px 4px 0 #000;
      margin-bottom: 25px;
      text-transform: uppercase;
    }
    .takeaways {
      background: rgba(0,0,0,0.3);
      padding: 20px;
      border-radius: 15px;
      max-width: 90%;
    }
    .takeaways-title {
      font-family: 'Bangers', cursive;
      font-size: 22px;
      color: white;
      margin-bottom: 12px;
    }
    .takeaway {
      color: rgba(255,255,255,0.9);
      font-size: 16px;
      margin: 8px 0;
      text-align: left;
    }
    .takeaway-num {
      display: inline-block;
      width: 24px;
      height: 24px;
      background: white;
      color: #e94560;
      border-radius: 50%;
      text-align: center;
      line-height: 24px;
      font-weight: bold;
      margin-right: 10px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="panel">
    <div class="header">🎬 THE VERDICT</div>
    <div class="outcome">${resolution.outcome.replace('-', ' ')}</div>
    <div class="takeaways">
      <div class="takeaways-title">🎯 Key Takeaways</div>
      ${(resolution.viewer_takeaways || []).slice(0, 3).map((t, i) => `
        <div class="takeaway"><span class="takeaway-num">${i + 1}</span>${t}</div>
      `).join('')}
    </div>
  </div>
</body>
</html>`;
}

// Main function
async function generateComicImages() {
  console.log('🖼️  Comic Strip Image Generator');
  console.log('================================');
  
  // Find Chrome
  const chromePath = findChrome();
  if (!chromePath) {
    console.error('❌ Chrome/Chromium not found. Please install Chrome or set CHROME_PATH.');
    process.exit(1);
  }
  console.log(`🌐 Using Chrome: ${chromePath}`);
  
  let episode;
  let outputDir;
  
  // Load or generate episode
  if (episodeDir) {
    const episodeFile = path.join(episodeDir, 'episode-data.json');
    if (!fs.existsSync(episodeFile)) {
      console.error(`❌ Episode file not found: ${episodeFile}`);
      process.exit(1);
    }
    episode = JSON.parse(fs.readFileSync(episodeFile, 'utf-8'));
    outputDir = episodeDir;
    console.log(`📂 Loading episode from: ${episodeDir}`);
  } else if (topic) {
    console.log(`🎬 Generating new episode for: ${topic}`);
    const { execSync } = await import('child_process');
    
    try {
      execSync(
        `node script/generate-interview-theater.js --topic "${topic}" --level ${candidateLevel}`,
        { encoding: 'utf-8', cwd: path.join(__dirname, '..'), stdio: 'inherit' }
      );
      
      const theaterDir = path.join(__dirname, '..', 'blog-output', 'theater');
      const episodes = fs.readdirSync(theaterDir).filter(f => f.startsWith('episode-')).sort().reverse();
      
      if (episodes.length === 0) {
        console.error('❌ No episodes found');
        process.exit(1);
      }
      
      outputDir = path.join(theaterDir, episodes[0]);
      episode = JSON.parse(fs.readFileSync(path.join(outputDir, 'episode-data.json'), 'utf-8'));
    } catch (error) {
      console.error('❌ Failed to generate episode:', error.message);
      process.exit(1);
    }
  } else {
    const theaterDir = path.join(__dirname, '..', 'blog-output', 'theater');
    if (!fs.existsSync(theaterDir)) {
      console.error('❌ No theater directory found. Generate an episode first.');
      process.exit(1);
    }
    
    const episodes = fs.readdirSync(theaterDir).filter(f => f.startsWith('episode-')).sort().reverse();
    if (episodes.length === 0) {
      console.error('❌ No episodes found.');
      process.exit(1);
    }
    
    outputDir = path.join(theaterDir, episodes[0]);
    episode = JSON.parse(fs.readFileSync(path.join(outputDir, 'episode-data.json'), 'utf-8'));
    console.log(`📂 Using latest episode: ${episodes[0]}`);
  }
  
  // Create images directory
  const imagesDir = path.join(outputDir, 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  
  console.log('');
  console.log('🎨 Generating comic panel images...');
  console.log(`   Panel size: ${panelWidth}x${panelHeight}px`);
  
  // Launch browser
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: panelWidth, height: panelHeight });
  
  const chars = episode.characters || {};
  const scenes = episode.scenes || [];
  const panels = [];
  let panelNum = 1;
  
  // Generate panels for each scene
  for (const scene of scenes) {
    // Scene title panel
    console.log(`   📍 Scene ${scene.scene_number}: ${scene.title}`);
    const sceneTitleHTML = generateSceneTitleHTML(scene, panelWidth, panelHeight);
    await page.setContent(sceneTitleHTML, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await new Promise(r => setTimeout(r, 1000)); // Wait for fonts
    const scenePath = path.join(imagesDir, `panel-${String(panelNum).padStart(3, '0')}-scene.png`);
    await page.screenshot({ path: scenePath, type: 'png' });
    panels.push(scenePath);
    panelNum++;
    
    // Dialogue panels
    for (const d of (scene.dialogue || [])) {
      const panelData = {
        speaker: d.speaker,
        text: d.text,
        thought_bubble: d.thought_bubble,
        subtext: d.subtext,
        technique_used: d.technique_used,
        characterName: d.speaker === 'interviewer' 
          ? (chars.interviewer?.name || 'Interviewer')
          : (chars.candidate?.name || 'Candidate'),
        panelNum,
        sceneTitle: null
      };
      
      const panelHTML = generatePanelHTML(panelData, panelWidth, panelHeight);
      await page.setContent(panelHTML, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await new Promise(r => setTimeout(r, 800)); // Wait for fonts and SVG
      
      const panelPath = path.join(imagesDir, `panel-${String(panelNum).padStart(3, '0')}.png`);
      await page.screenshot({ path: panelPath, type: 'png' });
      panels.push(panelPath);
      console.log(`   ✓ Panel ${panelNum}: ${d.speaker}`);
      panelNum++;
    }
    
    // Decision point panel
    if (scene.decision_point) {
      const decisionHTML = generateDecisionHTML(scene.decision_point, scene.scene_number, panelWidth, panelHeight);
      await page.setContent(decisionHTML, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await new Promise(r => setTimeout(r, 800));
      const decisionPath = path.join(imagesDir, `panel-${String(panelNum).padStart(3, '0')}-decision.png`);
      await page.screenshot({ path: decisionPath, type: 'png' });
      panels.push(decisionPath);
      console.log(`   ✓ Panel ${panelNum}: Decision Point`);
      panelNum++;
    }
  }
  
  // Resolution panel
  if (episode.resolution?.outcome) {
    const resolutionHTML = generateResolutionHTML(episode.resolution, panelWidth, panelHeight);
    await page.setContent(resolutionHTML, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await new Promise(r => setTimeout(r, 800));
    const resolutionPath = path.join(imagesDir, `panel-${String(panelNum).padStart(3, '0')}-resolution.png`);
    await page.screenshot({ path: resolutionPath, type: 'png' });
    panels.push(resolutionPath);
    console.log(`   ✓ Panel ${panelNum}: Resolution`);
  }
  
  console.log('');
  console.log('✅ Individual panels generated!');
  console.log(`📁 Output: ${imagesDir}`);
  console.log(`🖼️  Total panels: ${panels.length}`);
  
  // Generate combined strip
  const stripPath = await generateCombinedStrip(episode, outputDir, panels, browser);
  
  await browser.close();
  
  console.log('');
  console.log('🎉 Comic strip generation complete!');
  console.log('');
  console.log('Generated files:');
  console.log(`   📄 ${path.basename(stripPath)} (FULL COMIC STRIP)`);
  panels.forEach(p => console.log(`   - ${path.basename(p)}`));
  
  return { panels, stripPath };
}

// Generate a single combined comic strip image
async function generateCombinedStrip(episode, outputDir, panelImages, browser) {
  console.log('');
  console.log('🎨 Generating combined comic strip...');
  
  const ep = episode.episode || {};
  const chars = episode.characters || {};
  const scenes = episode.scenes || [];
  const resolution = episode.resolution || {};
  
  // Calculate grid layout - 3 columns
  const cols = 3;
  const rows = Math.ceil(panelImages.length / cols);
  const cellWidth = panelWidth;
  const cellHeight = panelHeight;
  const headerHeight = 200;
  const padding = 20;
  
  const totalWidth = cols * cellWidth + (cols + 1) * padding;
  const totalHeight = headerHeight + rows * cellHeight + (rows + 1) * padding + 100; // +100 for footer
  
  // Generate combined HTML
  const combinedHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: ${totalWidth}px;
      min-height: ${totalHeight}px;
      font-family: 'Comic Neue', cursive;
      background: #0a0a0f;
      padding: ${padding}px;
    }
    .comic-strip {
      background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%);
      border: 8px solid #000;
      border-radius: 20px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
      padding: 30px;
      text-align: center;
      border-bottom: 6px solid #000;
    }
    .title {
      font-family: 'Bangers', cursive;
      font-size: 56px;
      color: white;
      text-shadow: 4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000;
      letter-spacing: 3px;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 20px;
      color: rgba(255,255,255,0.9);
      max-width: 800px;
      margin: 0 auto;
    }
    .meta {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 15px;
    }
    .meta-badge {
      background: rgba(0,0,0,0.3);
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 14px;
      color: white;
    }
    .characters {
      display: flex;
      justify-content: center;
      gap: 40px;
      padding: 20px;
      background: rgba(0,0,0,0.2);
      border-bottom: 4px solid #000;
    }
    .character-intro {
      display: flex;
      align-items: center;
      gap: 15px;
      background: #16213e;
      padding: 12px 20px;
      border-radius: 12px;
      border: 3px solid #0f3460;
    }
    .char-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Bangers', cursive;
      font-size: 24px;
      color: white;
      border: 3px solid #000;
    }
    .char-info h4 {
      font-family: 'Bangers', cursive;
      font-size: 18px;
      color: white;
    }
    .char-info p {
      font-size: 12px;
      color: #a0a0b0;
    }
    .panels-grid {
      display: grid;
      grid-template-columns: repeat(${cols}, 1fr);
      gap: ${padding}px;
      padding: ${padding}px;
    }
    .panel-wrapper {
      border: 5px solid #000;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 5px 5px 0 rgba(0,0,0,0.5);
    }
    .panel-wrapper img {
      width: 100%;
      height: auto;
      display: block;
    }
    .footer {
      background: #16213e;
      padding: 20px;
      text-align: center;
      border-top: 4px solid #000;
    }
    .footer-text {
      font-family: 'Bangers', cursive;
      font-size: 24px;
      color: #e94560;
    }
    .footer-sub {
      font-size: 14px;
      color: #a0a0b0;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div class="comic-strip">
    <div class="header">
      <div class="title">${ep.title || 'Interview Theater'}</div>
      <div class="subtitle">${ep.synopsis || ''}</div>
      <div class="meta">
        <span class="meta-badge">⏱️ ${ep.duration_estimate || '15-20 min'}</span>
        <span class="meta-badge">📊 ${ep.difficulty || 'intermediate'}</span>
        <span class="meta-badge">🎭 ${(ep.tags || []).join(', ')}</span>
      </div>
    </div>
    <div class="characters">
      ${chars.candidate ? `
        <div class="character-intro">
          <div class="char-avatar" style="background: #22c55e">${chars.candidate.name?.[0] || 'C'}</div>
          <div class="char-info">
            <h4>${chars.candidate.name || 'Candidate'}</h4>
            <p>${chars.candidate.background?.slice(0, 50) || 'Candidate'}...</p>
          </div>
        </div>
      ` : ''}
      ${chars.interviewer ? `
        <div class="character-intro">
          <div class="char-avatar" style="background: #6366f1">${chars.interviewer.name?.[0] || 'I'}</div>
          <div class="char-info">
            <h4>${chars.interviewer.name || 'Interviewer'}</h4>
            <p>${chars.interviewer.role?.slice(0, 50) || 'Interviewer'}...</p>
          </div>
        </div>
      ` : ''}
    </div>
    <div class="panels-grid">
      ${panelImages.map((img, i) => `
        <div class="panel-wrapper">
          <img src="file://${img}" />
        </div>
      `).join('')}
    </div>
    <div class="footer">
      <div class="footer-text">🎬 Interview Theater by Reel LearnHub</div>
      <div class="footer-sub">Master technical interviews through immersive storytelling</div>
    </div>
  </div>
</body>
</html>`;

  const page = await browser.newPage();
  await page.setViewport({ width: totalWidth, height: totalHeight, deviceScaleFactor: 1 });
  await page.setContent(combinedHTML, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000)); // Wait for images and fonts
  
  // Get actual content height
  const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewport({ width: totalWidth, height: bodyHeight, deviceScaleFactor: 1 });
  await new Promise(r => setTimeout(r, 500));
  
  const stripPath = path.join(outputDir, 'comic-strip-full.png');
  await page.screenshot({ path: stripPath, type: 'png', fullPage: true });
  await page.close();
  
  console.log(`✅ Combined comic strip saved: comic-strip-full.png`);
  console.log(`   Size: ${totalWidth}x${bodyHeight}px`);
  
  return stripPath;
}

// Run
generateComicImages().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
