/**
 * Interview Intelligence Graph
 * 
 * Pre-computes interview intelligence data for static site deployment:
 * - Cognitive pattern analysis (how users think, not just what they know)
 * - Company readiness predictions (FAANG, startups, etc.)
 * - Knowledge DNA profiles (portable expertise fingerprint)
 * - Personalized mock interview question sets
 * 
 * All output is JSON for client-side consumption on GitHub Pages.
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';
import fs from 'fs/promises';
import path from 'path';

// ============================================
// STATE DEFINITION
// ============================================

const IntelligenceState = Annotation.Root({
  // Input
  questions: Annotation({ reducer: (_, b) => b, default: () => [] }),
  channels: Annotation({ reducer: (_, b) => b, default: () => [] }),
  
  // Company profiles (what each company values)
  companyProfiles: Annotation({ reducer: (_, b) => b, default: () => ({}) }),
  
  // Question-to-cognitive mapping
  cognitiveMap: Annotation({ reducer: (_, b) => b, default: () => ({}) }),
  
  // Company readiness weights per question
  companyWeights: Annotation({ reducer: (_, b) => b, default: () => ({}) }),
  
  // Knowledge DNA templates
  knowledgeDNA: Annotation({ reducer: (_, b) => b, default: () => ({}) }),
  
  // Mock interview sets
  mockInterviews: Annotation({ reducer: (_, b) => b, default: () => ({}) }),
  
  // Output path
  outputDir: Annotation({ reducer: (_, b) => b, default: () => 'client/public/data/intelligence' }),
  
  status: Annotation({ reducer: (_, b) => b, default: () => 'pending' }),
  error: Annotation({ reducer: (_, b) => b, default: () => null })
});


// ============================================
// COMPANY PROFILES - What each company values
// ============================================

const COMPANY_PROFILES = {
  google: {
    name: 'Google',
    values: ['algorithms', 'system-design', 'scalability', 'data-structures', 'problem-solving'],
    cognitiveEmphasis: ['analytical', 'optimization', 'edge-cases'],
    difficultyBias: 'hard',
    interviewStyle: 'whiteboard-heavy',
    weight: { algorithms: 1.5, 'system-design': 1.3, frontend: 0.8 }
  },
  meta: {
    name: 'Meta',
    values: ['algorithms', 'system-design', 'product-sense', 'frontend', 'scale'],
    cognitiveEmphasis: ['speed', 'practical', 'product-thinking'],
    difficultyBias: 'medium-hard',
    interviewStyle: 'balanced',
    weight: { algorithms: 1.3, 'system-design': 1.4, frontend: 1.2 }
  },
  amazon: {
    name: 'Amazon',
    values: ['system-design', 'leadership', 'scalability', 'devops', 'databases'],
    cognitiveEmphasis: ['ownership', 'trade-offs', 'customer-focus'],
    difficultyBias: 'medium',
    interviewStyle: 'behavioral-heavy',
    weight: { 'system-design': 1.5, devops: 1.3, backend: 1.2 }
  },
  microsoft: {
    name: 'Microsoft',
    values: ['system-design', 'algorithms', 'collaboration', 'cloud', 'security'],
    cognitiveEmphasis: ['clarity', 'communication', 'depth'],
    difficultyBias: 'medium',
    interviewStyle: 'conversational',
    weight: { 'system-design': 1.3, security: 1.2, backend: 1.1 }
  },
  apple: {
    name: 'Apple',
    values: ['system-design', 'performance', 'attention-to-detail', 'frontend', 'security'],
    cognitiveEmphasis: ['perfectionism', 'user-experience', 'polish'],
    difficultyBias: 'hard',
    interviewStyle: 'detail-oriented',
    weight: { frontend: 1.4, 'system-design': 1.3, security: 1.2 }
  },
  startup: {
    name: 'Startups',
    values: ['full-stack', 'speed', 'adaptability', 'product-sense', 'pragmatism'],
    cognitiveEmphasis: ['speed', 'practical', 'breadth'],
    difficultyBias: 'medium',
    interviewStyle: 'practical',
    weight: { frontend: 1.2, backend: 1.2, devops: 1.1 }
  }
};


// ============================================
// COGNITIVE PATTERNS - How people think
// ============================================

const COGNITIVE_PATTERNS = {
  analytical: {
    name: 'Analytical Thinker',
    description: 'Breaks down problems systematically, focuses on logic',
    indicators: ['step-by-step', 'edge-cases', 'complexity-analysis'],
    strengths: ['algorithms', 'debugging', 'optimization'],
    weaknesses: ['speed', 'big-picture']
  },
  intuitive: {
    name: 'Intuitive Problem Solver',
    description: 'Quickly grasps patterns, jumps to solutions',
    indicators: ['pattern-recognition', 'quick-solutions', 'heuristics'],
    strengths: ['speed', 'creativity', 'pattern-matching'],
    weaknesses: ['edge-cases', 'formal-proofs']
  },
  systematic: {
    name: 'Systematic Builder',
    description: 'Builds comprehensive solutions, considers all aspects',
    indicators: ['thorough', 'documentation', 'testing'],
    strengths: ['system-design', 'reliability', 'maintainability'],
    weaknesses: ['speed', 'over-engineering']
  },
  pragmatic: {
    name: 'Pragmatic Engineer',
    description: 'Focuses on working solutions, trade-off aware',
    indicators: ['mvp-first', 'trade-offs', 'practical'],
    strengths: ['delivery', 'real-world', 'communication'],
    weaknesses: ['optimization', 'theoretical']
  }
};

// Question tags that indicate cognitive patterns
const COGNITIVE_TAG_MAP = {
  'time-complexity': 'analytical',
  'space-complexity': 'analytical',
  'edge-cases': 'analytical',
  'optimization': 'analytical',
  'pattern': 'intuitive',
  'heuristic': 'intuitive',
  'design-pattern': 'intuitive',
  'architecture': 'systematic',
  'scalability': 'systematic',
  'reliability': 'systematic',
  'trade-off': 'pragmatic',
  'real-world': 'pragmatic',
  'practical': 'pragmatic'
};


// ============================================
// NODE: Build Cognitive Map
// ============================================

function buildCognitiveMapNode(state) {
  console.log('\n🧠 [COGNITIVE_MAP] Mapping questions to cognitive patterns...');
  
  const { questions } = state;
  const cognitiveMap = {};
  
  for (const q of questions) {
    const tags = Array.isArray(q.tags) ? q.tags : 
      (typeof q.tags === 'string' ? JSON.parse(q.tags || '[]') : []);
    
    // Determine cognitive patterns this question tests
    const patterns = {};
    
    for (const tag of tags) {
      const tagLower = tag.toLowerCase();
      for (const [keyword, pattern] of Object.entries(COGNITIVE_TAG_MAP)) {
        if (tagLower.includes(keyword)) {
          patterns[pattern] = (patterns[pattern] || 0) + 1;
        }
      }
    }
    
    // Analyze question text for cognitive indicators
    const qText = (q.question + ' ' + (q.answer || '')).toLowerCase();
    
    if (qText.includes('complexity') || qText.includes('big-o')) {
      patterns.analytical = (patterns.analytical || 0) + 2;
    }
    if (qText.includes('trade-off') || qText.includes('pros and cons')) {
      patterns.pragmatic = (patterns.pragmatic || 0) + 2;
    }
    if (qText.includes('design') || qText.includes('architect')) {
      patterns.systematic = (patterns.systematic || 0) + 2;
    }
    if (qText.includes('pattern') || qText.includes('approach')) {
      patterns.intuitive = (patterns.intuitive || 0) + 1;
    }
    
    // Normalize to percentages
    const total = Object.values(patterns).reduce((a, b) => a + b, 0) || 1;
    const normalized = {};
    for (const [p, v] of Object.entries(patterns)) {
      normalized[p] = Math.round((v / total) * 100);
    }
    
    cognitiveMap[q.id] = {
      patterns: normalized,
      primaryPattern: Object.entries(normalized).sort((a, b) => b[1] - a[1])[0]?.[0] || 'analytical',
      difficulty: q.difficulty || 'intermediate',
      channel: q.channel
    };
  }
  
  console.log(`   Mapped ${Object.keys(cognitiveMap).length} questions to cognitive patterns`);
  
  return { cognitiveMap };
}


// ============================================
// NODE: Calculate Company Weights
// ============================================

function calculateCompanyWeightsNode(state) {
  console.log('\n🏢 [COMPANY_WEIGHTS] Calculating company readiness weights...');
  
  const { questions, cognitiveMap } = state;
  const companyWeights = {};
  
  for (const q of questions) {
    const weights = {};
    const cognitive = cognitiveMap[q.id] || {};
    const channel = q.channel || 'general';
    const difficulty = q.difficulty || 'intermediate';
    
    for (const [companyId, profile] of Object.entries(COMPANY_PROFILES)) {
      let weight = 1.0;
      
      // Channel relevance
      const channelWeight = profile.weight[channel] || 1.0;
      weight *= channelWeight;
      
      // Difficulty match
      if (profile.difficultyBias === 'hard' && difficulty === 'advanced') {
        weight *= 1.3;
      } else if (profile.difficultyBias === 'medium' && difficulty === 'intermediate') {
        weight *= 1.2;
      }
      
      // Cognitive pattern match
      const primaryPattern = cognitive.primaryPattern;
      if (profile.cognitiveEmphasis.some(e => 
        primaryPattern === 'analytical' && e === 'analytical' ||
        primaryPattern === 'pragmatic' && e === 'practical' ||
        primaryPattern === 'systematic' && e === 'depth'
      )) {
        weight *= 1.2;
      }
      
      weights[companyId] = Math.round(weight * 100) / 100;
    }
    
    companyWeights[q.id] = weights;
  }
  
  console.log(`   Calculated weights for ${Object.keys(companyWeights).length} questions`);
  
  return { companyWeights, companyProfiles: COMPANY_PROFILES };
}


// ============================================
// NODE: Generate Knowledge DNA Templates
// ============================================

function generateKnowledgeDNANode(state) {
  console.log('\n🧬 [KNOWLEDGE_DNA] Generating knowledge DNA templates...');
  
  const { questions, channels } = state;
  
  // Build DNA structure per channel
  const knowledgeDNA = {
    channels: {},
    skills: {},
    cognitiveProfile: COGNITIVE_PATTERNS,
    totalQuestions: questions.length
  };
  
  // Aggregate by channel
  for (const q of questions) {
    const channel = q.channel || 'general';
    if (!knowledgeDNA.channels[channel]) {
      knowledgeDNA.channels[channel] = {
        total: 0,
        byDifficulty: { beginner: 0, intermediate: 0, advanced: 0 },
        skills: new Set()
      };
    }
    
    knowledgeDNA.channels[channel].total++;
    knowledgeDNA.channels[channel].byDifficulty[q.difficulty || 'intermediate']++;
    
    // Extract skills from tags
    const tags = Array.isArray(q.tags) ? q.tags : 
      (typeof q.tags === 'string' ? JSON.parse(q.tags || '[]') : []);
    tags.forEach(t => {
      knowledgeDNA.channels[channel].skills.add(t);
      knowledgeDNA.skills[t] = (knowledgeDNA.skills[t] || 0) + 1;
    });
  }
  
  // Convert Sets to arrays for JSON serialization
  for (const channel of Object.keys(knowledgeDNA.channels)) {
    knowledgeDNA.channels[channel].skills = [...knowledgeDNA.channels[channel].skills];
  }
  
  // Top skills across all channels
  knowledgeDNA.topSkills = Object.entries(knowledgeDNA.skills)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([skill, count]) => ({ skill, count }));
  
  console.log(`   DNA covers ${Object.keys(knowledgeDNA.channels).length} channels`);
  console.log(`   Top skills: ${knowledgeDNA.topSkills.slice(0, 5).map(s => s.skill).join(', ')}`);
  
  return { knowledgeDNA };
}


// ============================================
// NODE: Generate Mock Interview Sets
// ============================================

function generateMockInterviewsNode(state) {
  console.log('\n🎤 [MOCK_INTERVIEWS] Generating mock interview question sets...');
  
  const { questions, companyWeights, cognitiveMap } = state;
  const mockInterviews = {};
  
  // Generate interview sets for each company
  for (const [companyId, profile] of Object.entries(COMPANY_PROFILES)) {
    // Score and sort questions by company relevance
    const scored = questions.map(q => ({
      ...q,
      companyScore: companyWeights[q.id]?.[companyId] || 1.0,
      cognitive: cognitiveMap[q.id]
    })).sort((a, b) => b.companyScore - a.companyScore);
    
    // Build interview rounds
    const rounds = {
      phone: [], // 3-5 questions, easier
      onsite1: [], // 5-7 questions, mixed
      onsite2: [], // 5-7 questions, harder
      systemDesign: [] // 2-3 system design questions
    };
    
    // Phone screen: top beginner/intermediate questions
    rounds.phone = scored
      .filter(q => q.difficulty !== 'advanced')
      .slice(0, 5)
      .map(q => q.id);
    
    // Onsite 1: mixed difficulty
    rounds.onsite1 = scored
      .filter(q => !rounds.phone.includes(q.id))
      .slice(0, 7)
      .map(q => q.id);
    
    // Onsite 2: harder questions
    rounds.onsite2 = scored
      .filter(q => q.difficulty === 'advanced' || q.difficulty === 'intermediate')
      .filter(q => !rounds.phone.includes(q.id) && !rounds.onsite1.includes(q.id))
      .slice(0, 7)
      .map(q => q.id);
    
    // System design round
    rounds.systemDesign = scored
      .filter(q => q.channel === 'system-design')
      .slice(0, 3)
      .map(q => q.id);
    
    mockInterviews[companyId] = {
      company: profile.name,
      style: profile.interviewStyle,
      emphasis: profile.cognitiveEmphasis,
      rounds,
      totalQuestions: Object.values(rounds).flat().length
    };
    
    console.log(`   ${profile.name}: ${mockInterviews[companyId].totalQuestions} questions across ${Object.keys(rounds).length} rounds`);
  }
  
  return { mockInterviews };
}


// ============================================
// NODE: Save Intelligence Data
// ============================================

async function saveIntelligenceNode(state) {
  console.log('\n💾 [SAVE] Writing intelligence data to JSON files...');
  
  const { outputDir, cognitiveMap, companyWeights, companyProfiles, knowledgeDNA, mockInterviews } = state;
  
  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    // Save cognitive map
    await fs.writeFile(
      path.join(outputDir, 'cognitive-map.json'),
      JSON.stringify({ generated: new Date().toISOString(), data: cognitiveMap }, null, 2)
    );
    console.log('   ✓ cognitive-map.json');
    
    // Save company weights
    await fs.writeFile(
      path.join(outputDir, 'company-weights.json'),
      JSON.stringify({ generated: new Date().toISOString(), data: companyWeights }, null, 2)
    );
    console.log('   ✓ company-weights.json');
    
    // Save company profiles
    await fs.writeFile(
      path.join(outputDir, 'company-profiles.json'),
      JSON.stringify({ generated: new Date().toISOString(), data: companyProfiles }, null, 2)
    );
    console.log('   ✓ company-profiles.json');
    
    // Save knowledge DNA
    await fs.writeFile(
      path.join(outputDir, 'knowledge-dna.json'),
      JSON.stringify({ generated: new Date().toISOString(), data: knowledgeDNA }, null, 2)
    );
    console.log('   ✓ knowledge-dna.json');
    
    // Save mock interviews
    await fs.writeFile(
      path.join(outputDir, 'mock-interviews.json'),
      JSON.stringify({ generated: new Date().toISOString(), data: mockInterviews }, null, 2)
    );
    console.log('   ✓ mock-interviews.json');
    
    return { status: 'completed' };
    
  } catch (error) {
    console.error('   ✗ Save failed:', error.message);
    return { status: 'failed', error: error.message };
  }
}


// ============================================
// GRAPH BUILDER
// ============================================

export function createInterviewIntelligenceGraph() {
  const graph = new StateGraph(IntelligenceState);
  
  graph.addNode('build_cognitive_map', buildCognitiveMapNode);
  graph.addNode('calculate_company_weights', calculateCompanyWeightsNode);
  graph.addNode('generate_knowledge_dna', generateKnowledgeDNANode);
  graph.addNode('generate_mock_interviews', generateMockInterviewsNode);
  graph.addNode('save_intelligence', saveIntelligenceNode);
  
  graph.addEdge(START, 'build_cognitive_map');
  graph.addEdge('build_cognitive_map', 'calculate_company_weights');
  // generate_knowledge_dna only reads `questions` — independent of company weights
  graph.addEdge('build_cognitive_map', 'generate_knowledge_dna');
  // generate_mock_interviews needs both companyWeights and knowledgeDNA
  graph.addEdge('calculate_company_weights', 'generate_mock_interviews');
  graph.addEdge('generate_knowledge_dna', 'generate_mock_interviews');
  graph.addEdge('generate_mock_interviews', 'save_intelligence');
  graph.addEdge('save_intelligence', END);
  
  return graph.compile();
}

// ============================================
// MAIN RUNNER
// ============================================

let _compiledIntelligenceGraph = null;
export async function generateInterviewIntelligence(questions, options = {}) {
  const graph = _compiledIntelligenceGraph ??= createInterviewIntelligenceGraph();
  
  console.log('\n' + '═'.repeat(60));
  console.log('🧠 INTERVIEW INTELLIGENCE PIPELINE');
  console.log('═'.repeat(60));
  console.log(`Questions: ${questions.length}`);
  console.log(`Output: ${options.outputDir || 'client/public/data/intelligence'}`);
  
  const channels = [...new Set(questions.map(q => q.channel).filter(Boolean))];
  
  const initialState = {
    questions,
    channels,
    outputDir: options.outputDir || 'client/public/data/intelligence',
    companyProfiles: {},
    cognitiveMap: {},
    companyWeights: {},
    knowledgeDNA: {},
    mockInterviews: {},
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
    console.log('✅ INTELLIGENCE GENERATION COMPLETE');
    console.log('═'.repeat(60) + '\n');
    
    return { success: true, status: finalResult.status };
    
  } catch (error) {
    console.error('Pipeline error:', error);
    return { success: false, error: error.message };
  }
}

export default { createInterviewIntelligenceGraph, generateInterviewIntelligence, COMPANY_PROFILES, COGNITIVE_PATTERNS };
