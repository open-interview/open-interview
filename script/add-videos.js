import {
  loadUnifiedQuestions,
  saveUnifiedQuestions,
  getAllUnifiedQuestions,
  runWithRetries,
  parseJson,
  updateUnifiedIndexFile,
  writeGitHubOutput,
  validateYouTubeVideos
} from './utils.js';
import fs from 'fs';

// State file to track progress across runs
const STATE_FILE = 'client/src/lib/questions/video-bot-state.json';
const BATCH_SIZE = 10;

// Load bot state
function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (e) {
    return {
      lastProcessedIndex: 0,
      lastRunDate: null,
      totalProcessed: 0,
      totalVideosAdded: 0
    };
  }
}

// Save bot state
function saveState(state) {
  state.lastRunDate = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Check if a question needs video work
function needsVideoWork(question) {
  const videos = question.videos || {};
  const hasShort = videos.shortVideo && videos.shortVideo.length > 10;
  const hasLong = videos.longVideo && videos.longVideo.length > 10;
  
  // Needs work if missing either video
  return !hasShort || !hasLong;
}

// Search for relevant YouTube videos using AI
async function findVideosForQuestion(question) {
  const prompt = `You are a JSON generator. Output ONLY valid JSON, no explanations, no markdown, no text before or after.

Find real YouTube videos for this interview question.

Question: "${question.question}"
Topic: ${question.tags?.slice(0, 3).join(', ') || 'technical interview'}

Return REAL video URLs that exist and are educational. Use well-known channels like freeCodeCamp, Fireship, Traversy Media, ByteByteGo, Hussein Nasser.
shortVideo: Under 5 minutes. longVideo: 10-60 minutes.

Output this exact JSON structure:
{"shortVideo":"https://youtube.com/watch?v=REAL_ID or null","longVideo":"https://youtube.com/watch?v=REAL_ID or null","confidence":"high|medium|low"}

IMPORTANT: Return ONLY the JSON object. No other text.`;

  const response = await runWithRetries(prompt);
  if (!response) return null;
  
  const data = parseJson(response);
  if (!data) return null;
  
  return {
    shortVideo: data.shortVideo || null,
    longVideo: data.longVideo || null,
    confidence: data.confidence || 'low'
  };
}

async function main() {
  console.log('=== Video Bot - Add/Validate YouTube Videos ===\n');
  
  const state = loadState();
  const allQuestions = getAllUnifiedQuestions();
  
  console.log(`📊 Database: ${allQuestions.length} questions`);
  console.log(`📍 Last processed index: ${state.lastProcessedIndex}`);
  console.log(`📅 Last run: ${state.lastRunDate || 'Never'}\n`);
  
  // Sort questions by ID for consistent ordering
  const sortedQuestions = [...allQuestions].sort((a, b) => {
    // Extract numeric part for proper sorting
    const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
    return numA - numB;
  });
  
  // Calculate start index (wrap around if needed)
  let startIndex = state.lastProcessedIndex;
  if (startIndex >= sortedQuestions.length) {
    startIndex = 0;
    console.log('🔄 Wrapped around to beginning of question list\n');
  }
  
  // Get batch of questions to process
  const endIndex = Math.min(startIndex + BATCH_SIZE, sortedQuestions.length);
  const batch = sortedQuestions.slice(startIndex, endIndex);
  
  console.log(`📦 Processing batch: questions ${startIndex + 1} to ${endIndex} of ${sortedQuestions.length}\n`);
  
  const questions = loadUnifiedQuestions();
  const results = {
    processed: 0,
    videosAdded: 0,
    videosValidated: 0,
    videosReplaced: 0,
    skipped: 0,
    failed: 0
  };
  
  for (let i = 0; i < batch.length; i++) {
    const question = batch[i];
    const globalIndex = startIndex + i + 1;
    
    console.log(`\n--- [${globalIndex}/${sortedQuestions.length}] ${question.id} ---`);
    console.log(`Q: ${question.question.substring(0, 60)}...`);
    
    const currentVideos = question.videos || {};
    const hasShort = currentVideos.shortVideo && currentVideos.shortVideo.length > 10;
    const hasLong = currentVideos.longVideo && currentVideos.longVideo.length > 10;
    
    console.log(`Current: short=${hasShort ? '✓' : '✗'}, long=${hasLong ? '✓' : '✗'}`);
    
    // Step 1: Validate existing videos
    if (hasShort || hasLong) {
      console.log('🔍 Validating existing videos...');
      const validated = await validateYouTubeVideos(currentVideos);
      
      let needsReplacement = false;
      
      if (hasShort && !validated.shortVideo) {
        console.log('  ⚠️ Short video invalid, needs replacement');
        needsReplacement = true;
        currentVideos.shortVideo = null;
      }
      
      if (hasLong && !validated.longVideo) {
        console.log('  ⚠️ Long video invalid, needs replacement');
        needsReplacement = true;
        currentVideos.longVideo = null;
      }
      
      if (!needsReplacement && hasShort && hasLong) {
        console.log('  ✅ Both videos valid, skipping');
        results.videosValidated++;
        results.skipped++;
        continue;
      }
    }
    
    // Step 2: Find new videos if needed
    const needsShort = !currentVideos.shortVideo;
    const needsLong = !currentVideos.longVideo;
    
    if (needsShort || needsLong) {
      console.log(`🔎 Searching for videos (need: ${needsShort ? 'short ' : ''}${needsLong ? 'long' : ''})...`);
      
      const foundVideos = await findVideosForQuestion(question);
      
      if (!foundVideos) {
        console.log('  ❌ AI search failed');
        results.failed++;
        results.processed++;
        continue;
      }
      
      console.log(`  Found: short=${foundVideos.shortVideo ? '✓' : '✗'}, long=${foundVideos.longVideo ? '✓' : '✗'} (confidence: ${foundVideos.confidence})`);
      
      // Validate found videos
      console.log('  🔍 Validating found videos...');
      const validatedNew = await validateYouTubeVideos(foundVideos);
      
      let updated = false;
      
      if (needsShort && validatedNew.shortVideo) {
        currentVideos.shortVideo = validatedNew.shortVideo;
        results.videosAdded++;
        updated = true;
        console.log('  ✅ Added short video');
      }
      
      if (needsLong && validatedNew.longVideo) {
        currentVideos.longVideo = validatedNew.longVideo;
        results.videosAdded++;
        updated = true;
        console.log('  ✅ Added long video');
      }
      
      if (updated) {
        // Update question in storage
        questions[question.id] = {
          ...questions[question.id],
          videos: currentVideos,
          lastVideoUpdate: new Date().toISOString()
        };
        
        // Save immediately after each update to prevent data loss on timeout
        saveUnifiedQuestions(questions);
        console.log('  💾 Saved to database');
        
        results.videosReplaced++;
      } else {
        console.log('  ⚠️ No valid videos found');
      }
    }
    
    results.processed++;
    
    // Update state after each question to track progress
    const currentState = {
      lastProcessedIndex: startIndex + i + 1,
      lastRunDate: new Date().toISOString(),
      totalProcessed: state.totalProcessed + results.processed,
      totalVideosAdded: state.totalVideosAdded + results.videosAdded
    };
    saveState(currentState);
  }
  
  // Final save and index update
  saveUnifiedQuestions(questions);
  updateUnifiedIndexFile();
  
  // Final state update (wrap around if needed)
  const newState = {
    lastProcessedIndex: endIndex >= sortedQuestions.length ? 0 : endIndex,
    lastRunDate: new Date().toISOString(),
    totalProcessed: state.totalProcessed + results.processed,
    totalVideosAdded: state.totalVideosAdded + results.videosAdded
  };
  saveState(newState);
  
  // Summary
  console.log('\n\n=== SUMMARY ===');
  console.log(`Processed: ${results.processed}`);
  console.log(`Videos Added: ${results.videosAdded}`);
  console.log(`Videos Validated: ${results.videosValidated}`);
  console.log(`Questions Updated: ${results.videosReplaced}`);
  console.log(`Skipped (complete): ${results.skipped}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`\nNext run will start at index: ${newState.lastProcessedIndex}`);
  console.log(`Total processed (all time): ${newState.totalProcessed}`);
  console.log(`Total videos added (all time): ${newState.totalVideosAdded}`);
  console.log('=== END ===\n');
  
  writeGitHubOutput({
    processed: results.processed,
    videos_added: results.videosAdded,
    videos_validated: results.videosValidated,
    questions_updated: results.videosReplaced,
    skipped: results.skipped,
    failed: results.failed,
    next_index: newState.lastProcessedIndex
  });
}

main().catch(e => {
  console.error('Fatal:', e);
  writeGitHubOutput({
    error: e.message,
    processed: 0
  });
  process.exit(1);
});
