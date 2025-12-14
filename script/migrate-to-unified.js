#!/usr/bin/env node
/**
 * Migration script to convert existing per-channel question files
 * to the new unified storage format.
 * 
 * Old format: client/src/lib/questions/{channel}.json (array of questions)
 * New format: 
 *   - all-questions.json (all questions by ID)
 *   - channel-mappings.json (channel -> subchannel -> question IDs)
 */

import fs from 'fs';
import path from 'path';

const QUESTIONS_DIR = 'client/src/lib/questions';
const ALL_QUESTIONS_FILE = `${QUESTIONS_DIR}/all-questions.json`;
const CHANNEL_MAPPINGS_FILE = `${QUESTIONS_DIR}/channel-mappings.json`;

console.log('=== Migrating to Unified Question Storage ===\n');

// Get all existing channel JSON files
const channelFiles = fs.readdirSync(QUESTIONS_DIR)
  .filter(f => f.endsWith('.json') && 
    !f.includes('backup') && 
    f !== 'all-questions.json' && 
    f !== 'channel-mappings.json' &&
    f !== 'index.ts');

console.log(`Found ${channelFiles.length} channel files to migrate\n`);

const allQuestions = {};
const channelMappings = {};
let totalQuestions = 0;
let duplicatesSkipped = 0;

// Process each channel file
for (const file of channelFiles) {
  const channel = file.replace('.json', '');
  const filePath = path.join(QUESTIONS_DIR, file);
  
  console.log(`Processing ${channel}...`);
  
  try {
    const questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!Array.isArray(questions)) {
      console.log(`  ⚠️ Skipping - not an array`);
      continue;
    }
    
    // Initialize channel mapping
    if (!channelMappings[channel]) {
      channelMappings[channel] = { subChannels: {} };
    }
    
    for (const q of questions) {
      // Check for duplicate by ID
      if (allQuestions[q.id]) {
        // Question already exists - just add mapping
        duplicatesSkipped++;
      } else {
        // Add question to unified storage
        allQuestions[q.id] = {
          id: q.id,
          question: q.question,
          answer: q.answer,
          explanation: q.explanation,
          diagram: q.diagram,
          difficulty: q.difficulty,
          tags: q.tags || [],
          lastUpdated: q.lastUpdated || new Date().toISOString()
        };
        totalQuestions++;
      }
      
      // Add channel mapping
      const subChannel = q.subChannel || 'general';
      if (!channelMappings[channel].subChannels[subChannel]) {
        channelMappings[channel].subChannels[subChannel] = [];
      }
      if (!channelMappings[channel].subChannels[subChannel].includes(q.id)) {
        channelMappings[channel].subChannels[subChannel].push(q.id);
      }
    }
    
    console.log(`  ✅ Migrated ${questions.length} questions`);
    
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
  }
}

// Save unified storage
console.log('\nSaving unified storage...');

fs.writeFileSync(ALL_QUESTIONS_FILE, JSON.stringify({
  questions: allQuestions,
  lastUpdated: new Date().toISOString()
}, null, 2));

fs.writeFileSync(CHANNEL_MAPPINGS_FILE, JSON.stringify({
  channels: channelMappings,
  lastUpdated: new Date().toISOString()
}, null, 2));

// Generate new index file
const indexContent = `// Auto-generated index file for unified question storage
import allQuestionsData from "./all-questions.json";
import channelMappingsData from "./channel-mappings.json";

export const questionsById: Record<string, any> = allQuestionsData.questions || {};
export const channelMappings: Record<string, any> = channelMappingsData.channels || {};

// Get all questions as array
export const allQuestions = Object.values(questionsById);

// Get questions for a channel
export function getQuestionsForChannel(channel: string): any[] {
  const mapping = channelMappings[channel];
  if (!mapping) return [];
  
  const ids = new Set<string>();
  Object.values(mapping.subChannels || {}).forEach((subIds: any) => {
    (subIds as string[]).forEach(id => ids.add(id));
  });
  
  return Array.from(ids).map(id => questionsById[id]).filter(q => q != null);
}

// Get questions for a subchannel
export function getQuestionsForSubChannel(channel: string, subChannel: string): any[] {
  const ids = channelMappings[channel]?.subChannels?.[subChannel] || [];
  return ids.map((id: string) => questionsById[id]).filter((q: any) => q != null);
}

// Legacy compatibility - questions by channel
export const questionsByChannel: Record<string, any[]> = {};
Object.keys(channelMappings).forEach(channel => {
  questionsByChannel[channel] = getQuestionsForChannel(channel);
});
`;

fs.writeFileSync(`${QUESTIONS_DIR}/index.ts`, indexContent);

// Print summary
console.log('\n=== MIGRATION SUMMARY ===');
console.log(`Total Unique Questions: ${totalQuestions}`);
console.log(`Duplicate References: ${duplicatesSkipped}`);
console.log(`Channels: ${Object.keys(channelMappings).length}`);

console.log('\nChannel breakdown:');
Object.entries(channelMappings).forEach(([channel, data]) => {
  const subChannels = Object.keys(data.subChannels || {});
  const totalIds = Object.values(data.subChannels || {}).flat().length;
  console.log(`  ${channel}: ${totalIds} questions across ${subChannels.length} sub-channels`);
});

console.log('\n✅ Migration complete!');
console.log('\nNote: Old channel files are preserved. You can delete them after verifying the migration.');
