#!/usr/bin/env node
/**
 * Dynamically generates channel lists from channels-config.ts
 * Used by GitHub Actions workflows to avoid hardcoded channel lists
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, '../client/src/lib/channels-config.ts');

// Parse the channels config file
function parseChannelsConfig() {
  const content = fs.readFileSync(configPath, 'utf-8');
  
  // Extract channel objects using regex
  const channelRegex = /{\s*id:\s*['"]([^'"]+)['"]/g;
  const certificationRegex = /id:\s*['"]([^'"]+)['"][^}]*isCertification:\s*true/gs;
  const fundamentalsRegex = /id:\s*['"]([^'"]+)['"][^}]*category:\s*['"]fundamentals['"]/gs;
  
  const allChannels = [];
  const certChannels = [];
  const fundamentalsChannels = [];
  
  // Get all channel IDs
  let match;
  while ((match = channelRegex.exec(content)) !== null) {
    allChannels.push(match[1]);
  }
  
  // Get certification channels
  const certMatches = content.matchAll(/{\s*id:\s*['"]([^'"]+)['"][^}]*isCertification:\s*true[^}]*}/gs);
  for (const m of certMatches) {
    const idMatch = m[0].match(/id:\s*['"]([^'"]+)['"]/);
    if (idMatch) certChannels.push(idMatch[1]);
  }
  
  // Get fundamentals channels
  const fundMatches = content.matchAll(/{\s*id:\s*['"]([^'"]+)['"][^}]*category:\s*['"]fundamentals['"][^}]*}/gs);
  for (const m of fundMatches) {
    const idMatch = m[0].match(/id:\s*['"]([^'"]+)['"]/);
    if (idMatch) fundamentalsChannels.push(idMatch[1]);
  }
  
  return { allChannels, certChannels, fundamentalsChannels };
}

// Main execution
const { allChannels, certChannels, fundamentalsChannels } = parseChannelsConfig();

const outputType = process.argv[2] || 'all';

switch (outputType) {
  case 'fundamentals':
  case 'new':
    console.log(fundamentalsChannels.join(','));
    break;
  case 'certifications':
  case 'cert':
    console.log(certChannels.join(','));
    break;
  case 'all':
    console.log(allChannels.join(','));
    break;
  case 'json':
    console.log(JSON.stringify({
      fundamentals: fundamentalsChannels,
      certifications: certChannels,
      all: allChannels
    }, null, 2));
    break;
  default:
    console.error(`Unknown output type: ${outputType}`);
    console.error('Usage: node get-channel-lists.js [fundamentals|certifications|all|json]');
    process.exit(1);
}
