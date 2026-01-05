#!/usr/bin/env node
/**
 * Comic Strip Generator
 * 
 * Transforms Interview Theater episodes into visual comic strips using comicgen.
 * 
 * Usage:
 *   node script/generate-comic-strip.js --episode <episode-dir>
 *   node script/generate-comic-strip.js --topic "Design a URL Shortener" --level senior
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
let episodeDir = null;
let topic = null;
let candidateLevel = 'mid';
let interviewStyle = 'technical';

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
  } else if (args[i] === '--style' && args[i + 1]) {
    interviewStyle = args[i + 1];
    i++;
  } else if (args[i] === '--help') {
    console.log(`
🎨 Comic Strip Generator

Transforms Interview Theater episodes into visual comic strips.

Usage:
  node script/generate-comic-strip.js [options]

Options:
  --episode <dir>        Path to existing episode directory
  --topic <string>       Generate new episode with this topic
  --level <string>       Candidate level: junior, mid, senior, staff (default: mid)
  --style <string>       Interview style: technical, behavioral, system-design (default: technical)
  --help                 Show this help message

Examples:
  node script/generate-comic-strip.js --episode blog-output/theater/episode-design-a-url-shortener-123
  node script/generate-comic-strip.js --topic "Explain Microservices" --level senior
`);
    process.exit(0);
  }
}

// Comicgen character configurations
const CHARACTERS = {
  candidate: {
    name: 'dee',  // Comicgen character
    emotions: {
      neutral: 'neutral',
      thinking: 'afraid',
      confident: 'happy',
      nervous: 'afraid',
      explaining: 'talking',
      surprised: 'surprised'
    },
    poses: ['handsfolded', 'handsonhip', 'pointingup', 'explaining', 'thumbsup']
  },
  interviewer: {
    name: 'dey',  // Comicgen character
    emotions: {
      neutral: 'neutral',
      questioning: 'talking',
      impressed: 'happy',
      skeptical: 'angry',
      listening: 'neutral'
    },
    poses: ['handsfolded', 'handsonhip', 'pointingup', 'yuhoo']
  }
};

// Map dialogue context to emotions
function getEmotion(speaker, text, subtext) {
  const lowerText = (text + ' ' + (subtext || '')).toLowerCase();
  
  if (speaker === 'candidate') {
    if (lowerText.includes('think') || lowerText.includes('hmm') || lowerText.includes('let me')) return 'thinking';
    if (lowerText.includes('confident') || lowerText.includes('sure') || lowerText.includes('definitely')) return 'confident';
    if (lowerText.includes('nervous') || lowerText.includes('not sure')) return 'nervous';
    if (lowerText.includes('explain') || lowerText.includes('so') || lowerText.includes('basically')) return 'explaining';
    return 'neutral';
  } else {
    if (lowerText.includes('?') || lowerText.includes('what') || lowerText.includes('how')) return 'questioning';
    if (lowerText.includes('great') || lowerText.includes('good') || lowerText.includes('excellent')) return 'impressed';
    if (lowerText.includes('but') || lowerText.includes('however') || lowerText.includes('concern')) return 'skeptical';
    return 'listening';
  }
}

// Generate comic panel HTML
function generatePanel(dialogue, panelNum, chars, isDecisionPoint = false) {
  const speaker = dialogue.speaker;
  const charConfig = CHARACTERS[speaker];
  const emotion = getEmotion(speaker, dialogue.text, dialogue.subtext || dialogue.thought_bubble);
  const charEmotion = charConfig.emotions[emotion] || 'neutral';
  const pose = charConfig.poses[panelNum % charConfig.poses.length];
  const charName = chars[speaker]?.name || (speaker === 'interviewer' ? 'Sarah' : 'Alex');
  
  // Comicgen URL for character
  const comicgenUrl = `https://gramener.com/comicgen/v1/${charConfig.name}/${charEmotion}/${pose}.svg`;
  
  // Speech bubble style based on type
  let bubbleClass = 'speech-bubble';
  let bubbleContent = dialogue.text;
  
  if (dialogue.thought_bubble) {
    bubbleClass = 'thought-bubble';
    bubbleContent = dialogue.thought_bubble;
  }
  
  return `
    <div class="comic-panel ${isDecisionPoint ? 'decision-panel' : ''}" data-panel="${panelNum}">
      <div class="panel-content">
        <div class="character ${speaker}">
          <img src="${comicgenUrl}" alt="${charName}" class="character-img" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 300%22><rect fill=%22%23${speaker === 'interviewer' ? '6366f1' : '22c55e'}%22 width=%22200%22 height=%22300%22 rx=%2220%22/><circle fill=%22white%22 cx=%22100%22 cy=%22100%22 r=%2250%22/><text x=%22100%22 y=%22200%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2240%22>${charName[0]}</text></svg>'"/>
          <div class="character-name">${charName}</div>
        </div>
        <div class="${bubbleClass}">
          <p>${bubbleContent}</p>
          ${dialogue.technique_used ? `<span class="technique-tag">⚡ ${dialogue.technique_used}</span>` : ''}
          ${dialogue.coaching_note ? `<span class="coaching-tag">💡 ${dialogue.coaching_note}</span>` : ''}
        </div>
      </div>
      ${dialogue.subtext && !dialogue.thought_bubble ? `<div class="subtext-note">🎯 ${dialogue.subtext}</div>` : ''}
    </div>
  `;
}

// Generate decision point panel
function generateDecisionPanel(decisionPoint, sceneNum) {
  return `
    <div class="comic-panel decision-panel full-width">
      <div class="decision-content">
        <div class="decision-header">🤔 Decision Point</div>
        <div class="decision-question">${decisionPoint.question}</div>
        <div class="decision-options">
          ${decisionPoint.options.map((opt, i) => `
            <div class="decision-option" data-choice="${i}" onclick="revealDecision(this, ${sceneNum}, ${i === 1})">
              <div class="option-letter">${String.fromCharCode(65 + i)}</div>
              <div class="option-text">
                <div class="option-choice">${opt.choice}</div>
                <div class="option-outcome hidden">${opt.outcome}</div>
                <div class="option-score hidden">${opt.score_impact}</div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="best-answer hidden" id="best-${sceneNum}">✅ ${decisionPoint.best_choice}</div>
      </div>
    </div>
  `;
}


// Generate full comic strip HTML
function generateComicHTML(episode) {
  const ep = episode.episode || {};
  const chars = episode.characters || {};
  const scenes = episode.scenes || [];
  const resolution = episode.resolution || {};
  
  let panelNum = 0;
  let panelsHTML = '';
  
  // Generate panels for each scene
  scenes.forEach((scene, sceneIdx) => {
    // Scene title panel
    panelsHTML += `
      <div class="comic-panel scene-title-panel">
        <div class="scene-badge">Scene ${scene.scene_number}</div>
        <h2 class="scene-title">${scene.title}</h2>
        ${scene.setting ? `<p class="scene-setting">📍 ${scene.setting}</p>` : ''}
      </div>
    `;
    
    // Dialogue panels
    (scene.dialogue || []).forEach(d => {
      panelsHTML += generatePanel(d, panelNum++, chars);
    });
    
    // Decision point panel
    if (scene.decision_point) {
      panelsHTML += generateDecisionPanel(scene.decision_point, scene.scene_number);
    }
    
    // Key insights panel
    if (scene.key_insights && scene.key_insights.length > 0) {
      panelsHTML += `
        <div class="comic-panel insights-panel">
          <div class="insights-header">💡 Key Insights</div>
          <ul class="insights-list">
            ${scene.key_insights.map(i => `<li>${i}</li>`).join('')}
          </ul>
        </div>
      `;
    }
  });
  
  // Resolution panel
  if (resolution.outcome) {
    panelsHTML += `
      <div class="comic-panel resolution-panel full-width">
        <div class="resolution-header">🎬 The Verdict</div>
        <div class="outcome-badge ${resolution.outcome}">${resolution.outcome.replace('-', ' ').toUpperCase()}</div>
        <div class="takeaways">
          <h4>Key Takeaways:</h4>
          <ol>
            ${(resolution.viewer_takeaways || []).map(t => `<li>${t}</li>`).join('')}
          </ol>
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ep.title || 'Interview Comic'} | Comic Strip</title>
  <link href="https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #1a1a2e;
      --panel-bg: #16213e;
      --border: #0f3460;
      --accent: #e94560;
      --accent-light: #ff6b6b;
      --text: #eaeaea;
      --text-muted: #a0a0a0;
      --candidate: #22c55e;
      --interviewer: #6366f1;
      --bubble-bg: #ffffff;
      --bubble-text: #1a1a2e;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Comic Neue', cursive, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: 1rem;
    }
    
    .comic-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .comic-header {
      text-align: center;
      padding: 2rem;
      margin-bottom: 2rem;
      background: linear-gradient(135deg, var(--accent) 0%, #ff6b6b 100%);
      border-radius: 20px;
      border: 4px solid #000;
      box-shadow: 8px 8px 0 #000;
    }
    
    .comic-title {
      font-family: 'Bangers', cursive;
      font-size: 3rem;
      color: #fff;
      text-shadow: 3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000;
      letter-spacing: 2px;
    }
    
    .comic-subtitle {
      font-size: 1.2rem;
      color: rgba(255,255,255,0.9);
      margin-top: 0.5rem;
    }
    
    .comic-meta {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      margin-top: 1rem;
      flex-wrap: wrap;
    }
    
    .meta-badge {
      background: rgba(0,0,0,0.3);
      padding: 0.5rem 1rem;
      border-radius: 100px;
      font-size: 0.9rem;
    }
    
    /* Comic Grid */
    .comic-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1rem;
    }
    
    .comic-panel {
      background: var(--panel-bg);
      border: 4px solid #000;
      border-radius: 12px;
      padding: 1.5rem;
      position: relative;
      box-shadow: 6px 6px 0 #000;
      transition: transform 0.2s;
    }
    
    .comic-panel:hover {
      transform: translate(-2px, -2px);
      box-shadow: 8px 8px 0 #000;
    }
    
    .comic-panel.full-width {
      grid-column: 1 / -1;
    }
    
    /* Scene Title Panel */
    .scene-title-panel {
      background: linear-gradient(135deg, var(--border) 0%, var(--panel-bg) 100%);
      text-align: center;
      grid-column: 1 / -1;
    }
    
    .scene-badge {
      display: inline-block;
      background: var(--accent);
      color: white;
      padding: 0.3rem 1rem;
      border-radius: 100px;
      font-family: 'Bangers', cursive;
      font-size: 1rem;
      margin-bottom: 0.5rem;
    }
    
    .scene-title {
      font-family: 'Bangers', cursive;
      font-size: 1.8rem;
      color: var(--accent-light);
      text-shadow: 2px 2px 0 #000;
    }
    
    .scene-setting {
      color: var(--text-muted);
      font-style: italic;
      margin-top: 0.5rem;
    }
    
    /* Character */
    .panel-content {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }
    
    .character {
      flex-shrink: 0;
      text-align: center;
    }
    
    .character-img {
      width: 120px;
      height: 180px;
      object-fit: contain;
      filter: drop-shadow(2px 2px 0 #000);
    }
    
    .character-name {
      font-family: 'Bangers', cursive;
      font-size: 0.9rem;
      margin-top: 0.5rem;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }
    
    .character.candidate .character-name {
      background: var(--candidate);
      color: white;
    }
    
    .character.interviewer .character-name {
      background: var(--interviewer);
      color: white;
    }
    
    /* Speech Bubbles */
    .speech-bubble, .thought-bubble {
      flex: 1;
      background: var(--bubble-bg);
      color: var(--bubble-text);
      padding: 1rem 1.5rem;
      border-radius: 20px;
      position: relative;
      font-size: 1rem;
      line-height: 1.5;
      border: 3px solid #000;
    }
    
    .speech-bubble::before {
      content: '';
      position: absolute;
      left: -20px;
      top: 20px;
      border: 10px solid transparent;
      border-right-color: #000;
    }
    
    .speech-bubble::after {
      content: '';
      position: absolute;
      left: -14px;
      top: 22px;
      border: 8px solid transparent;
      border-right-color: var(--bubble-bg);
    }
    
    .thought-bubble {
      background: #f0f0f0;
      border-style: dashed;
      font-style: italic;
    }
    
    .thought-bubble::before {
      content: '💭';
      position: absolute;
      left: -30px;
      top: 10px;
      font-size: 1.5rem;
      border: none;
    }
    
    .thought-bubble::after {
      display: none;
    }
    
    /* Tags */
    .technique-tag, .coaching-tag {
      display: inline-block;
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      margin-top: 0.5rem;
      margin-right: 0.5rem;
    }
    
    .technique-tag {
      background: var(--candidate);
      color: white;
    }
    
    .coaching-tag {
      background: #f59e0b;
      color: white;
    }
    
    .subtext-note {
      margin-top: 0.75rem;
      padding: 0.5rem;
      background: rgba(99, 102, 241, 0.2);
      border-radius: 8px;
      font-size: 0.85rem;
      color: var(--interviewer);
    }
    
    /* Decision Panel */
    .decision-panel {
      background: linear-gradient(135deg, #1e1e3f 0%, #2d2d5a 100%);
    }
    
    .decision-content {
      text-align: center;
    }
    
    .decision-header {
      font-family: 'Bangers', cursive;
      font-size: 1.5rem;
      color: var(--accent);
      margin-bottom: 1rem;
    }
    
    .decision-question {
      font-size: 1.2rem;
      margin-bottom: 1.5rem;
      color: var(--text);
    }
    
    .decision-options {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .decision-option {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: var(--panel-bg);
      border: 3px solid var(--border);
      border-radius: 12px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .decision-option:hover {
      border-color: var(--accent);
      transform: translateX(5px);
    }
    
    .decision-option.selected.correct {
      border-color: var(--candidate);
      background: rgba(34, 197, 94, 0.2);
    }
    
    .decision-option.selected.wrong {
      border-color: var(--accent);
      opacity: 0.6;
    }
    
    .option-letter {
      width: 40px;
      height: 40px;
      background: var(--accent);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Bangers', cursive;
      font-size: 1.2rem;
      flex-shrink: 0;
    }
    
    .option-text {
      text-align: left;
    }
    
    .option-choice {
      font-weight: 700;
    }
    
    .option-outcome, .option-score {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }
    
    .hidden { display: none; }
    
    .best-answer {
      margin-top: 1.5rem;
      padding: 1rem;
      background: rgba(34, 197, 94, 0.2);
      border-radius: 12px;
      color: var(--candidate);
      font-weight: 700;
    }
    
    /* Insights Panel */
    .insights-panel {
      background: linear-gradient(135deg, #1a3a1a 0%, #2d4a2d 100%);
    }
    
    .insights-header {
      font-family: 'Bangers', cursive;
      font-size: 1.3rem;
      color: var(--candidate);
      margin-bottom: 1rem;
    }
    
    .insights-list {
      list-style: none;
    }
    
    .insights-list li {
      padding: 0.5rem 0;
      padding-left: 1.5rem;
      position: relative;
    }
    
    .insights-list li::before {
      content: '💡';
      position: absolute;
      left: 0;
    }
    
    /* Resolution Panel */
    .resolution-panel {
      background: linear-gradient(135deg, var(--accent) 0%, #ff6b6b 100%);
      text-align: center;
    }
    
    .resolution-header {
      font-family: 'Bangers', cursive;
      font-size: 2rem;
      color: white;
      text-shadow: 2px 2px 0 #000;
      margin-bottom: 1rem;
    }
    
    .outcome-badge {
      display: inline-block;
      padding: 0.75rem 2rem;
      border-radius: 100px;
      font-family: 'Bangers', cursive;
      font-size: 1.5rem;
      border: 3px solid #000;
      margin-bottom: 1.5rem;
    }
    
    .outcome-badge.hire {
      background: var(--candidate);
      color: white;
    }
    
    .outcome-badge.strong-hire {
      background: #15803d;
      color: white;
    }
    
    .outcome-badge.no-hire {
      background: #dc2626;
      color: white;
    }
    
    .takeaways {
      background: rgba(0,0,0,0.3);
      padding: 1.5rem;
      border-radius: 12px;
      text-align: left;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .takeaways h4 {
      margin-bottom: 1rem;
      color: white;
    }
    
    .takeaways ol {
      padding-left: 1.5rem;
    }
    
    .takeaways li {
      margin-bottom: 0.5rem;
      color: rgba(255,255,255,0.9);
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .comic-title { font-size: 2rem; }
      .comic-grid { grid-template-columns: 1fr; }
      .panel-content { flex-direction: column; align-items: center; }
      .character-img { width: 100px; height: 150px; }
      .speech-bubble::before, .speech-bubble::after { display: none; }
    }
  </style>
</head>
<body>
  <div class="comic-container">
    <header class="comic-header">
      <h1 class="comic-title">${ep.title || 'Interview Theater'}</h1>
      <p class="comic-subtitle">${ep.synopsis || 'An interactive interview experience'}</p>
      <div class="comic-meta">
        <span class="meta-badge">⏱️ ${ep.duration_estimate || '15-20 min'}</span>
        <span class="meta-badge">📊 ${ep.difficulty || 'intermediate'}</span>
        <span class="meta-badge">🎭 ${(ep.tags || []).join(', ')}</span>
      </div>
    </header>
    
    <div class="comic-grid">
      ${panelsHTML}
    </div>
  </div>
  
  <script>
    function revealDecision(el, sceneNum, isCorrect) {
      const parent = el.closest('.decision-options');
      const options = parent.querySelectorAll('.decision-option');
      
      options.forEach(opt => {
        opt.querySelectorAll('.hidden').forEach(h => h.classList.remove('hidden'));
        if (opt === el) {
          opt.classList.add('selected', isCorrect ? 'correct' : 'wrong');
        }
      });
      
      const bestAnswer = document.getElementById('best-' + sceneNum);
      if (bestAnswer) bestAnswer.classList.remove('hidden');
    }
  </script>
</body>
</html>`;
}


// Main function
async function generateComicStrip() {
  console.log('🎨 Comic Strip Generator');
  console.log('========================');
  
  let episode;
  let outputDir;
  
  // Load or generate episode
  if (episodeDir) {
    // Load existing episode
    const episodeFile = path.join(episodeDir, 'episode-data.json');
    if (!fs.existsSync(episodeFile)) {
      console.error(`❌ Episode file not found: ${episodeFile}`);
      process.exit(1);
    }
    episode = JSON.parse(fs.readFileSync(episodeFile, 'utf-8'));
    outputDir = episodeDir;
    console.log(`📂 Loading episode from: ${episodeDir}`);
  } else if (topic) {
    // Generate new episode first
    console.log(`🎬 Generating new episode for: ${topic}`);
    const { execSync } = await import('child_process');
    
    try {
      const result = execSync(
        `node script/generate-interview-theater.js --topic "${topic}" --level ${candidateLevel} --style ${interviewStyle}`,
        { encoding: 'utf-8', cwd: path.join(__dirname, '..') }
      );
      console.log(result);
      
      // Find the latest episode
      const theaterDir = path.join(__dirname, '..', 'blog-output', 'theater');
      const episodes = fs.readdirSync(theaterDir)
        .filter(f => f.startsWith('episode-'))
        .sort()
        .reverse();
      
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
    // Find the latest episode
    const theaterDir = path.join(__dirname, '..', 'blog-output', 'theater');
    if (!fs.existsSync(theaterDir)) {
      console.error('❌ No theater directory found. Generate an episode first.');
      console.log('   Run: node script/generate-interview-theater.js --topic "Your Topic"');
      process.exit(1);
    }
    
    const episodes = fs.readdirSync(theaterDir)
      .filter(f => f.startsWith('episode-'))
      .sort()
      .reverse();
    
    if (episodes.length === 0) {
      console.error('❌ No episodes found. Generate an episode first.');
      process.exit(1);
    }
    
    outputDir = path.join(theaterDir, episodes[0]);
    episode = JSON.parse(fs.readFileSync(path.join(outputDir, 'episode-data.json'), 'utf-8'));
    console.log(`📂 Using latest episode: ${episodes[0]}`);
  }
  
  console.log('');
  console.log('🎨 Generating comic strip...');
  
  // Generate comic HTML
  const comicHTML = generateComicHTML(episode);
  
  // Save comic strip
  const comicFile = path.join(outputDir, 'comic-strip.html');
  fs.writeFileSync(comicFile, comicHTML);
  
  console.log('');
  console.log('✅ Comic strip generated successfully!');
  console.log(`📁 Output: ${comicFile}`);
  console.log('');
  console.log('🎨 Comic Details:');
  console.log(`   Title: ${episode.episode?.title || 'Interview Comic'}`);
  console.log(`   Scenes: ${episode.scenes?.length || 0}`);
  console.log(`   Panels: ${countPanels(episode)}`);
  
  return comicFile;
}

function countPanels(episode) {
  let count = 0;
  (episode.scenes || []).forEach(scene => {
    count += 1; // Scene title
    count += (scene.dialogue || []).length;
    if (scene.decision_point) count += 1;
    if (scene.key_insights?.length > 0) count += 1;
  });
  if (episode.resolution?.outcome) count += 1;
  return count;
}

// Run
generateComicStrip();
