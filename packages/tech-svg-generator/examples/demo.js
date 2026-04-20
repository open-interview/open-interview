/**
 * Demo script for tech-svg-generator
 * Run with: npm run demo
 */

import { generateSVG, detectScene, getAvailableScenes, THEMES } from '../dist/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, 'output');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🎨 Tech SVG Generator Demo\n');

console.log('Available scenes:', getAvailableScenes().join(', '));
console.log('Available themes:', Object.keys(THEMES).join(', '));
console.log('');

const demoTitles = [
  'Microservices Architecture Patterns',
  'Kubernetes Auto-Scaling Deep Dive',
  'PostgreSQL Replication Strategies',
  'CI/CD Pipeline Best Practices',
  'Zero Trust Security Implementation',
  'Debugging Memory Leaks in Node.js',
  'Unit Testing React Components',
  'Performance Optimization Techniques',
  'REST API Design Guidelines',
  'Observability and Monitoring Setup',
  'React Server Components Guide',
  'Successful Product Launch',
  'Incident Response: Database Outage',
  'System Overview Dashboard',
];

console.log('Generating illustrations...\n');

demoTitles.forEach((title, i) => {
  const result = generateSVG(title);
  const filename = `${String(i + 1).padStart(2, '0')}-${result.scene}.svg`;
  const filepath = path.join(outputDir, filename);
  
  fs.writeFileSync(filepath, result.svg);
  console.log(`✅ ${filename} - "${title.substring(0, 40)}..."`);
});

console.log('\n🎨 Generating theme comparison...');
const themeTitle = 'System Architecture Overview';

Object.keys(THEMES).forEach(themeName => {
  const result = generateSVG(themeTitle, '', { theme: themeName });
  const filename = `theme-${themeName}.svg`;
  fs.writeFileSync(path.join(outputDir, filename), result.svg);
  console.log(`✅ ${filename}`);
});

console.log('\n📁 Output saved to:', outputDir);
console.log('✨ Demo complete!');
