import {
  loadUnifiedQuestions,
  saveUnifiedQuestions,
  loadChannelMappings,
  saveChannelMappings,
  getAllUnifiedQuestions,
  runWithRetries,
  parseJson,
  validateQuestion,
  updateUnifiedIndexFile,
  writeGitHubOutput,
  logQuestionsImproved,
  validateYouTubeVideos,
  normalizeCompanies
} from './utils.js';

// Available channels and their subchannels for remapping
const CHANNEL_STRUCTURE = {
  'system-design': ['infrastructure', 'distributed-systems', 'api-design', 'caching', 'load-balancing', 'message-queues'],
  'algorithms': ['data-structures', 'sorting', 'dynamic-programming', 'graphs', 'trees'],
  'frontend': ['react', 'javascript', 'css', 'performance', 'web-apis'],
  'backend': ['apis', 'microservices', 'caching', 'authentication', 'server-architecture'],
  'database': ['sql', 'nosql', 'indexing', 'transactions', 'query-optimization'],
  'devops': ['cicd', 'docker', 'automation', 'gitops'],
  'sre': ['observability', 'reliability', 'incident-management', 'chaos-engineering', 'capacity-planning'],
  'kubernetes': ['pods', 'services', 'deployments', 'helm', 'operators'],
  'aws': ['compute', 'storage', 'serverless', 'database', 'networking'],
  'terraform': ['basics', 'modules', 'state-management', 'best-practices'],
  'data-engineering': ['etl', 'data-pipelines', 'warehousing', 'streaming'],
  'machine-learning': ['algorithms', 'model-training', 'deployment', 'deep-learning', 'evaluation'],
  'generative-ai': ['llm-fundamentals', 'fine-tuning', 'rag', 'agents', 'evaluation'],
  'prompt-engineering': ['techniques', 'optimization', 'safety', 'structured-output'],
  'llm-ops': ['deployment', 'optimization', 'monitoring', 'infrastructure'],
  'computer-vision': ['image-classification', 'object-detection', 'segmentation', 'multimodal'],
  'nlp': ['text-processing', 'embeddings', 'sequence-models', 'transformers'],
  'python': ['fundamentals', 'libraries', 'best-practices', 'async'],
  'security': ['application-security', 'owasp', 'encryption', 'authentication'],
  'networking': ['tcp-ip', 'dns', 'load-balancing', 'cdn'],
  'ios': ['swift', 'uikit', 'swiftui', 'architecture'],
  'android': ['kotlin', 'jetpack-compose', 'architecture', 'lifecycle'],
  'react-native': ['components', 'native-modules', 'performance', 'architecture'],
  'testing': ['unit-testing', 'integration-testing', 'tdd', 'test-strategies'],
  'e2e-testing': ['playwright', 'cypress', 'selenium', 'visual-testing'],
  'api-testing': ['rest-testing', 'contract-testing', 'graphql-testing', 'mocking'],
  'performance-testing': ['load-testing', 'stress-testing', 'profiling', 'benchmarking'],
  'engineering-management': ['team-leadership', 'one-on-ones', 'hiring', 'project-management'],
  'behavioral': ['star-method', 'leadership-principles', 'soft-skills', 'conflict-resolution']
};

// Get all channels from mappings
function getAllChannels() {
  const mappings = loadChannelMappings();
  return Object.keys(mappings);
}

// Find current channel and subchannel for a question ID
function findQuestionLocation(questionId, mappings) {
  for (const [channel, channelData] of Object.entries(mappings)) {
    for (const [subChannel, ids] of Object.entries(channelData.subChannels || {})) {
      if (ids.includes(questionId)) {
        return { channel, subChannel };
      }
    }
  }
  return { channel: 'unknown', subChannel: 'general' };
}

// Get questions that belong to a specific channel
function getQuestionsForChannel(channel) {
  const questions = loadUnifiedQuestions();
  const mappings = loadChannelMappings();
  
  const channelMapping = mappings[channel];
  if (!channelMapping) return [];
  
  const questionIds = new Set();
  Object.values(channelMapping.subChannels || {}).forEach(ids => {
    ids.forEach(id => questionIds.add(id));
  });
  
  return Array.from(questionIds)
    .map(id => ({ ...questions[id], _channel: channel }))
    .filter(q => q.id != null);
}

function needsImprovement(q) {
  const issues = [];
  if (!q.answer || q.answer.length < 20) issues.push('short_answer');
  if (!q.answer || q.answer.length > 300) issues.push('long_answer');
  if (!q.explanation || q.explanation.length < 50) issues.push('short_explanation');
  if (!q.diagram || q.diagram.length < 10) issues.push('no_diagram');
  if (q.explanation && q.explanation.includes('[truncated')) issues.push('truncated');
  if (!q.question.endsWith('?')) issues.push('no_question_mark');
  if (!q.sourceUrl) issues.push('no_source_url');
  if (!q.videos?.shortVideo) issues.push('no_short_video');
  if (!q.videos?.longVideo) issues.push('no_long_video');
  
  // Stricter company requirements - need at least 2 companies
  if (!q.companies || q.companies.length < 2) issues.push('no_companies');
  
  // Check for interview context in explanation
  const hasInterviewContext = q.explanation && (
    q.explanation.toLowerCase().includes('interview') ||
    q.explanation.toLowerCase().includes('commonly asked') ||
    q.explanation.toLowerCase().includes('interviewers') ||
    q.explanation.includes('## Interview Context') ||
    q.explanation.includes('## Strong Answer') ||
    q.explanation.includes('## Follow-up')
  );
  if (!hasInterviewContext) issues.push('missing_interview_context');
  
  return issues;
}

// AI-powered remapping function
async function remapQuestionsWithAI(questionsToRemap, mappings) {
  console.log('\n=== AI-Powered Question Remapping ===\n');
  
  const remappedQuestions = [];
  const failedRemaps = [];
  const checkedIds = []; // Track all questions we checked (for lastRemapped update)
  
  // Build channel structure string for prompt
  const channelStructureStr = Object.entries(CHANNEL_STRUCTURE)
    .map(([ch, subs]) => `${ch}: [${subs.join(', ')}]`)
    .join('\n');
  
  for (let i = 0; i < questionsToRemap.length; i++) {
    const question = questionsToRemap[i];
    
    // Look up current channel/subchannel from mappings
    const currentLocation = findQuestionLocation(question.id, mappings);
    
    console.log(`\nRemapping ${i + 1}/${questionsToRemap.length}: ${question.id}`);
    console.log(`  Current: ${currentLocation.channel}/${currentLocation.subChannel}`);
    console.log(`  Q: ${question.question.substring(0, 60)}...`);
    
    // Optimized prompt for remapping - strict JSON-only instruction
    const prompt = `You are a JSON generator. Output ONLY valid JSON, no explanations, no markdown, no text before or after.

Categorize this question into best channel/subchannel.

Q: "${question.question.substring(0, 100)}"
Tags: ${(question.tags || []).slice(0, 4).join(', ')}
Current: ${currentLocation.channel}/${currentLocation.subChannel}

Available channels: ${Object.keys(CHANNEL_STRUCTURE).join(', ')}

Output this exact JSON structure:
{"channel":"channel-id","subChannel":"sub-id","reason":"brief reason"}

IMPORTANT: Return ONLY the JSON object. No other text.`;

    // Log the prompt
    console.log('\n📝 PROMPT:');
    console.log(prompt);

    const response = await runWithRetries(prompt);
    
    if (!response) {
      console.log('  ❌ AI failed after retries');
      failedRemaps.push({ id: question.id, reason: 'AI timeout' });
      continue;
    }
    
    const data = parseJson(response);
    
    if (!data || !data.channel || !data.subChannel) {
      console.log('  ❌ Invalid response format');
      failedRemaps.push({ id: question.id, reason: 'Invalid JSON' });
      continue;
    }
    
    // Validate channel and subchannel exist
    if (!CHANNEL_STRUCTURE[data.channel]) {
      console.log(`  ❌ Invalid channel: ${data.channel}`);
      failedRemaps.push({ id: question.id, reason: `Invalid channel: ${data.channel}` });
      continue;
    }
    
    if (!CHANNEL_STRUCTURE[data.channel].includes(data.subChannel) && data.subChannel !== 'general') {
      console.log(`  ⚠️ SubChannel ${data.subChannel} not in ${data.channel}, using 'general'`);
      data.subChannel = 'general';
    }
    
    // Track that we checked this question
    checkedIds.push(question.id);
    
    const changed = data.channel !== currentLocation.channel || data.subChannel !== currentLocation.subChannel;
    
    if (changed) {
      // Remove from old location
      const oldChannel = mappings[currentLocation.channel];
      if (oldChannel?.subChannels) {
        for (const ids of Object.values(oldChannel.subChannels)) {
          const idx = ids.indexOf(question.id);
          if (idx !== -1) {
            ids.splice(idx, 1);
            break;
          }
        }
      }
      
      // Add to new location
      if (!mappings[data.channel]) {
        mappings[data.channel] = { subChannels: {} };
      }
      if (!mappings[data.channel].subChannels[data.subChannel]) {
        mappings[data.channel].subChannels[data.subChannel] = [];
      }
      if (!mappings[data.channel].subChannels[data.subChannel].includes(question.id)) {
        mappings[data.channel].subChannels[data.subChannel].push(question.id);
      }
      
      remappedQuestions.push({
        id: question.id,
        from: `${currentLocation.channel}/${currentLocation.subChannel}`,
        to: `${data.channel}/${data.subChannel}`,
        reason: data.reason
      });
      
      console.log(`  ✅ Remapped: ${currentLocation.channel}/${currentLocation.subChannel} → ${data.channel}/${data.subChannel}`);
      console.log(`     Reason: ${data.reason}`);
    } else {
      console.log(`  ✓ Already optimal`);
    }
  }
  
  return { remappedQuestions, failedRemaps, checkedIds };
}

async function main() {
  console.log('=== Question Improvement Bot (Unified Storage) ===\n');
  
  // Limit parameters (0 = default behavior)
  const inputLimit = parseInt(process.env.INPUT_LIMIT || '0', 10);
  const remapLimit = inputLimit > 0 ? inputLimit : 20;
  const improveLimit = inputLimit > 0 ? inputLimit : 0; // 0 = all channels
  
  console.log(`Mode: ${improveLimit || 'all'} question(s) improvement + ${remapLimit} question remapping\n`);

  let channels = getAllChannels();
  const allQuestions = getAllUnifiedQuestions();
  let mappings = loadChannelMappings();
  
  // Apply limit to channels if specified
  if (inputLimit > 0) {
    channels = channels.sort(() => Math.random() - 0.5).slice(0, inputLimit);
    console.log(`Limited to ${inputLimit} channel(s): ${channels.join(', ')}`);
  }
  
  console.log(`Loaded ${allQuestions.length} questions from ${channels.length} channels`);

  // ========== PHASE 1: AI-POWERED REMAPPING ==========
  console.log('\n========== PHASE 1: AI-POWERED REMAPPING ==========');
  
  // Sort questions by lastRemapped (oldest first) to ensure rotation
  // Questions without lastRemapped are prioritized (never been checked)
  const sortedForRemap = [...allQuestions].sort((a, b) => {
    const dateA = new Date(a.lastRemapped || 0).getTime();
    const dateB = new Date(b.lastRemapped || 0).getTime();
    return dateA - dateB;
  });
  
  // Take questions for remapping based on limit
  const questionsToRemap = sortedForRemap.slice(0, remapLimit);
  console.log(`Selected ${questionsToRemap.length} questions for remapping check`);
  
  const { remappedQuestions, failedRemaps, checkedIds } = await remapQuestionsWithAI(questionsToRemap, mappings);
  
  // Update lastRemapped timestamp for all checked questions (even if not remapped)
  const questions = loadUnifiedQuestions();
  const now = new Date().toISOString();
  for (const id of checkedIds) {
    if (questions[id]) {
      questions[id].lastRemapped = now;
    }
  }
  saveUnifiedQuestions(questions);
  console.log(`📅 Updated lastRemapped for ${checkedIds.length} questions`);
  
  // Save updated mappings if any changes
  if (remappedQuestions.length > 0) {
    saveChannelMappings(mappings);
    console.log(`📁 Saved ${remappedQuestions.length} remapping changes to channel-mappings.json`);
  }
  
  // ========== PHASE 2: QUESTION IMPROVEMENT ==========
  console.log('\n========== PHASE 2: QUESTION IMPROVEMENT ==========');

  // Find improvable questions
  const improvableQuestions = allQuestions.filter(q => needsImprovement(q).length > 0);
  console.log(`Found ${improvableQuestions.length} questions needing improvement\n`);

  if (improvableQuestions.length === 0) {
    console.log('✅ All questions are in good shape!');
    writeGitHubOutput({
      improved_count: 0,
      failed_count: 0,
      remapped_count: remappedQuestions.length,
      total_questions: allQuestions.length
    });
    return;
  }

  // Sort by lastUpdated (oldest first)
  improvableQuestions.sort((a, b) => {
    const dateA = new Date(a.lastUpdated || 0).getTime();
    const dateB = new Date(b.lastUpdated || 0).getTime();
    return dateA - dateB;
  });

  const improvedQuestions = [];
  const failedAttempts = [];
  const processedIds = new Set();

  // Process 1 question per channel
  for (let i = 0; i < channels.length; i++) {
    const channel = channels[i];
    const channelQuestions = getQuestionsForChannel(channel);
    
    console.log(`\n--- Channel ${i + 1}/${channels.length}: ${channel} ---`);
    
    // Find improvable question for this channel that hasn't been processed
    const channelImprovable = channelQuestions
      .filter(q => needsImprovement(q).length > 0 && !processedIds.has(q.id))
      .sort((a, b) => new Date(a.lastUpdated || 0).getTime() - new Date(b.lastUpdated || 0).getTime());
    
    if (channelImprovable.length === 0) {
      console.log('✅ No questions need improvement in this channel');
      continue;
    }

    const question = channelImprovable[0];
    processedIds.add(question.id);
    const issues = needsImprovement(question);
    
    console.log(`ID: ${question.id}`);
    console.log(`Issues: ${issues.join(', ')}`);
    console.log(`Current Q: ${question.question.substring(0, 60)}...`);

    // Optimized prompt - concise but clear, with strict JSON-only instruction
    const prompt = `You are a JSON generator. Output ONLY valid JSON, no explanations, no markdown, no text before or after.

Improve ${channel} interview question. Fix: ${issues.slice(0, 4).join(', ')}

Current Q: "${question.question.substring(0, 120)}"
Current A: "${question.answer.substring(0, 100)}"

Output this exact JSON structure:
{"question":"improved question ending with ?","answer":"concise answer under 150 chars","explanation":"## Why Asked\\nInterview context\\n## Key Concepts\\nCore knowledge\\n## Code Example\\n\`\`\`\\nImplementation\\n\`\`\`\\n## Follow-up Questions\\nCommon follow-ups","diagram":"flowchart TD\\n  A[Start] --> B[End]","companies":["Google","Amazon","Meta"],"sourceUrl":null,"videos":{"shortVideo":null,"longVideo":null}}

IMPORTANT: Return ONLY the JSON object. No other text.`;

    // Log the prompt
    console.log('\n📝 PROMPT:');
    console.log('─'.repeat(50));
    console.log(prompt);
    console.log('─'.repeat(50));

    const response = await runWithRetries(prompt);
    
    if (!response) {
      console.log('❌ OpenCode failed after retries.');
      failedAttempts.push({ id: question.id, channel, reason: 'OpenCode timeout' });
      continue;
    }

    const data = parseJson(response);
    
    if (!validateQuestion(data)) {
      console.log('❌ Invalid response format.');
      failedAttempts.push({ id: question.id, channel, reason: 'Invalid JSON' });
      continue;
    }

    // Update question in unified storage
    const questions = loadUnifiedQuestions();
    
    if (!questions[question.id]) {
      console.log('❌ Question not found in unified storage.');
      failedAttempts.push({ id: question.id, channel, reason: 'Not found' });
      continue;
    }

    // Validate YouTube videos if provided
    console.log('🎬 Validating YouTube videos...');
    const validatedVideos = await validateYouTubeVideos(data.videos);
    const existingVideos = questions[question.id].videos || {};

    const existingCompanies = questions[question.id].companies || [];
    const newCompanies = normalizeCompanies(data.companies);

    questions[question.id] = {
      ...questions[question.id],
      question: data.question,
      answer: data.answer.substring(0, 200),
      explanation: data.explanation,
      diagram: data.diagram || questions[question.id].diagram,
      sourceUrl: data.sourceUrl || questions[question.id].sourceUrl || null,
      videos: {
        shortVideo: validatedVideos.shortVideo || existingVideos.shortVideo || null,
        longVideo: validatedVideos.longVideo || existingVideos.longVideo || null
      },
      companies: newCompanies.length > 0 ? newCompanies : existingCompanies,
      lastUpdated: new Date().toISOString()
    };

    saveUnifiedQuestions(questions);
    updateUnifiedIndexFile();
    
    improvedQuestions.push(questions[question.id]);
    console.log(`✅ Improved: ${question.id}`);
  }

  // Print summary
  const totalQuestions = getAllUnifiedQuestions().length;
  console.log('\n\n=== SUMMARY ===');
  console.log(`Channels Processed: ${channels.length}`);
  console.log(`Total Questions Improved: ${improvedQuestions.length}`);
  console.log(`Total Questions Remapped: ${remappedQuestions.length}`);
  
  if (remappedQuestions.length > 0) {
    console.log('\n🔄 Remapped Questions:');
    remappedQuestions.forEach((r, idx) => {
      console.log(`  ${idx + 1}. [${r.id}] ${r.from} → ${r.to}`);
    });
  }
  
  if (improvedQuestions.length > 0) {
    console.log('\n✅ Successfully Improved Questions:');
    improvedQuestions.forEach((q, idx) => {
      console.log(`  ${idx + 1}. [${q.id}]`);
      console.log(`     Q: ${q.question.substring(0, 70)}${q.question.length > 70 ? '...' : ''}`);
    });
  }

  if (failedAttempts.length > 0) {
    console.log(`\n❌ Failed Improvement Attempts: ${failedAttempts.length}`);
    failedAttempts.forEach(f => {
      console.log(`  - [${f.channel}] ${f.id}: ${f.reason}`);
    });
  }
  
  if (failedRemaps.length > 0) {
    console.log(`\n❌ Failed Remap Attempts: ${failedRemaps.length}`);
    failedRemaps.forEach(f => {
      console.log(`  - ${f.id}: ${f.reason}`);
    });
  }

  console.log(`\nTotal Questions in Database: ${totalQuestions}`);
  console.log('=== END SUMMARY ===\n');

  // Log to changelog
  if (improvedQuestions.length > 0 || remappedQuestions.length > 0) {
    // Get channels for improved questions from mappings
    const currentMappings = loadChannelMappings();
    const channelsAffected = new Set();
    
    improvedQuestions.forEach(q => {
      Object.entries(currentMappings).forEach(([channel, data]) => {
        const allIds = Object.values(data.subChannels || {}).flat();
        if (allIds.includes(q.id)) {
          channelsAffected.add(channel);
        }
      });
    });
    
    // Add remapped channels
    remappedQuestions.forEach(r => {
      const [fromCh] = r.from.split('/');
      const [toCh] = r.to.split('/');
      channelsAffected.add(fromCh);
      channelsAffected.add(toCh);
    });
    
    logQuestionsImproved(
      improvedQuestions.length,
      Array.from(channelsAffected),
      [...improvedQuestions.map(q => q.id), ...remappedQuestions.map(r => r.id)]
    );
    console.log('📝 Changelog updated with improved and remapped questions');
  }

  writeGitHubOutput({
    improved_count: improvedQuestions.length,
    failed_count: failedAttempts.length,
    remapped_count: remappedQuestions.length,
    total_questions: totalQuestions,
    improved_ids: improvedQuestions.map(q => q.id).join(','),
    remapped_ids: remappedQuestions.map(r => r.id).join(',')
  });
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
