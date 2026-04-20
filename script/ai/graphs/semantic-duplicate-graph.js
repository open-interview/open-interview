/**
 * LangGraph-based Semantic Duplicate Detection Pipeline
 * 
 * Uses AI embeddings and semantic similarity to detect duplicate/similar content
 * that simple string matching would miss.
 * 
 * Flow:
 *   fetch_questions → generate_embeddings → calculate_similarity → cluster_duplicates → report → end
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';
// Note: For production, consider using OpenAI embeddings via:
// import ai from '../index.js';
// const embedding = await ai.embed(text);

// Define the state schema
const SemanticDuplicateState = Annotation.Root({
  // Input
  channelId: Annotation({ reducer: (_, b) => b, default: () => '' }),
  questions: Annotation({ reducer: (_, b) => b, default: () => [] }),
  threshold: Annotation({ reducer: (_, b) => b, default: () => 0.85 }),
  
  // Processing
  embeddings: Annotation({ reducer: (_, b) => b, default: () => {} }),
  similarityMatrix: Annotation({ reducer: (_, b) => b, default: () => [] }),
  
  // Results
  duplicateClusters: Annotation({ reducer: (_, b) => b, default: () => [] }),
  nearDuplicates: Annotation({ reducer: (_, b) => b, default: () => [] }),
  uniqueQuestions: Annotation({ reducer: (_, b) => b, default: () => [] }),
  
  // Stats
  stats: Annotation({ reducer: (_, b) => b, default: () => {} }),
  
  // Output
  status: Annotation({ reducer: (_, b) => b, default: () => 'pending' }),
  error: Annotation({ reducer: (_, b) => b, default: () => null })
});

/**
 * Simple text embedding using TF-IDF-like approach
 * (In production, use OpenAI embeddings or sentence-transformers)
 */
function generateSimpleEmbedding(text) {
  // Normalize and tokenize
  const tokens = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
  
  // Create term frequency vector
  const tf = {};
  tokens.forEach(token => {
    tf[token] = (tf[token] || 0) + 1;
  });
  
  // Normalize by document length
  const length = tokens.length || 1;
  Object.keys(tf).forEach(key => {
    tf[key] = tf[key] / length;
  });
  
  return tf;
}

/**
 * Calculate cosine similarity between two TF vectors
 */
function cosineSimilarity(vec1, vec2) {
  const allKeys = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (const key of allKeys) {
    const v1 = vec1[key] || 0;
    const v2 = vec2[key] || 0;
    dotProduct += v1 * v2;
    norm1 += v1 * v1;
    norm2 += v2 * v2;
  }
  
  const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
  return magnitude > 0 ? dotProduct / magnitude : 0;
}

/**
 * Node: Generate embeddings for all questions
 */
function generateEmbeddingsNode(state) {
  console.log('\n🔢 [GENERATE_EMBEDDINGS] Creating semantic embeddings...');
  
  const { questions } = state;
  const embeddings = {};
  
  for (const q of questions) {
    // Combine question, answer, and explanation for richer embedding
    const text = `${q.question} ${q.answer || ''} ${(q.tags || []).join(' ')}`;
    embeddings[q.id] = generateSimpleEmbedding(text);
  }
  
  console.log(`   Generated embeddings for ${Object.keys(embeddings).length} questions`);
  
  return { embeddings };
}

/**
 * Node: Calculate pairwise similarity matrix
 */
function calculateSimilarityNode(state) {
  console.log('\n📊 [CALCULATE_SIMILARITY] Computing similarity matrix...');
  
  const { questions, embeddings, threshold } = state;
  const similarityMatrix = [];
  const nearDuplicates = [];
  
  // Calculate pairwise similarities
  for (let i = 0; i < questions.length; i++) {
    for (let j = i + 1; j < questions.length; j++) {
      const q1 = questions[i];
      const q2 = questions[j];
      
      const similarity = cosineSimilarity(
        embeddings[q1.id],
        embeddings[q2.id]
      );
      
      if (similarity >= threshold) {
        similarityMatrix.push({
          id1: q1.id,
          id2: q2.id,
          question1: q1.question.substring(0, 50),
          question2: q2.question.substring(0, 50),
          similarity: Math.round(similarity * 100) / 100
        });
      }
      
      // Track near-duplicates (0.7 - threshold)
      if (similarity >= 0.7 && similarity < threshold) {
        nearDuplicates.push({
          id1: q1.id,
          id2: q2.id,
          question1: q1.question.substring(0, 50),
          question2: q2.question.substring(0, 50),
          similarity: Math.round(similarity * 100) / 100
        });
      }
    }
  }
  
  console.log(`   Found ${similarityMatrix.length} duplicate pairs (>=${threshold * 100}%)`);
  console.log(`   Found ${nearDuplicates.length} near-duplicate pairs (70-${threshold * 100}%)`);
  
  return { similarityMatrix, nearDuplicates };
}

/**
 * Node: Cluster duplicates using Union-Find
 */
function clusterDuplicatesNode(state) {
  console.log('\n🔗 [CLUSTER_DUPLICATES] Grouping duplicate clusters...');
  
  const { questions, similarityMatrix } = state;
  
  // Union-Find data structure
  const parent = {};
  const rank = {};
  
  // Initialize each question as its own parent
  for (const q of questions) {
    parent[q.id] = q.id;
    rank[q.id] = 0;
  }
  
  function find(x) {
    if (parent[x] !== x) {
      parent[x] = find(parent[x]); // Path compression
    }
    return parent[x];
  }
  
  function union(x, y) {
    const px = find(x);
    const py = find(y);
    
    if (px === py) return;
    
    // Union by rank
    if (rank[px] < rank[py]) {
      parent[px] = py;
    } else if (rank[px] > rank[py]) {
      parent[py] = px;
    } else {
      parent[py] = px;
      rank[px]++;
    }
  }
  
  // Union all duplicate pairs
  for (const pair of similarityMatrix) {
    union(pair.id1, pair.id2);
  }
  
  // Group questions by their root parent
  const clusters = {};
  for (const q of questions) {
    const root = find(q.id);
    if (!clusters[root]) {
      clusters[root] = [];
    }
    clusters[root].push(q);
  }
  
  // Filter to only clusters with duplicates (size > 1)
  const duplicateClusters = Object.values(clusters)
    .filter(cluster => cluster.length > 1)
    .map((cluster, idx) => ({
      clusterId: idx + 1,
      size: cluster.length,
      questions: cluster.map(q => ({
        id: q.id,
        question: q.question.substring(0, 80),
        difficulty: q.difficulty,
        channel: q.channel
      })),
      recommendation: cluster.length > 2 ? 'merge' : 'review'
    }));
  
  // Identify unique questions (not in any duplicate cluster)
  const duplicateIds = new Set(
    duplicateClusters.flatMap(c => c.questions.map(q => q.id))
  );
  const uniqueQuestions = questions
    .filter(q => !duplicateIds.has(q.id))
    .map(q => q.id);
  
  console.log(`   Found ${duplicateClusters.length} duplicate clusters`);
  console.log(`   ${uniqueQuestions.length} unique questions`);
  
  return { duplicateClusters, uniqueQuestions };
}

/**
 * Node: Generate report and stats
 */
function reportNode(state) {
  console.log('\n📋 [REPORT] Generating duplicate analysis report...');
  
  const { 
    questions, 
    duplicateClusters, 
    nearDuplicates, 
    uniqueQuestions,
    threshold
  } = state;
  
  const totalQuestions = questions.length;
  const duplicateCount = duplicateClusters.reduce((sum, c) => sum + c.size, 0);
  const duplicateRate = totalQuestions > 0 
    ? Math.round((duplicateCount / totalQuestions) * 100) 
    : 0;
  
  const stats = {
    totalQuestions,
    uniqueQuestions: uniqueQuestions.length,
    duplicateClusters: duplicateClusters.length,
    duplicateQuestions: duplicateCount,
    nearDuplicates: nearDuplicates.length,
    duplicateRate: `${duplicateRate}%`,
    threshold: `${threshold * 100}%`,
    recommendations: {
      toMerge: duplicateClusters.filter(c => c.recommendation === 'merge').length,
      toReview: duplicateClusters.filter(c => c.recommendation === 'review').length
    }
  };
  
  console.log(`   Total: ${totalQuestions} questions`);
  console.log(`   Unique: ${uniqueQuestions.length} (${100 - duplicateRate}%)`);
  console.log(`   Duplicates: ${duplicateCount} in ${duplicateClusters.length} clusters`);
  console.log(`   Near-duplicates: ${nearDuplicates.length} pairs to review`);
  
  return { stats, status: 'completed' };
}

/**
 * Build and compile the semantic duplicate detection graph
 */
export function createSemanticDuplicateGraph() {
  const graph = new StateGraph(SemanticDuplicateState);
  
  graph.addNode('generate_embeddings', generateEmbeddingsNode);
  graph.addNode('calculate_similarity', calculateSimilarityNode);
  graph.addNode('cluster_duplicates', clusterDuplicatesNode);
  graph.addNode('report', reportNode);
  
  graph.addEdge(START, 'generate_embeddings');
  graph.addEdge('generate_embeddings', 'calculate_similarity');
  graph.addEdge('calculate_similarity', 'cluster_duplicates');
  graph.addEdge('cluster_duplicates', 'report');
  graph.addEdge('report', END);
  
  return graph.compile();
}

/**
 * Run the semantic duplicate detection pipeline
 */
export async function detectDuplicates(questions, options = {}) {
  const graph = createSemanticDuplicateGraph();
  
  const threshold = options.threshold || 0.85;
  const channelId = options.channelId || 'all';
  
  console.log('\n' + '═'.repeat(60));
  console.log('🔍 SEMANTIC DUPLICATE DETECTION PIPELINE');
  console.log('═'.repeat(60));
  console.log(`Channel: ${channelId}`);
  console.log(`Questions: ${questions.length}`);
  console.log(`Threshold: ${threshold * 100}%`);
  
  const initialState = {
    channelId,
    questions,
    threshold,
    embeddings: {},
    similarityMatrix: [],
    duplicateClusters: [],
    nearDuplicates: [],
    uniqueQuestions: [],
    stats: {},
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
    console.log('📋 DUPLICATE DETECTION RESULT');
    console.log('═'.repeat(60));
    console.log(`Status: ${finalResult.status}`);
    console.log(`Duplicate Rate: ${finalResult.stats.duplicateRate}`);
    console.log('═'.repeat(60) + '\n');
    
    return {
      success: true,
      ...finalResult
    };
    
  } catch (error) {
    console.error('Pipeline error:', error);
    return { success: false, error: error.message };
  }
}

export default { createSemanticDuplicateGraph, detectDuplicates };
