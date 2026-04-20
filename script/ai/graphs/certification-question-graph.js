/**
 * Certification Question Generation Pipeline
 * 
 * Generates exam-aligned MCQ questions for specific certifications.
 * 
 * Flow:
 *   select_domain → generate_questions → validate_quality → deduplicate → finalize
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';
import ai from '../index.js';
import { certificationDomains } from '../prompts/templates/certification-question.js';

// State schema
const CertQuestionState = Annotation.Root({
  certificationId: Annotation({ reducer: (_, b) => b, default: () => '' }),
  domain: Annotation({ reducer: (_, b) => b, default: () => '' }),
  difficulty: Annotation({ reducer: (_, b) => b, default: () => 'intermediate' }),
  count: Annotation({ reducer: (_, b) => b, default: () => 5 }),
  
  questions: Annotation({ reducer: (_, b) => b, default: () => [] }),
  validatedQuestions: Annotation({ reducer: (_, b) => b, default: () => [] }),
  
  retryCount: Annotation({ reducer: (_, b) => b, default: () => 0 }),
  maxRetries: Annotation({ reducer: (_, b) => b, default: () => 2 }),
  status: Annotation({ reducer: (_, b) => b, default: () => 'pending' }),
  error: Annotation({ reducer: (_, b) => b, default: () => null })
});

/**
 * Node: Select domain based on weights if not specified
 */
function selectDomainNode(state) {
  console.log('\n🎯 [SELECT_DOMAIN] Choosing exam domain...');
  
  if (state.domain) {
    console.log(`   Using specified domain: ${state.domain}`);
    return {};
  }
  
  const domains = certificationDomains[state.certificationId];
  if (!domains || domains.length === 0) {
    return { error: `Unknown certification: ${state.certificationId}` };
  }

  // Weighted random selection
  const totalWeight = domains.reduce((sum, d) => sum + d.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const domain of domains) {
    random -= domain.weight;
    if (random <= 0) {
      console.log(`   Selected: ${domain.name} (${domain.weight}%)`);
      return { domain: domain.id };
    }
  }
  
  return { domain: domains[0].id };
}

/**
 * Node: Generate questions using AI
 */
async function generateQuestionsNode(state) {
  console.log(`\n📝 [GENERATE] Creating ${state.count} questions...`);
  console.log(`   Cert: ${state.certificationId}, Domain: ${state.domain}`);
  
  try {
    const result = await ai.run('certification-question', {
      certificationId: state.certificationId,
      domain: state.domain,
      difficulty: state.difficulty,
      count: state.count
    });
    
    // Handle array response
    if (Array.isArray(result) && result.length > 0) {
      console.log(`   ✅ Generated ${result.length} questions`);
      return { questions: result };
    }
    
    // Handle single object response (wrap in array)
    if (result && typeof result === 'object' && result.question) {
      console.log(`   ✅ Generated 1 question (single object response)`);
      return { questions: [result] };
    }
    
    // Handle empty or invalid response
    console.log(`   ⚠️ Invalid response format:`, typeof result);
    if (state.retryCount < state.maxRetries) {
      console.log(`   🔄 Retrying (${state.retryCount + 1}/${state.maxRetries})...`);
      return { retryCount: state.retryCount + 1 };
    }
    
    return { error: 'Failed to generate questions - invalid response format' };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    
    if (state.retryCount < state.maxRetries) {
      console.log(`   🔄 Retrying (${state.retryCount + 1}/${state.maxRetries})...`);
      return { retryCount: state.retryCount + 1 };
    }
    return { error: error.message };
  }
}

/**
 * Node: Validate question quality
 */
function validateQualityNode(state) {
  console.log('\n✅ [VALIDATE] Checking question quality...');
  
  if (!state.questions || state.questions.length === 0) {
    console.log('   ⚠️ No questions to validate');
    return { validatedQuestions: [] };
  }
  
  const validated = [];
  
  for (const q of state.questions) {
    const issues = [];
    
    // Check question exists and format
    if (!q || typeof q !== 'object') {
      issues.push('Invalid question object');
      console.log(`   ⚠️ Rejected: Invalid question object`);
      continue;
    }
    
    if (!q.question || q.question.length < 30) {
      issues.push('Question too short or missing');
    }
    if (q.question && !q.question.trim().endsWith('?')) {
      issues.push('Must end with ?');
    }
    
    // Check options
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      issues.push('Must have exactly 4 options');
    } else {
      const correctCount = q.options.filter(o => o && o.isCorrect).length;
      if (correctCount !== 1) {
        issues.push('Must have exactly 1 correct answer');
      }
    }
    
    // Check explanation
    if (!q.explanation || q.explanation.length < 50) {
      issues.push('Explanation too short or missing');
    }
    
    if (issues.length === 0) {
      validated.push(q);
    } else {
      console.log(`   ⚠️ Rejected: ${issues.join(', ')}`);
    }
  }
  
  console.log(`   ✅ ${validated.length}/${state.questions.length} passed`);
  return { validatedQuestions: validated };
}


/**
 * Node: Finalize and assign IDs
 */
function finalizeNode(state) {
  console.log('\n🎯 [FINALIZE] Preparing output...');
  
  if (state.error) {
    return { status: 'error' };
  }
  
  const questions = state.validatedQuestions.map((q, i) => ({
    ...q,
    id: `${state.certificationId}-${state.domain}-${Date.now()}-${i}`,
    certificationId: state.certificationId,
    domain: state.domain,
    domainWeight: certificationDomains[state.certificationId]
      ?.find(d => d.id === state.domain)?.weight || 0
  }));
  
  console.log(`   ✅ Finalized ${questions.length} questions`);
  return { validatedQuestions: questions, status: 'completed' };
}

/**
 * Router after generation
 */
function routeAfterGeneration(state) {
  if (state.questions?.length > 0) return 'validate_quality';
  if (state.retryCount < state.maxRetries) return 'generate_questions';
  return 'finalize';
}

/**
 * Build the graph
 */
export function createCertificationQuestionGraph() {
  const graph = new StateGraph(CertQuestionState);
  
  graph.addNode('select_domain', selectDomainNode);
  graph.addNode('generate_questions', generateQuestionsNode);
  graph.addNode('validate_quality', validateQualityNode);
  graph.addNode('finalize', finalizeNode);
  
  graph.addEdge(START, 'select_domain');
  graph.addEdge('select_domain', 'generate_questions');
  
  graph.addConditionalEdges('generate_questions', routeAfterGeneration, {
    'generate_questions': 'generate_questions',
    'validate_quality': 'validate_quality',
    'finalize': 'finalize'
  });
  
  graph.addEdge('validate_quality', 'finalize');
  graph.addEdge('finalize', END);
  
  return graph.compile();
}

/**
 * Run the pipeline
 */
export async function generateCertificationQuestions(options) {
  const { certificationId, domain, difficulty, count } = options;
  const graph = createCertificationQuestionGraph();
  
  console.log('\n' + '═'.repeat(60));
  console.log('🎓 CERTIFICATION QUESTION GENERATION');
  console.log('═'.repeat(60));
  
  const initialState = {
    certificationId,
    domain: domain || '',
    difficulty: difficulty || 'intermediate',
    count: count || 5,
    questions: [],
    validatedQuestions: [],
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
    console.log(`Status: ${finalResult.status}`);
    console.log(`Questions: ${finalResult.validatedQuestions?.length || 0}`);
    console.log('═'.repeat(60));
    
    return {
      success: finalResult.status === 'completed',
      questions: finalResult.validatedQuestions,
      error: finalResult.error
    };
  } catch (error) {
    console.error('Pipeline error:', error);
    return { success: false, questions: [], error: error.message };
  }
}

export async function generateCertificationsParallel(certs, options = {}) {
  const { safeConcurrency } = await import('../providers/opencode.js');
  const { WorkerPool } = await import('./parallel-bot-executor.js');
  const concurrency = safeConcurrency(options.concurrency ?? 4);
  const pool = new WorkerPool({
    maxConcurrency: concurrency,
    batchSize: options.batchSize ?? 4,
    taskTimeout: options.timeout ?? 180_000,
    retryAttempts: 2,
    rateLimitDelay: 300,
  });
  pool.addTasks(certs.map((c, i) => ({ id: `cert-${c.certificationId}-${i}`, fn: generateCertificationQuestions, args: [c] })));
  return pool.execute();
}

export default { createCertificationQuestionGraph, generateCertificationQuestions, generateCertificationsParallel };
