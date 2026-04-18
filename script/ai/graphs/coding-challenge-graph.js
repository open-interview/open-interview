/**
 * LangGraph-based Coding Challenge Generation Pipeline
 * 
 * Generates coding challenges with validated test cases by executing actual code.
 * 
 * Flow:
 *   generate_challenge → validate_structure → execute_tests → validate_output → end
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';
import ai from '../index.js';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Define the state schema
const CodingChallengeState = Annotation.Root({
  // Input
  difficulty: Annotation({ reducer: (_, b) => b, default: () => 'medium' }),
  category: Annotation({ reducer: (_, b) => b, default: () => 'arrays' }),
  companies: Annotation({ reducer: (_, b) => b, default: () => [] }),
  existingTitles: Annotation({ reducer: (_, b) => b, default: () => [] }),
  
  // Generated challenge
  challenge: Annotation({ reducer: (_, b) => b, default: () => null }),
  
  // Test execution
  testResults: Annotation({ reducer: (_, b) => b, default: () => [] }),
  validatedTestCases: Annotation({ reducer: (_, b) => b, default: () => [] }),
  
  // Processing state
  retryCount: Annotation({ reducer: (_, b) => b, default: () => 0 }),
  maxRetries: Annotation({ reducer: (_, b) => b, default: () => 2 }),
  
  // Output
  status: Annotation({ reducer: (_, b) => b, default: () => 'pending' }),
  error: Annotation({ reducer: (_, b) => b, default: () => null })
});

/**
 * Execute Python code and return the result
 */
async function executePythonCode(code, functionName, input) {
  return new Promise((resolve, reject) => {
    const wrappedCode = `
import json
from collections.abc import Iterator, Iterable

${code}

_args = (${input},)
if len(_args) == 1 and isinstance(_args[0], tuple):
    _args = _args[0]

_result = ${functionName}(*_args)

def to_json(obj):
    if obj is None: return None
    if isinstance(obj, bool): return obj
    if isinstance(obj, (int, float, str)): return obj
    if isinstance(obj, (list, tuple)): return [to_json(x) for x in obj]
    if isinstance(obj, dict): return {str(k): to_json(v) for k, v in obj.items()}
    if isinstance(obj, Iterator): return [to_json(x) for x in obj]
    if isinstance(obj, Iterable) and not isinstance(obj, (str, bytes)): return [to_json(x) for x in obj]
    return str(obj)

print(json.dumps(to_json(_result)))
`;

    const tempFile = path.join(os.tmpdir(), `challenge_test_${Date.now()}.py`);
    fs.writeFileSync(tempFile, wrappedCode);

    const python = spawn('python3', [tempFile], { timeout: 10000 });
    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => { stdout += data.toString(); });
    python.stderr.on('data', (data) => { stderr += data.toString(); });

    python.on('close', (code) => {
      try { fs.unlinkSync(tempFile); } catch {}
      
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`Python error: ${stderr || 'Unknown error'}`));
      }
    });

    python.on('error', (err) => {
      try { fs.unlinkSync(tempFile); } catch {}
      reject(err);
    });
  });
}

/**
 * Extract function name from Python code
 */
function extractPythonFunctionName(code) {
  const match = code.match(/def\s+(\w+)\s*\(/);
  return match ? match[1] : null;
}

/**
 * Node: Generate challenge using AI
 */
async function generateChallengeNode(state) {
  console.log(`\n📝 [GENERATE_CHALLENGE] Creating ${state.difficulty} ${state.category} challenge...`);
  console.log(`   Companies: ${state.companies.join(', ')}`);
  
  try {
    const result = await ai.run('coding-challenge', {
      difficulty: state.difficulty,
      category: state.category,
      companies: state.companies,
      existingTitles: state.existingTitles
    });
    
    if (result && result.title) {
      console.log(`   ✅ Generated: ${result.title}`);
      return { challenge: result };
    }
    
    return { error: 'No title in generated challenge' };
  } catch (error) {
    console.log(`   ❌ Generation failed: ${error.message}`);
    
    if (state.retryCount < state.maxRetries) {
      return { retryCount: state.retryCount + 1 };
    }
    
    return { error: error.message };
  }
}

/**
 * Node: Validate challenge structure
 */
function validateStructureNode(state) {
  console.log('\n✅ [VALIDATE_STRUCTURE] Checking challenge structure...');
  
  if (!state.challenge) {
    return { status: 'error', error: 'No challenge generated' };
  }
  
  const data = state.challenge;
  const required = ['title', 'description', 'difficulty', 'starterCode', 'testCases', 'sampleSolution', 'complexity'];
  const missing = required.filter(field => !data[field]);
  
  if (missing.length > 0) {
    console.log(`   ❌ Missing fields: ${missing.join(', ')}`);
    return { status: 'error', error: `Missing fields: ${missing.join(', ')}` };
  }
  
  if (!data.starterCode.javascript || !data.starterCode.python) {
    console.log('   ❌ Missing starter code');
    return { status: 'error', error: 'Missing starter code for JS or Python' };
  }
  
  if (!data.sampleSolution.javascript || !data.sampleSolution.python) {
    console.log('   ❌ Missing sample solution');
    return { status: 'error', error: 'Missing sample solution for JS or Python' };
  }
  
  if (!Array.isArray(data.testCases) || data.testCases.length < 2) {
    console.log('   ❌ Need at least 2 test cases');
    return { status: 'error', error: 'Need at least 2 test cases' };
  }
  
  console.log(`   ✅ Structure valid`);
  console.log(`   Title: ${data.title}`);
  console.log(`   Test cases: ${data.testCases.length}`);
  
  return {};
}

/**
 * Node: Execute tests to validate expected outputs
 */
async function executeTestsNode(state) {
  console.log('\n🧪 [EXECUTE_TESTS] Validating test cases by running solution...');
  
  const pythonSolution = state.challenge.sampleSolution?.python;
  if (!pythonSolution) {
    console.log('   ⚠️ No Python solution to execute');
    return { validatedTestCases: state.challenge.testCases };
  }
  
  const functionName = extractPythonFunctionName(pythonSolution);
  if (!functionName) {
    console.log('   ⚠️ Could not extract function name');
    return { validatedTestCases: state.challenge.testCases };
  }
  
  console.log(`   Running ${functionName}() for ${state.challenge.testCases.length} test cases...`);
  
  const validatedTestCases = [];
  const testResults = [];
  
  for (const tc of state.challenge.testCases) {
    try {
      const actualOutput = await executePythonCode(pythonSolution, functionName, tc.input);
      
      const result = {
        id: tc.id,
        input: tc.input,
        expected: tc.expectedOutput,
        actual: actualOutput,
        match: actualOutput === tc.expectedOutput
      };
      
      testResults.push(result);
      
      if (!result.match) {
        console.log(`   ⚠️ Test ${tc.id}: AI said "${tc.expectedOutput}", actual is "${actualOutput}" - FIXED`);
      } else {
        console.log(`   ✅ Test ${tc.id}: Verified`);
      }
      
      validatedTestCases.push({
        ...tc,
        expectedOutput: actualOutput
      });
    } catch (error) {
      console.log(`   ❌ Test ${tc.id} execution failed: ${error.message}`);
      testResults.push({
        id: tc.id,
        error: error.message
      });
      validatedTestCases.push(tc);
    }
  }
  
  const passedCount = testResults.filter(r => r.match || !r.error).length;
  console.log(`\n   Results: ${passedCount}/${testResults.length} tests validated`);
  
  return { testResults, validatedTestCases };
}

/**
 * Node: Validate final output
 */
function validateOutputNode(state) {
  console.log('\n🎯 [VALIDATE_OUTPUT] Final validation...');
  
  if (state.error) {
    console.log(`   ❌ Error: ${state.error}`);
    return { status: 'error' };
  }
  
  if (!state.challenge) {
    return { status: 'error', error: 'No challenge generated' };
  }
  
  // Update challenge with validated test cases
  const finalChallenge = {
    ...state.challenge,
    testCases: state.validatedTestCases.map((tc, i) => ({
      ...tc,
      id: tc.id || String(i + 1)
    })),
    tags: Array.isArray(state.challenge.tags) ? state.challenge.tags : [state.category],
    hints: Array.isArray(state.challenge.hints) ? state.challenge.hints : ['Think step by step'],
    companies: Array.isArray(state.challenge.companies) ? state.challenge.companies : state.companies
  };
  
  console.log(`   ✅ Challenge validated`);
  console.log(`   Title: ${finalChallenge.title}`);
  console.log(`   Difficulty: ${finalChallenge.difficulty}`);
  console.log(`   Category: ${state.category}`);
  console.log(`   Test cases: ${finalChallenge.testCases.length}`);
  
  return { challenge: finalChallenge, status: 'completed' };
}

/**
 * Router: After generation, decide next step
 */
function routeAfterGeneration(state) {
  if (state.challenge) {
    return 'validate_structure';
  }
  if (state.retryCount < state.maxRetries && !state.error) {
    console.log(`\n🔀 [ROUTER] Retrying generation (attempt ${state.retryCount + 1})...`);
    return 'generate_challenge';
  }
  return 'validate_output';
}

/**
 * Router: After structure validation
 */
function routeAfterStructure(state) {
  if (state.status === 'error') {
    return 'validate_output';
  }
  return 'execute_tests';
}

/**
 * Build and compile the coding challenge graph
 */
export function createCodingChallengeGraph() {
  const graph = new StateGraph(CodingChallengeState);
  
  graph.addNode('generate_challenge', generateChallengeNode);
  graph.addNode('validate_structure', validateStructureNode);
  graph.addNode('execute_tests', executeTestsNode);
  graph.addNode('validate_output', validateOutputNode);
  
  graph.addEdge(START, 'generate_challenge');
  
  graph.addConditionalEdges('generate_challenge', routeAfterGeneration, {
    'generate_challenge': 'generate_challenge',
    'validate_structure': 'validate_structure',
    'validate_output': 'validate_output'
  });
  
  graph.addConditionalEdges('validate_structure', routeAfterStructure, {
    'execute_tests': 'execute_tests',
    'validate_output': 'validate_output'
  });
  
  graph.addEdge('execute_tests', 'validate_output');
  graph.addEdge('validate_output', END);
  
  return graph.compile();
}

/**
 * Run the coding challenge generation pipeline
 */
export async function generateCodingChallenge(options) {
  const { difficulty, category, companies, existingTitles } = options;
  const graph = createCodingChallengeGraph();
  
  console.log('\n' + '═'.repeat(60));
  console.log('🚀 LANGGRAPH CODING CHALLENGE PIPELINE');
  console.log('═'.repeat(60));
  console.log(`Difficulty: ${difficulty}`);
  console.log(`Category: ${category}`);
  console.log(`Companies: ${companies.join(', ')}`);
  
  const initialState = {
    difficulty,
    category,
    companies,
    existingTitles: existingTitles || [],
    challenge: null,
    testResults: [],
    validatedTestCases: [],
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
    
    console.log(`Title: ${finalResult.challenge?.title}`);
    console.log('═'.repeat(60) + '\n');
    
    return {
      success: true,
      challenge: finalResult.challenge,
      testResults: finalResult.testResults
    };
    
  } catch (error) {
    console.error('Pipeline error:', error);
    return { success: false, error: error.message };
  }
}

export async function generateChallengesParallel(challenges, options = {}) {
  const { safeConcurrency } = await import('../providers/opencode.js');
  const { WorkerPool } = await import('./parallel-bot-executor.js');
  const concurrency = safeConcurrency(options.concurrency ?? 3);
  const pool = new WorkerPool({
    maxConcurrency: concurrency,
    batchSize: options.batchSize ?? 3,
    taskTimeout: options.timeout ?? 120_000,
    retryAttempts: 2,
    rateLimitDelay: 500,
  });
  pool.addTasks(challenges.map((c, i) => ({ id: `challenge-${i}`, fn: generateCodingChallenge, args: [c] })));
  return pool.execute();
}

export default { createCodingChallengeGraph, generateCodingChallenge, generateChallengesParallel };
