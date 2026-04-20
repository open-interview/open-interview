#!/usr/bin/env node
/**
 * Generate 100 Modern Illustrations for Analysis
 * Run: node script/generate-100-illustrations.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateModernSceneSVG, getAvailableModernScenes } from './ai/utils/modern-illustration-generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../test-svg-output/batch-100');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Sample titles for each scene type
const TITLES = {
  collaboration: [
    'Building High-Performance Teams',
    'Cross-Functional Collaboration Tips',
    'Effective Team Communication',
    'Agile Team Dynamics',
    'Collaborative Problem Solving',
    'Team Synergy Strategies',
    'Working Together Remotely',
    'Pair Programming Best Practices',
    'Team Building Activities',
    'Collaborative Design Process',
    'Knowledge Sharing Culture',
    'Team Retrospectives Guide',
    'Collective Code Ownership',
  ],
  remote: [
    'Remote Work Productivity Tips',
    'Home Office Setup Guide',
    'Virtual Team Management',
    'Work From Home Best Practices',
    'Distributed Team Communication',
    'Remote Onboarding Process',
    'Async Communication Strategies',
    'Video Call Etiquette',
    'Remote Work Life Balance',
    'Digital Nomad Lifestyle',
    'Hybrid Work Model',
    'Remote Team Building',
    'Virtual Coffee Chats',
  ],
  meeting: [
    'Effective Meeting Strategies',
    'Sprint Planning Workshop',
    'Product Demo Presentation',
    'Stakeholder Updates',
    'Technical Architecture Review',
    'Design Review Session',
    'Quarterly Business Review',
    'Team Standup Best Practices',
    'Client Presentation Tips',
    'Workshop Facilitation',
    'Decision Making Meetings',
    'Retrospective Facilitation',
    'All-Hands Meeting Guide',
  ],
  coding: [
    'Clean Code Principles',
    'Code Review Best Practices',
    'Test-Driven Development',
    'Refactoring Techniques',
    'API Design Patterns',
    'Frontend Architecture',
    'Backend Development Guide',
    'DevOps Pipeline Setup',
    'Debugging Strategies',
    'Performance Optimization',
    'Security Best Practices',
    'Database Design Patterns',
    'Microservices Architecture',
  ],
  interview: [
    'Technical Interview Preparation',
    'Hiring Best Practices',
    'Candidate Experience Guide',
    'Interview Question Design',
    'Onboarding New Engineers',
    'Career Growth Framework',
    'Performance Review Tips',
    'Talent Acquisition Strategy',
    'Building Diverse Teams',
    'Interview Feedback Process',
    'Recruiting Pipeline',
    'Job Description Writing',
    'Compensation Planning',
  ],
  success: [
    'Celebrating Team Wins',
    'Product Launch Success',
    'Milestone Achievement',
    'Goal Completion Celebration',
    'Project Delivery Success',
    'Customer Success Stories',
    'Revenue Growth Achievement',
    'Team Recognition Program',
    'Award Winning Projects',
    'Successful Deployment',
    'Breaking Records',
    'Exceeding Targets',
    'Innovation Awards',
  ],
  brainstorm: [
    'Design Thinking Workshop',
    'Innovation Ideation Session',
    'Creative Problem Solving',
    'Product Discovery Process',
    'Feature Brainstorming',
    'Strategy Planning Session',
    'User Research Synthesis',
    'Concept Development',
    'Mind Mapping Techniques',
    'Divergent Thinking',
    'Idea Validation Process',
    'Innovation Sprint',
    'Creative Collaboration',
  ],
  default: [
    'Getting Started Guide',
    'Platform Overview',
    'Quick Start Tutorial',
    'Feature Highlights',
    'Best Practices Guide',
    'Tips and Tricks',
    'User Guide',
    'Documentation Overview',
    'Learning Resources',
    'Community Guidelines',
    'FAQ and Support',
  ],
};

console.log('🎨 Generating 100 Modern Illustrations\n');
console.log(`📂 Output directory: ${OUTPUT_DIR}\n`);

const scenes = getAvailableModernScenes();
let count = 0;
const results = [];

// Generate illustrations
for (let i = 0; i < 100; i++) {
  const sceneIndex = i % scenes.length;
  const scene = scenes[sceneIndex];
  const titles = TITLES[scene] || TITLES.default;
  const titleIndex = Math.floor(i / scenes.length) % titles.length;
  const title = titles[titleIndex];
  
  try {
    const svg = generateModernSceneSVG(scene, title);
    const filename = `${String(i + 1).padStart(3, '0')}-${scene}.svg`;
    const filepath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filepath, svg);
    results.push({ index: i + 1, scene, title, status: '✅', filename });
    count++;
    
    // Progress indicator
    if ((i + 1) % 10 === 0) {
      console.log(`   Generated ${i + 1}/100 illustrations...`);
    }
  } catch (err) {
    results.push({ index: i + 1, scene, title, status: '❌', error: err.message });
    console.log(`   ❌ Error generating #${i + 1}: ${err.message}`);
  }
}

// Create an HTML gallery for easy viewing
const galleryHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>100 Modern Illustrations Gallery</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: system-ui, -apple-system, sans-serif; 
      background: #f5f5f5; 
      padding: 20px;
    }
    h1 { 
      text-align: center; 
      margin-bottom: 10px; 
      color: #333;
    }
    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
    }
    .filters {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .filter-btn {
      padding: 8px 16px;
      border: none;
      border-radius: 20px;
      background: #e0e0e0;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }
    .filter-btn:hover, .filter-btn.active {
      background: #007bff;
      color: white;
    }
    .gallery { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); 
      gap: 20px;
      max-width: 1600px;
      margin: 0 auto;
    }
    .card { 
      background: white; 
      border-radius: 12px; 
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }
    .card img { 
      width: 100%; 
      height: auto;
      display: block;
    }
    .card-info {
      padding: 12px 16px;
      border-top: 1px solid #eee;
    }
    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }
    .card-meta {
      font-size: 12px;
      color: #888;
    }
    .scene-tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 500;
      margin-right: 8px;
    }
    .scene-collaboration { background: #e3f2fd; color: #1565c0; }
    .scene-remote { background: #fce4ec; color: #c2185b; }
    .scene-meeting { background: #f3e5f5; color: #7b1fa2; }
    .scene-coding { background: #e8f5e9; color: #2e7d32; }
    .scene-interview { background: #fff3e0; color: #ef6c00; }
    .scene-success { background: #fffde7; color: #f9a825; }
    .scene-brainstorm { background: #e0f7fa; color: #00838f; }
    .scene-default { background: #f5f5f5; color: #616161; }
  </style>
</head>
<body>
  <h1>🎨 100 Modern Illustrations</h1>
  <p class="subtitle">Generated with modern-illustration-generator.js</p>
  
  <div class="filters">
    <button class="filter-btn active" onclick="filterGallery('all')">All (100)</button>
    ${scenes.map(s => `<button class="filter-btn" onclick="filterGallery('${s}')">${s}</button>`).join('\n    ')}
  </div>
  
  <div class="gallery">
    ${results.filter(r => r.status === '✅').map(r => `
    <div class="card" data-scene="${r.scene}">
      <img src="${r.filename}" alt="${r.title}" loading="lazy">
      <div class="card-info">
        <div class="card-title">${r.title}</div>
        <div class="card-meta">
          <span class="scene-tag scene-${r.scene}">${r.scene}</span>
          #${r.index}
        </div>
      </div>
    </div>`).join('')}
  </div>
  
  <script>
    function filterGallery(scene) {
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
      
      document.querySelectorAll('.card').forEach(card => {
        if (scene === 'all' || card.dataset.scene === scene) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    }
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'gallery.html'), galleryHtml);

// Summary
console.log(`\n✅ Generated ${count}/100 illustrations successfully!`);
console.log(`\n📊 Breakdown by scene type:`);
scenes.forEach(scene => {
  const sceneCount = results.filter(r => r.scene === scene && r.status === '✅').length;
  console.log(`   ${scene}: ${sceneCount} illustrations`);
});

console.log(`\n📂 Files saved to: ${OUTPUT_DIR}`);
console.log(`\n🌐 Open the gallery in your browser:`);
console.log(`   open "${OUTPUT_DIR}/gallery.html"`);
