import fs from 'fs';
import {
  QUESTIONS_DIR,
  loadChannelQuestions,
  saveChannelQuestions,
  calculateSimilarity,
  updateIndexFile,
  writeGitHubOutput,
  getQuestionsFile
} from './utils.js';

const SIMILARITY_THRESHOLD = 0.6;

function getAllChannels() {
  try {
    return fs.readdirSync(QUESTIONS_DIR)
      .filter(f => f.endsWith('.json') && f !== 'index.ts')
      .map(f => f.replace('.json', ''));
  } catch (e) {
    return [];
  }
}

function findDuplicates(questions, threshold = SIMILARITY_THRESHOLD) {
  const duplicates = [];
  
  for (let i = 0; i < questions.length; i++) {
    for (let j = i + 1; j < questions.length; j++) {
      const similarity = calculateSimilarity(
        questions[i].question,
        questions[j].question
      );
      
      if (similarity >= threshold) {
        duplicates.push({
          q1: questions[i],
          q2: questions[j],
          similarity: similarity.toFixed(2)
        });
      }
    }
  }
  
  return duplicates;
}

async function main() {
  console.log('=== Question Deduplication Bot ===\n');

  const channels = getAllChannels();
  console.log(`Found ${channels.length} channels\n`);

  if (channels.length === 0) {
    console.log('No channels found.');
    return;
  }

  // Select random channel
  const selectedChannel = channels[Math.floor(Math.random() * channels.length)];
  console.log(`Analyzing channel: ${selectedChannel}\n`);

  const questions = loadChannelQuestions(selectedChannel);
  console.log(`Loaded ${questions.length} questions from ${selectedChannel}`);

  const duplicates = findDuplicates(questions);
  console.log(`Found ${duplicates.length} duplicate pairs\n`);

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found!');
    writeGitHubOutput({
      removed_count: 0,
      total_questions: questions.length,
      channel: selectedChannel
    });
    return;
  }

  // Remove at most 1 duplicate per run
  const toRemove = duplicates[0];
  
  console.log('Duplicate Pair Found:');
  console.log(`  Q1 [${toRemove.q1.id}]: ${toRemove.q1.question.substring(0, 60)}...`);
  console.log(`  Q2 [${toRemove.q2.id}]: ${toRemove.q2.question.substring(0, 60)}...`);
  console.log(`  Similarity: ${toRemove.similarity}`);

  // Keep older question, remove newer one
  const q1Date = new Date(toRemove.q1.lastUpdated || 0).getTime();
  const q2Date = new Date(toRemove.q2.lastUpdated || 0).getTime();
  
  const toRemoveId = q1Date < q2Date ? toRemove.q2.id : toRemove.q1.id;
  const toKeepId = q1Date < q2Date ? toRemove.q1.id : toRemove.q2.id;

  console.log(`\nKeeping: ${toKeepId} (older)`);
  console.log(`Removing: ${toRemoveId} (newer)`);

  // Remove the duplicate
  const filtered = questions.filter(q => q.id !== toRemoveId);
  saveChannelQuestions(selectedChannel, filtered);
  updateIndexFile();

  console.log(`\n✅ Removed 1 duplicate from ${selectedChannel}`);
  console.log(`Questions remaining: ${filtered.length}/${questions.length}`);

  writeGitHubOutput({
    removed_count: 1,
    removed_id: toRemoveId,
    kept_id: toKeepId,
    total_questions: filtered.length,
    channel: selectedChannel
  });
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
