/**
 * LangGraph-based Question Generation Pipeline
 * 
 * Generates interview questions with quality validation and duplicate checking.
 * 
 * Flow:
 *   generate_question → validate_quality → validate_videos → validate_diagram → finalize → end
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';
import ai from '../index.js';

// Define the state schema
const QuestionState = Annotation.Root({
  // Input
  channel: Annotation({ reducer: (_, b) => b, default: () => '' }),
  subChannel: Annotation({ reducer: (_, b) => b, default: () => 'general' }),
  difficulty: Annotation({ reducer: (_, b) => b, default: () => 'intermediate' }),
  tags: Annotation({ reducer: (_, b) => b, default: () => [] }),
  targetCompanies: Annotation({ reducer: (_, b) => b, default: () => [] }),
  scenarioHint: Annotation({ reducer: (_, b) => b, default: () => '' }),
  ragContext: Annotation({ reducer: (_, b) => b, default: () => null }), // RAG context for informed generation
  
  // Generated question
  question: Annotation({ reducer: (_, b) => b, default: () => null }),
  
  // Validation results
  qualityIssues: Annotation({ reducer: (a, b) => [...a, ...b], default: () => [] }),
  validatedVideos: Annotation({ reducer: (_, b) => b, default: () => { return { shortVideo: null, longVideo: null }; } }),
  validatedDiagram: Annotation({ reducer: (_, b) => b, default: () => null }),
  
  // Processing state
  retryCount: Annotation({ reducer: (_, b) => b, default: () => 0 }),
  maxRetries: Annotation({ reducer: (_, b) => b, default: () => 2 }),
  
  // Output
  status: Annotation({ reducer: (_, b) => b, default: () => 'pending' }),
  error: Annotation({ reducer: (_, b) => b, default: () => null })
});

/**
 * Validate YouTube video URL
 */
async function validateYouTubeUrl(url) {
  if (!url) return null;
  
  // Extract video ID
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  let videoId = null;
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      videoId = match[1];
      break;
    }
  }
  
  if (!videoId) return null;
  
  // Check if video exists using oembed
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { method: 'HEAD', signal: AbortSignal.timeout(5000) }
    );
    return response.ok ? `https://www.youtube.com/watch?v=${videoId}` : null;
  } catch {
    return null;
  }
}

/**
 * Check if diagram is trivial/placeholder
 */
function isTrivialDiagram(diagram) {
  if (!diagram) return true;
  
  const trimmed = diagram.trim().toLowerCase();
  const lines = trimmed.split('\n').filter(line => {
    const l = line.trim();
    return l && !l.startsWith('%%') && 
           !l.startsWith('graph') && !l.startsWith('flowchart') &&
           !l.startsWith('sequencediagram') && !l.startsWith('classdiagram');
  });
  
  if (lines.length < 4) return true;
  
  const content = lines.join(' ');
  if (content.includes('start') && content.includes('end') && lines.length <= 3) {
    return true;
  }
  
  const placeholderPatterns = [
    /\bstart\b.*\bend\b/i,
    /\bbegin\b.*\bfinish\b/i,
    /\bstep\s*1\b.*\bstep\s*2\b.*\bstep\s*3\b/i,
  ];
  
  const nodeCount = (diagram.match(/\[.*?\]|\(.*?\)|{.*?}|>.*?]/g) || []).length;
  if (nodeCount <= 3 && placeholderPatterns.some(p => p.test(content))) {
    return true;
  }
  
  return false;
}

/**
 * Node: Generate question using AI
 */
async function generateQuestionNode(state) {
  console.log(`\n📝 [GENERATE_QUESTION] Creating ${state.difficulty} question for ${state.channel}...`);
  console.log(`   Sub-channel: ${state.subChannel}`);
  console.log(`   Companies: ${state.targetCompanies.join(', ')}`);
  
  // Log RAG context usage
  if (state.ragContext?.hasContext) {
    console.log(`   RAG context: ${state.ragContext.related.length} related questions`);
    console.log(`   Avoiding concepts: ${state.ragContext.concepts.slice(0, 3).join(', ')}`);
  }
  
  try {
    const result = await ai.run('generate', {
      channel: state.channel,
      subChannel: state.subChannel,
      difficulty: state.difficulty,
      tags: state.tags,
      targetCompanies: state.targetCompanies,
      scenarioHint: state.scenarioHint,
      ragContext: state.ragContext // Pass RAG context to prompt template
    });
    
    if (result && result.question) {
      console.log(`   ✅ Generated: ${result.question.substring(0, 60)}...`);
      return { question: result };
    }
    
    return { error: 'No question in response' };
  } catch (error) {
    console.log(`   ❌ Generation failed: ${error.message}`);
    
    if (state.retryCount < state.maxRetries) {
      return { retryCount: state.retryCount + 1 };
    }
    
    return { error: error.message };
  }
}

/**
 * Node: Validate question quality
 */
function validateQualityNode(state) {
  console.log('\n✅ [VALIDATE_QUALITY] Checking question quality...');
  
  if (!state.question) {
    return { status: 'error', error: 'No question generated' };
  }
  
  let q = state.question.question;
  const issues = [];
  
  // Auto-fix: Remove redundant "Question:" prefix
  if (q.toLowerCase().startsWith('question:')) {
    q = q.substring(9).trim();
    console.log(`   🔧 Auto-fixed: Removed "Question:" prefix`);
  }
  
  // Length check
  if (q.length < 30) {
    issues.push('Question too short (< 30 chars)');
  }
  
  // Auto-fix: Ensure question ends with question mark
  if (!q.trim().endsWith('?')) {
    // Try to fix by adding ? or converting period to ?
    q = q.trim();
    if (q.endsWith('.')) {
      q = q.slice(0, -1) + '?';
    } else if (q.endsWith(':')) {
      q = q.slice(0, -1) + '?';
    } else {
      q = q + '?';
    }
    console.log(`   🔧 Auto-fixed: Added question mark`);
  }
  
  // Update the question in state
  state.question.question = q;
  
  // Check for generic questions (except beginner)
  if (state.difficulty !== 'beginner') {
    const vaguePatterns = [/^what is /i, /^define /i, /^explain what /i];
    for (const pattern of vaguePatterns) {
      if (pattern.test(q) && q.length < 60) {
        issues.push('Question too generic for ' + state.difficulty);
        break;
      }
    }
  }
  
  // Advanced questions should be detailed
  if (state.difficulty === 'advanced' && q.length < 80) {
    issues.push('Advanced question should be more detailed');
  }
  
  // Check for channel-specific content
  const channelKeywords = {
    'system-design': ['design', 'scale', 'architecture', 'handle', 'build', 'distributed'],
    'algorithms': ['array', 'string', 'tree', 'graph', 'find', 'implement', 'optimize'],
    'frontend': ['react', 'javascript', 'css', 'component', 'render', 'state', 'dom'],
    'backend': ['api', 'database', 'server', 'request', 'authentication', 'microservice'],
    'devops': ['deploy', 'pipeline', 'container', 'kubernetes', 'docker', 'ci/cd'],
    'sre': ['incident', 'monitoring', 'slo', 'availability', 'latency', 'alert'],
    'database': ['query', 'index', 'transaction', 'sql', 'nosql', 'schema'],
    'behavioral': ['time', 'situation', 'challenge', 'team', 'project', 'decision'],
    // CS Fundamentals
    'data-structures': ['array', 'linked', 'stack', 'queue', 'tree', 'hash', 'heap', 'trie', 'graph'],
    'complexity-analysis': ['big-o', 'time', 'space', 'complexity', 'amortized', 'logarithmic'],
    'dynamic-programming': ['recursion', 'memoization', 'tabulation', 'subproblem', 'optimal'],
    'bit-manipulation': ['bit', 'binary', 'xor', 'shift', 'mask', 'twos-complement'],
    'design-patterns': ['pattern', 'singleton', 'factory', 'observer', 'solid', 'adapter'],
    'concurrency': ['thread', 'lock', 'mutex', 'deadlock', 'async', 'parallel', 'race'],
    'math-logic': ['probability', 'combinatorics', 'gcd', 'prime', 'modular'],
    'low-level': ['memory', 'cache', 'cpu', 'compiler', 'garbage', 'stack', 'heap'],
    // AWS Certifications
    'aws-saa': ['aws', 's3', 'ec2', 'vpc', 'lambda', 'rds', 'cloudfront', 'iam'],
    'aws-sap': ['aws', 'multi-region', 'hybrid', 'migration', 'organization'],
    'aws-dva': ['aws', 'lambda', 'api-gateway', 'dynamodb', 'sqs', 'sns'],
    'aws-sysops': ['aws', 'cloudwatch', 'systems-manager', 'backup', 'patch'],
    'aws-devops-pro': ['aws', 'codepipeline', 'codebuild', 'cloudformation', 'opsworks'],
    // Kubernetes Certifications
    'cka': ['kubernetes', 'pod', 'deployment', 'service', 'etcd', 'kubectl'],
    'ckad': ['kubernetes', 'pod', 'container', 'configmap', 'secret', 'probe'],
    'cks': ['kubernetes', 'security', 'rbac', 'network-policy', 'psp', 'audit'],
    // HashiCorp Certifications
    'terraform-associate': ['terraform', 'provider', 'resource', 'module', 'state', 'plan'],
    'vault-associate': ['vault', 'secret', 'token', 'policy', 'auth', 'seal'],
    // GCP Certifications
    'gcp-cloud-engineer': ['gcp', 'compute', 'gke', 'cloud-storage', 'iam', 'vpc'],
    'gcp-cloud-architect': ['gcp', 'spanner', 'bigquery', 'pub/sub', 'dataflow'],
    // Azure Certifications
    'azure-administrator': ['azure', 'vm', 'storage', 'vnet', 'ad', 'monitor'],
    'azure-solutions-architect': ['azure', 'arm', 'cosmos', 'functions', 'service-bus'],
  };
  
  const keywords = channelKeywords[state.channel] || [];
  const qLower = q.toLowerCase();
  const hasKeyword = keywords.length === 0 || keywords.some(kw => qLower.includes(kw));
  
  if (!hasKeyword && q.length < 100) {
    issues.push('Question lacks channel-specific content');
  }
  
  if (issues.length > 0) {
    console.log(`   ⚠️ Quality issues: ${issues.join(', ')}`);
    return { qualityIssues: issues, status: 'error', error: issues[0] };
  }
  
  console.log(`   ✅ Quality check passed`);
  return { question: state.question };
}

/**
 * Node: Validate YouTube videos
 */
async function validateVideosNode(state) {
  console.log('\n🎬 [VALIDATE_VIDEOS] Checking video URLs...');
  
  const videos = state.question.videos || {};
  const validated = { shortVideo: null, longVideo: null };
  
  if (videos.shortVideo) {
    validated.shortVideo = await validateYouTubeUrl(videos.shortVideo);
    console.log(`   Short video: ${validated.shortVideo ? '✅' : '❌'}`);
  }
  
  if (videos.longVideo) {
    validated.longVideo = await validateYouTubeUrl(videos.longVideo);
    console.log(`   Long video: ${validated.longVideo ? '✅' : '❌'}`);
  }
  
  return { validatedVideos: validated };
}

/**
 * Node: Validate diagram
 */
function validateDiagramNode(state) {
  console.log('\n📊 [VALIDATE_DIAGRAM] Checking diagram...');
  
  const diagram = state.question.diagram;
  
  if (!diagram) {
    console.log(`   No diagram provided`);
    return { validatedDiagram: null };
  }
  
  if (isTrivialDiagram(diagram)) {
    console.log(`   ⚠️ Diagram is trivial, removing`);
    return { validatedDiagram: null };
  }
  
  console.log(`   ✅ Diagram validated`);
  return { validatedDiagram: diagram };
}

/**
 * Node: Finalize question
 */
function finalizeNode(state) {
  console.log('\n🎯 [FINALIZE] Building final question...');
  
  if (state.error) {
    console.log(`   ❌ Error: ${state.error}`);
    return { status: 'error' };
  }
  
  if (!state.question) {
    return { status: 'error', error: 'No question generated' };
  }
  
  // Build final question object
  const finalQuestion = {
    question: state.question.question,
    answer: state.question.answer?.substring(0, 200) || '',
    explanation: state.question.explanation || '',
    tags: state.tags,
    difficulty: state.difficulty,
    diagram: state.validatedDiagram,
    sourceUrl: state.question.sourceUrl || null,
    videos: state.validatedVideos,
    companies: normalizeCompanies(state.question.companies),
    lastUpdated: new Date().toISOString()
  };
  
  console.log(`   ✅ Question finalized`);
  console.log(`   Q: ${finalQuestion.question.substring(0, 60)}...`);
  console.log(`   Difficulty: ${finalQuestion.difficulty}`);
  console.log(`   Has diagram: ${!!finalQuestion.diagram}`);
  
  return { question: finalQuestion, status: 'completed' };
}

/**
 * Normalize company names
 */
function normalizeCompanies(companies) {
  if (!companies || !Array.isArray(companies)) return [];
  
  const normalized = companies.map(c => {
    if (typeof c !== 'string') return null;
    return c.trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }).filter(Boolean);
  
  return [...new Set(normalized)].slice(0, 5);
}

/**
 * Router: After generation
 */
function routeAfterGeneration(state) {
  if (state.question) {
    return 'validate_quality';
  }
  if (state.retryCount < state.maxRetries && !state.error) {
    console.log(`\n🔀 [ROUTER] Retrying generation (attempt ${state.retryCount + 1})...`);
    return 'generate_question';
  }
  return 'finalize';
}

/**
 * Router: After quality validation
 */
function routeAfterQuality(state) {
  if (state.status === 'error') {
    return 'finalize';
  }
  return 'validate_videos';
}

/**
 * Build and compile the question generation graph
 */
export function createQuestionGraph() {
  const graph = new StateGraph(QuestionState);
  
  graph.addNode('generate_question', generateQuestionNode);
  graph.addNode('validate_quality', validateQualityNode);
  graph.addNode('validate_videos', validateVideosNode);
  graph.addNode('validate_diagram', validateDiagramNode);
  graph.addNode('finalize', finalizeNode);
  
  graph.addEdge(START, 'generate_question');
  
  graph.addConditionalEdges('generate_question', routeAfterGeneration, {
    'generate_question': 'generate_question',
    'validate_quality': 'validate_quality',
    'finalize': 'finalize'
  });
  
  graph.addConditionalEdges('validate_quality', routeAfterQuality, {
    'validate_videos': 'validate_videos',
    'finalize': 'finalize'
  });
  
  graph.addEdge('validate_videos', 'validate_diagram');
  graph.addEdge('validate_diagram', 'finalize');
  graph.addEdge('finalize', END);
  
  return graph.compile();
}

/**
 * Run the question generation pipeline
 */
export async function generateQuestion(options) {
  const { channel, subChannel, difficulty, tags, targetCompanies, scenarioHint, ragContext } = options;
  const graph = createQuestionGraph();
  
  console.log('\n' + '═'.repeat(60));
  console.log('🚀 LANGGRAPH QUESTION GENERATION PIPELINE');
  console.log('═'.repeat(60));
  console.log(`Channel: ${channel}`);
  console.log(`Sub-channel: ${subChannel}`);
  console.log(`Difficulty: ${difficulty}`);
  if (ragContext?.hasContext) {
    console.log(`RAG Context: ${ragContext.related.length} related questions`);
  }
  
  const initialState = {
    channel,
    subChannel: subChannel || 'general',
    difficulty: difficulty || 'intermediate',
    tags: tags || [],
    targetCompanies: targetCompanies || [],
    scenarioHint: scenarioHint || '',
    ragContext: ragContext || null,
    question: null,
    qualityIssues: [],
    validatedVideos: { shortVideo: null, longVideo: null },
    validatedDiagram: null,
    retryCount: 0,
    maxRetries: 2,
    status: 'pending',
    error: null
  };
  
  try {
    let finalResult = initialState;
    
    for await (const step of await graph.stream(initialState)) {
      const [, nodeState] = Object.entries(step)[0];
      finalResult = { ...finalResult, ...nodeState };
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('📋 PIPELINE RESULT');
    console.log('═'.repeat(60));
    console.log(`Status: ${finalResult.status}`);
    
    if (finalResult.status === 'error') {
      console.log(`Error: ${finalResult.error}`);
      return { success: false, error: finalResult.error };
    }
    
    console.log(`Question: ${finalResult.question?.question?.substring(0, 50)}...`);
    console.log('═'.repeat(60) + '\n');
    
    return {
      success: true,
      question: finalResult.question,
      qualityIssues: finalResult.qualityIssues
    };
    
  } catch (error) {
    console.error('Pipeline error:', error);
    return { success: false, error: error.message };
  }
}

export default { createQuestionGraph, generateQuestion };
