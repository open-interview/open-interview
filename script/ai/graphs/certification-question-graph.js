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
    
    if (Array.isArray(result) && result.length > 0) {
      console.log(`   ✅ Generated ${result.length} questions`);
      return { questions: result };
    }
    
    if (state.retryCount < state.maxRetries) {
      return { retryCount: state.retryCount + 1 };
    }
    
    return { error: 'Failed to generate questions' };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    
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
  console.log('\n✅ [VALIDATE] Checking question quality...');
  
  const validated = [];
  
  for (const q of state.questions) {
    const issues = [];
    
    // Check question format
    if (!q.question || q.question.length < 30) {
      issues.push('Question too short');
    }
    if (!q.question?.trim().endsWith('?')) {
      issues.push('Must end with ?');
    }
    
    // Check options
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      issues.push('Must have exactly 4 options');
    }
    
    const correctCount = q.options?.filter(o => o.isCorrect).length || 0;
    if (correctCount !== 1) {
      issues.push('Must have exactly 1 correct answer');
    }
    
    // Check explanation
    if (!q.explanation || q.explanation.length < 50) {
      issues.push('Explanation too short');
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

export default { createCertificationQuestionGraph, generateCertificationQuestions };
