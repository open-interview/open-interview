import {
  getAllUnifiedQuestions,
  addUnifiedQuestion,
  generateUnifiedId,
  isDuplicateUnified,
  runWithRetries,
  parseJson,
  validateQuestion,
  updateUnifiedIndexFile,
  writeGitHubOutput,
  logQuestionsAdded,
  validateYouTubeVideos,
  normalizeCompanies
} from './utils.js';

// Complete channel configurations for mapping
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
  'operating-systems': ['processes', 'memory', 'file-systems', 'concurrency'],
  'linux': ['administration', 'shell-scripting', 'system-tools', 'networking'],
  'unix': ['fundamentals', 'commands', 'system-programming'],
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

const difficulties = ['beginner', 'intermediate', 'advanced'];

async function main() {
  console.log('=== Random Question Processor ===\n');
  
  // Get input question from environment variable
  const inputQuestion = process.env.INPUT_QUESTION;
  
  if (!inputQuestion || inputQuestion.trim().length < 10) {
    console.error('❌ Error: INPUT_QUESTION environment variable is required (min 10 chars)');
    console.log('Usage: INPUT_QUESTION="Your question here" node script/add-random-question.js');
    process.exit(1);
  }
  
  console.log('📥 Input Question:');
  console.log(`"${inputQuestion}"\n`);
  
  // Check for duplicates first
  if (isDuplicateUnified(inputQuestion)) {
    console.log('❌ This question appears to be a duplicate of an existing question.');
    writeGitHubOutput({
      success: 'false',
      reason: 'duplicate',
      added_count: 0
    });
    process.exit(0);
  }
  
  const allQuestions = getAllUnifiedQuestions();
  console.log(`📊 Current database: ${allQuestions.length} questions\n`);
  
  // Build channel list for the prompt
  const channelList = Object.entries(CHANNEL_STRUCTURE)
    .map(([ch, subs]) => `${ch}: [${subs.join(', ')}]`)
    .join('\n');
  
  // Step 1: Map question to channel/subchannel and refine it
  console.log('🔄 Step 1: Mapping to channel and refining question...\n');
  
  const mappingPrompt = `Analyze this interview question and:
1. Map it to the best channel and subchannel
2. Refine it into a professional interview question
3. Generate a complete answer

Input Question: "${inputQuestion}"

Available channels and subchannels:
${channelList}

Return valid JSON:
{
  "channel": "channel-id",
  "subChannel": "subchannel-id",
  "question": "refined professional interview question ending with ?",
  "answer": "concise answer under 150 chars",
  "explanation": "## Why Asked\\nInterview context\\n## Key Concepts\\nCore knowledge\\n## Code Example\\n\`\`\`\\nImplementation if applicable\\n\`\`\`\\n## Follow-up Questions\\nCommon follow-ups",
  "diagram": "flowchart TD\\n  A[Start] --> B[End]",
  "companies": ["Google", "Amazon", "Meta"],
  "difficulty": "beginner|intermediate|advanced",
  "tags": ["tag1", "tag2", "tag3"],
  "sourceUrl": "https://docs.example.com or null",
  "videos": {"shortVideo": null, "longVideo": null},
  "relatedChannels": ["other-channel-1", "other-channel-2"]
}`;

  console.log('📝 PROMPT:');
  console.log('─'.repeat(50));
  console.log(mappingPrompt);
  console.log('─'.repeat(50));
  
  const response = await runWithRetries(mappingPrompt);
  
  if (!response) {
    console.log('❌ OpenCode failed after all retries.');
    writeGitHubOutput({
      success: 'false',
      reason: 'opencode_timeout',
      added_count: 0
    });
    process.exit(1);
  }
  
  const data = parseJson(response);
  
  if (!data) {
    console.log('❌ Failed to parse JSON response.');
    writeGitHubOutput({
      success: 'false',
      reason: 'invalid_json',
      added_count: 0
    });
    process.exit(1);
  }
  
  // Validate channel and subchannel
  if (!data.channel || !CHANNEL_STRUCTURE[data.channel]) {
    console.log(`❌ Invalid channel: ${data.channel}`);
    writeGitHubOutput({
      success: 'false',
      reason: 'invalid_channel',
      added_count: 0
    });
    process.exit(1);
  }
  
  if (!data.subChannel || !CHANNEL_STRUCTURE[data.channel].includes(data.subChannel)) {
    console.log(`⚠️ SubChannel "${data.subChannel}" not valid for ${data.channel}, using first available`);
    data.subChannel = CHANNEL_STRUCTURE[data.channel][0];
  }
  
  if (!validateQuestion(data)) {
    console.log('❌ Invalid question format (missing required fields).');
    writeGitHubOutput({
      success: 'false',
      reason: 'invalid_format',
      added_count: 0
    });
    process.exit(1);
  }
  
  // Check if refined question is also a duplicate
  if (isDuplicateUnified(data.question)) {
    console.log('❌ Refined question is a duplicate.');
    writeGitHubOutput({
      success: 'false',
      reason: 'duplicate_refined',
      added_count: 0
    });
    process.exit(0);
  }
  
  console.log('\n✅ Mapping successful!');
  console.log(`   Channel: ${data.channel}`);
  console.log(`   SubChannel: ${data.subChannel}`);
  console.log(`   Difficulty: ${data.difficulty || 'intermediate'}`);
  console.log(`   Refined Q: ${data.question.substring(0, 60)}...`);
  
  // Validate YouTube videos
  console.log('\n🎬 Validating YouTube videos...');
  const validatedVideos = await validateYouTubeVideos(data.videos);
  
  // Create the question object
  const newQuestion = {
    id: generateUnifiedId(),
    question: data.question,
    answer: data.answer.substring(0, 200),
    explanation: data.explanation,
    tags: data.tags || [data.channel, data.subChannel],
    difficulty: difficulties.includes(data.difficulty) ? data.difficulty : 'intermediate',
    diagram: data.diagram || 'graph TD\n    A[Concept] --> B[Implementation]',
    sourceUrl: data.sourceUrl || null,
    videos: {
      shortVideo: validatedVideos.shortVideo,
      longVideo: validatedVideos.longVideo
    },
    companies: normalizeCompanies(data.companies),
    lastUpdated: new Date().toISOString()
  };
  
  // Build channel mappings
  const channelMappings = [{ channel: data.channel, subChannel: data.subChannel }];
  
  // Add related channels if valid
  if (data.relatedChannels && Array.isArray(data.relatedChannels)) {
    data.relatedChannels.forEach(relatedChannel => {
      if (CHANNEL_STRUCTURE[relatedChannel] && relatedChannel !== data.channel) {
        const relatedSubChannel = CHANNEL_STRUCTURE[relatedChannel][0];
        channelMappings.push({ 
          channel: relatedChannel, 
          subChannel: relatedSubChannel 
        });
      }
    });
  }
  
  // Add question to unified storage
  console.log('\n💾 Adding question to database...');
  addUnifiedQuestion(newQuestion, channelMappings);
  updateUnifiedIndexFile();
  
  console.log(`\n✅ Question added successfully!`);
  console.log(`   ID: ${newQuestion.id}`);
  console.log(`   Primary: ${data.channel}/${data.subChannel}`);
  if (channelMappings.length > 1) {
    console.log(`   Also mapped to: ${channelMappings.slice(1).map(m => m.channel).join(', ')}`);
  }
  
  // Log to changelog
  logQuestionsAdded(1, channelMappings.map(m => m.channel), [newQuestion.id]);
  console.log('📝 Changelog updated');
  
  // Summary
  const totalQuestions = getAllUnifiedQuestions().length;
  console.log('\n=== SUMMARY ===');
  console.log(`Original: "${inputQuestion.substring(0, 50)}..."`);
  console.log(`Refined:  "${newQuestion.question.substring(0, 50)}..."`);
  console.log(`Channel:  ${data.channel}/${data.subChannel}`);
  console.log(`ID:       ${newQuestion.id}`);
  console.log(`Total Questions: ${totalQuestions}`);
  console.log('=== END ===\n');
  
  writeGitHubOutput({
    success: 'true',
    question_id: newQuestion.id,
    channel: data.channel,
    subchannel: data.subChannel,
    added_count: 1,
    total_questions: totalQuestions
  });
}

main().catch(e => { 
  console.error('Fatal:', e); 
  writeGitHubOutput({
    success: 'false',
    reason: 'fatal_error',
    error: e.message
  });
  process.exit(1); 
});
