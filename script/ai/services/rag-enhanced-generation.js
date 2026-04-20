/**
 * RAG-Enhanced Content Generation Service
 * 
 * Leverages vector DB to improve content quality by:
 * 1. Retrieving relevant context before generation
 * 2. Ensuring consistency with existing content
 * 3. Finding gaps in coverage
 * 4. Cross-referencing related topics
 * 5. Building knowledge graphs
 */

import vectorDB from './vector-db.js';
import { runWithRetries, parseJson } from '../../utils.js';

// ============================================
// RAG CONTEXT RETRIEVAL
// ============================================

/**
 * Get rich context for generating new content
 * Retrieves semantically similar existing content to inform generation
 */
export async function getGenerationContext(topic, options = {}) {
  const {
    channel = null,
    limit = 10,
    includeAnswers = true,
    includeTags = true
  } = options;

  await vectorDB.init();

  // Search for related content
  const related = await vectorDB.semanticSearch(topic, {
    limit,
    threshold: 0.1,
    channel
  });

  if (related.length === 0) {
    return { hasContext: false, related: [], concepts: [], gaps: [] };
  }

  // Extract key concepts from related content
  const concepts = new Set();
  const allTags = [];
  
  for (const item of related) {
    if (includeTags && item.tags) {
      const tags = Array.isArray(item.tags) ? item.tags : JSON.parse(item.tags || '[]');
      tags.forEach(t => {
        concepts.add(t);
        allTags.push(t);
      });
    }
  }

  // Find most common concepts
  const conceptCounts = {};
  allTags.forEach(t => conceptCounts[t] = (conceptCounts[t] || 0) + 1);
  const topConcepts = Object.entries(conceptCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([concept]) => concept);

  return {
    hasContext: true,
    related: related.map(r => ({
      id: r.id,
      question: r.question,
      answer: includeAnswers ? r.answer?.substring(0, 500) : null,
      channel: r.channel,
      relevance: r.relevance
    })),
    concepts: topConcepts,
    totalRelated: related.length
  };
}


// ============================================
// RAG-ENHANCED QUESTION GENERATION
// ============================================

/**
 * Generate a new question with RAG context
 * Uses existing content to ensure quality and avoid duplication
 */
export async function generateQuestionWithRAG(topic, channel, options = {}) {
  const { difficulty = 'intermediate' } = options;

  // Step 1: Get context from existing questions
  const context = await getGenerationContext(topic, { channel, limit: 5 });

  // Step 2: Build context-aware prompt
  let contextSection = '';
  if (context.hasContext) {
    contextSection = `
EXISTING RELATED QUESTIONS (for reference - DO NOT duplicate these):
${context.related.map((r, i) => `${i + 1}. "${r.question}"`).join('\n')}

KEY CONCEPTS already covered: ${context.concepts.join(', ')}

Generate a DIFFERENT question that:
- Explores a new angle not covered above
- Builds on these concepts but doesn't repeat them
- Fills gaps in the existing coverage
`;
  }

  const prompt = `Generate a ${difficulty} level interview question about "${topic}" for ${channel} interviews.

${contextSection}

Return ONLY valid JSON:
{
  "question": "Clear, specific question ending with ?",
  "tldr": "2-3 sentence quick answer",
  "answer": "Detailed explanation (3-5 paragraphs)",
  "tags": ["tag1", "tag2", "tag3"],
  "difficulty": "${difficulty}",
  "followUp": ["Follow-up question 1?", "Follow-up question 2?"]
}

Requirements:
- Question should test practical knowledge
- Answer should be comprehensive but concise
- Include real-world examples where applicable
- Tags should be specific and searchable`;

  const response = await runWithRetries(prompt);
  const result = parseJson(response);

  if (!result || !result.question) {
    return { success: false, error: 'Failed to generate question' };
  }

  // Step 3: Verify it's not too similar to existing
  const duplicateCheck = await vectorDB.findSimilar(result.question, {
    limit: 3,
    threshold: 0.7,
    channel
  });

  if (duplicateCheck.length > 0) {
    return {
      success: false,
      error: 'Generated question too similar to existing',
      similar: duplicateCheck
    };
  }

  return {
    success: true,
    question: {
      ...result,
      channel,
      generatedWithRAG: true,
      contextUsed: context.hasContext ? context.related.length : 0
    }
  };
}


// ============================================
// RAG-ENHANCED ANSWER IMPROVEMENT
// ============================================

/**
 * Enhance an existing answer with related context
 * Pulls in relevant information from similar questions
 */
export async function enhanceAnswerWithRAG(question, currentAnswer, channel) {
  // Get related questions for context
  const context = await getGenerationContext(question, {
    channel,
    limit: 5,
    includeAnswers: true
  });

  if (!context.hasContext) {
    return { enhanced: false, answer: currentAnswer };
  }

  // Build enhancement prompt
  const relatedContext = context.related
    .filter(r => r.answer)
    .map(r => `Q: ${r.question}\nKey points: ${r.answer}`)
    .join('\n\n');

  const prompt = `Enhance this interview answer by incorporating relevant concepts from related questions.

ORIGINAL QUESTION: ${question}

CURRENT ANSWER:
${currentAnswer}

RELATED CONTEXT (use to enrich the answer):
${relatedContext}

RELATED CONCEPTS: ${context.concepts.join(', ')}

Return ONLY valid JSON:
{
  "enhancedAnswer": "The improved answer incorporating relevant context",
  "addedConcepts": ["concept1", "concept2"],
  "crossReferences": ["Related topic 1", "Related topic 2"]
}

Requirements:
- Keep the core answer intact
- Add relevant cross-references naturally
- Don't make it significantly longer
- Maintain the same tone and style`;

  const response = await runWithRetries(prompt);
  const result = parseJson(response);

  if (!result || !result.enhancedAnswer) {
    return { enhanced: false, answer: currentAnswer };
  }

  return {
    enhanced: true,
    answer: result.enhancedAnswer,
    addedConcepts: result.addedConcepts || [],
    crossReferences: result.crossReferences || []
  };
}


// ============================================
// KNOWLEDGE GAP DETECTION
// ============================================

/**
 * Find gaps in topic coverage using vector clustering
 */
export async function findCoverageGaps(channel, options = {}) {
  const { minQuestions = 3 } = options;

  await vectorDB.init();

  // Get all questions in channel
  const allQuestions = await vectorDB.semanticSearch(channel, {
    limit: 100,
    threshold: 0.05,
    channel
  });

  if (allQuestions.length < minQuestions) {
    return { gaps: [], coverage: 'insufficient_data' };
  }

  // Extract all tags/concepts
  const conceptCoverage = {};
  for (const q of allQuestions) {
    const tags = Array.isArray(q.tags) ? q.tags : JSON.parse(q.tags || '[]');
    tags.forEach(tag => {
      conceptCoverage[tag] = (conceptCoverage[tag] || 0) + 1;
    });
  }

  // Define expected concepts per channel
  const expectedConcepts = getExpectedConcepts(channel);
  
  // Find gaps (expected but not covered or under-covered)
  const gaps = [];
  for (const concept of expectedConcepts) {
    const coverage = conceptCoverage[concept] || 0;
    if (coverage < minQuestions) {
      gaps.push({
        concept,
        currentCoverage: coverage,
        expectedMinimum: minQuestions,
        priority: coverage === 0 ? 'high' : 'medium'
      });
    }
  }

  // Sort by priority
  gaps.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority === 'high' ? -1 : 1;
    return a.currentCoverage - b.currentCoverage;
  });

  return {
    gaps,
    totalQuestions: allQuestions.length,
    conceptsCovered: Object.keys(conceptCoverage).length,
    coverage: gaps.length === 0 ? 'complete' : 'gaps_found'
  };
}

function getExpectedConcepts(channel) {
  const conceptMap = {
    'system-design': [
      'scalability', 'load-balancing', 'caching', 'database-sharding',
      'microservices', 'api-design', 'message-queues', 'cdn',
      'consistency', 'availability', 'partition-tolerance', 'rate-limiting'
    ],
    'algorithms': [
      'arrays', 'strings', 'linked-lists', 'trees', 'graphs',
      'dynamic-programming', 'sorting', 'searching', 'recursion',
      'time-complexity', 'space-complexity', 'hash-tables'
    ],
    'frontend': [
      'react', 'javascript', 'css', 'html', 'typescript',
      'state-management', 'performance', 'accessibility', 'testing',
      'responsive-design', 'web-apis', 'bundling'
    ],
    'backend': [
      'rest-api', 'graphql', 'authentication', 'authorization',
      'database', 'caching', 'logging', 'monitoring', 'security',
      'microservices', 'message-queues', 'rate-limiting'
    ],
    'devops': [
      'ci-cd', 'docker', 'kubernetes', 'terraform', 'monitoring',
      'logging', 'alerting', 'deployment', 'infrastructure-as-code',
      'security', 'networking', 'cloud'
    ]
  };
  
  return conceptMap[channel] || [];
}


// ============================================
// CROSS-CHANNEL KNOWLEDGE LINKING
// ============================================

/**
 * Find related questions across different channels
 * Builds cross-channel knowledge connections
 */
export async function findCrossChannelLinks(questionId, questionText, currentChannel) {
  await vectorDB.init();

  // Search across ALL channels (no channel filter)
  const crossChannel = await vectorDB.semanticSearch(questionText, {
    limit: 20,
    threshold: 0.15
  });

  // Group by channel, excluding current
  const byChannel = {};
  for (const item of crossChannel) {
    if (item.channel === currentChannel) continue;
    if (!byChannel[item.channel]) {
      byChannel[item.channel] = [];
    }
    byChannel[item.channel].push({
      id: item.id,
      question: item.question,
      relevance: item.relevance
    });
  }

  // Get top 2 from each channel
  const links = {};
  for (const [channel, questions] of Object.entries(byChannel)) {
    links[channel] = questions.slice(0, 2);
  }

  return {
    questionId,
    crossChannelLinks: links,
    totalLinkedChannels: Object.keys(links).length
  };
}

// ============================================
// RAG-POWERED TEST GENERATION
// ============================================

/**
 * Generate a test from semantically clustered questions
 */
export async function generateTestFromCluster(topic, options = {}) {
  const { questionCount = 5, difficulty = 'intermediate', channel = null } = options;

  // Get semantically related questions
  const cluster = await vectorDB.semanticSearch(topic, {
    limit: questionCount * 3, // Get more to filter
    threshold: 0.1,
    channel,
    difficulty
  });

  if (cluster.length < questionCount) {
    return {
      success: false,
      error: `Not enough questions found. Need ${questionCount}, found ${cluster.length}`
    };
  }

  // Select diverse questions from cluster
  const selected = selectDiverseQuestions(cluster, questionCount);

  // Generate MCQ options for each
  const testQuestions = [];
  for (const q of selected) {
    const mcq = await generateMCQFromQuestion(q);
    if (mcq) {
      testQuestions.push(mcq);
    }
  }

  return {
    success: true,
    test: {
      topic,
      difficulty,
      questions: testQuestions,
      generatedAt: new Date().toISOString()
    }
  };
}

function selectDiverseQuestions(questions, count) {
  // Simple diversity: spread across relevance scores
  const sorted = [...questions].sort((a, b) => b.relevance - a.relevance);
  const step = Math.floor(sorted.length / count);
  const selected = [];
  
  for (let i = 0; i < count && i * step < sorted.length; i++) {
    selected.push(sorted[i * step]);
  }
  
  return selected;
}

async function generateMCQFromQuestion(question) {
  const prompt = `Convert this interview question into a multiple-choice question:

QUESTION: ${question.question}
ANSWER CONTEXT: ${question.answer?.substring(0, 300) || 'N/A'}

Return ONLY valid JSON:
{
  "question": "The MCQ question text?",
  "options": [
    { "id": "a", "text": "Option A", "isCorrect": false },
    { "id": "b", "text": "Option B", "isCorrect": true },
    { "id": "c", "text": "Option C", "isCorrect": false },
    { "id": "d", "text": "Option D", "isCorrect": false }
  ],
  "explanation": "Why the correct answer is correct"
}`;

  try {
    const response = await runWithRetries(prompt);
    const result = parseJson(response);
    if (result && result.question && result.options) {
      return {
        ...result,
        sourceQuestionId: question.id
      };
    }
  } catch (e) {
    console.warn(`Failed to generate MCQ for ${question.id}`);
  }
  return null;
}


// ============================================
// PRE-COMPUTE KNOWLEDGE GRAPH
// ============================================

/**
 * Build a knowledge graph from vector similarities
 * Pre-computes connections for static site
 */
export async function buildKnowledgeGraph(options = {}) {
  const { minSimilarity = 0.3, maxConnections = 5 } = options;

  await vectorDB.init();
  const stats = await vectorDB.getStats();
  
  console.log(`Building knowledge graph from ${stats.pointsCount} questions...`);

  // This would be run at build time to generate static JSON
  const graph = {
    nodes: [],
    edges: [],
    clusters: {},
    generated: new Date().toISOString()
  };

  // Get all questions (paginated in real implementation)
  const channels = ['system-design', 'algorithms', 'frontend', 'backend', 'devops'];
  
  for (const channel of channels) {
    const questions = await vectorDB.semanticSearch(channel, {
      limit: 50,
      threshold: 0.05,
      channel
    });

    for (const q of questions) {
      // Add node
      graph.nodes.push({
        id: q.id,
        label: q.question.substring(0, 50),
        channel: q.channel,
        difficulty: q.difficulty
      });

      // Find connections
      const similar = await vectorDB.findSimilar(q.question, {
        limit: maxConnections + 1,
        threshold: minSimilarity
      });

      // Add edges (excluding self)
      for (const s of similar) {
        if (s.id !== q.id && s.similarity >= minSimilarity) {
          graph.edges.push({
            source: q.id,
            target: s.id,
            weight: s.similarity
          });
        }
      }
    }
  }

  // Identify clusters (questions with many connections)
  const connectionCounts = {};
  graph.edges.forEach(e => {
    connectionCounts[e.source] = (connectionCounts[e.source] || 0) + 1;
    connectionCounts[e.target] = (connectionCounts[e.target] || 0) + 1;
  });

  // Top connected nodes are cluster centers
  const hubs = Object.entries(connectionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({ id, connections: count }));

  graph.hubs = hubs;
  graph.stats = {
    totalNodes: graph.nodes.length,
    totalEdges: graph.edges.length,
    avgConnections: graph.edges.length / graph.nodes.length
  };

  return graph;
}

// ============================================
// EXPORTS
// ============================================

export default {
  getGenerationContext,
  generateQuestionWithRAG,
  enhanceAnswerWithRAG,
  findCoverageGaps,
  findCrossChannelLinks,
  generateTestFromCluster,
  buildKnowledgeGraph
};
