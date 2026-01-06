/**
 * LangGraph-based RCA Blog Generation Pipeline
 * 
 * Searches for real incident reports/postmortems from tech companies
 * and generates engaging blog posts from them.
 * 
 * Flow:
 *   search_incidents → validate_incidents → select_incident → generate_blog → validate_output → end
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';
import ai from '../index.js';

// Define the state schema
const RCABlogState = Annotation.Root({
  // Input
  company: Annotation({ reducer: (_, b) => b, default: () => '' }),
  
  // Search results
  searchQueries: Annotation({ reducer: (_, b) => b, default: () => [] }),
  incidents: Annotation({ reducer: (_, b) => b, default: () => [] }),
  selectedIncident: Annotation({ reducer: (_, b) => b, default: () => null }),
  
  // Blog generation
  blogContent: Annotation({ reducer: (_, b) => b, default: () => null }),
  
  // Processing state
  searchAttempts: Annotation({ reducer: (_, b) => b, default: () => 0 }),
  maxSearchAttempts: Annotation({ reducer: (_, b) => b, default: () => 2 }),
  retryCount: Annotation({ reducer: (_, b) => b, default: () => 0 }),
  maxRetries: Annotation({ reducer: (_, b) => b, default: () => 2 }),
  
  // Output
  status: Annotation({ reducer: (_, b) => b, default: () => 'pending' }),
  error: Annotation({ reducer: (_, b) => b, default: () => null })
});

/**
 * Node: Search for incidents/postmortems
 */
async function searchIncidentsNode(state) {
  const attempt = state.searchAttempts + 1;
  console.log(`\n🔍 [SEARCH_INCIDENTS] Searching for ${state.company} incidents (attempt ${attempt})...`);
  
  const searchQueries = [
    `${state.company} engineering blog postmortem incident`,
    `${state.company} outage root cause analysis`,
    `${state.company} system failure post-incident review`,
    `${state.company} production incident lessons learned`
  ];
  
  try {
    const result = await ai.run('rcaSearch', {
      company: state.company,
      searchQueries
    });
    
    if (result && result.incidents && result.incidents.length > 0) {
      console.log(`   ✅ Found ${result.incidents.length} incidents`);
      result.incidents.forEach((inc, i) => {
        console.log(`   ${i + 1}. ${inc.title || 'Untitled'}`);
      });
      
      return {
        searchQueries,
        incidents: result.incidents,
        searchAttempts: attempt
      };
    }
    
    console.log(`   ⚠️ No incidents found`);
    return {
      searchQueries,
      incidents: [],
      searchAttempts: attempt
    };
  } catch (error) {
    console.log(`   ❌ Search failed: ${error.message}`);
    return {
      searchQueries,
      incidents: [],
      searchAttempts: attempt,
      error: error.message
    };
  }
}

/**
 * Node: Validate and filter incidents
 */
function validateIncidentsNode(state) {
  console.log('\n✅ [VALIDATE_INCIDENTS] Checking incident quality...');
  
  if (!state.incidents || state.incidents.length === 0) {
    console.log(`   ❌ No incidents to validate`);
    return {
      status: 'error',
      error: `No incidents found for ${state.company}`
    };
  }
  
  // Filter incidents with enough detail
  const validIncidents = state.incidents.filter(inc => {
    const hasTitle = inc.title && inc.title.length > 10;
    const hasDescription = inc.description && inc.description.length > 50;
    return hasTitle && hasDescription;
  });
  
  console.log(`   Valid incidents: ${validIncidents.length}/${state.incidents.length}`);
  
  if (validIncidents.length === 0) {
    return {
      status: 'error',
      error: 'No incidents with sufficient detail'
    };
  }
  
  return { incidents: validIncidents };
}

/**
 * Node: Select the best incident
 */
function selectIncidentNode(state) {
  console.log('\n🎯 [SELECT_INCIDENT] Choosing best incident...');
  
  // Score incidents by detail level
  const scored = state.incidents.map(inc => ({
    ...inc,
    score: (inc.title?.length || 0) + 
           (inc.description?.length || 0) * 2 +
           (inc.lesson?.length || 0) * 3 +
           (inc.sourceUrl ? 50 : 0)
  }));
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  const selected = scored[0];
  console.log(`   Selected: ${selected.title}`);
  console.log(`   Score: ${selected.score}`);
  
  return { selectedIncident: selected };
}

/**
 * Node: Generate blog from incident
 */
async function generateBlogNode(state) {
  console.log(`\n📝 [GENERATE_BLOG] Creating blog from ${state.company} incident...`);
  console.log(`   Incident: ${state.selectedIncident.title}`);
  
  try {
    const result = await ai.run('rcaBlog', {
      company: state.company,
      incident: state.selectedIncident
    });
    
    if (result && result.title) {
      console.log(`   ✅ Generated: ${result.title}`);
      return { blogContent: result };
    }
    
    return { status: 'error', error: 'No title in generated content' };
  } catch (error) {
    console.log(`   ❌ Generation failed: ${error.message}`);
    
    if (state.retryCount < state.maxRetries) {
      return { retryCount: state.retryCount + 1 };
    }
    
    return { status: 'error', error: error.message };
  }
}

/**
 * Node: Validate output
 */
function validateOutputNode(state) {
  console.log('\n🎯 [VALIDATE_OUTPUT] Final validation...');
  
  if (state.error && !state.blogContent) {
    console.log(`   ❌ Error: ${state.error}`);
    return { status: 'error' };
  }
  
  if (!state.blogContent) {
    console.log(`   ❌ No blog content generated`);
    return { status: 'error', error: 'No blog content' };
  }
  
  const blog = state.blogContent;
  const issues = [];
  
  if (!blog.title) issues.push('Missing title');
  if (!blog.introduction) issues.push('Missing introduction');
  if (!blog.sections || blog.sections.length < 2) issues.push('Need more sections');
  
  if (issues.length > 0) {
    console.log(`   ⚠️ Issues: ${issues.join(', ')}`);
  }
  
  console.log(`   ✅ Blog validated`);
  console.log(`   Title: ${blog.title}`);
  console.log(`   Company: ${state.company}`);
  
  return { status: 'completed' };
}

/**
 * Router: After search, decide to validate or retry
 */
function routeAfterSearch(state) {
  if (state.incidents && state.incidents.length > 0) {
    return 'validate_incidents';
  }
  if (state.searchAttempts < state.maxSearchAttempts) {
    console.log(`\n🔀 [ROUTER] No incidents found, retrying search...`);
    return 'search_incidents';
  }
  return 'validate_output';
}

/**
 * Router: After generation, decide to validate or retry
 */
function routeAfterGeneration(state) {
  if (state.blogContent) {
    return 'validate_output';
  }
  if (state.retryCount < state.maxRetries && !state.error) {
    console.log(`\n🔀 [ROUTER] Retrying generation (attempt ${state.retryCount + 1})...`);
    return 'generate_blog';
  }
  return 'validate_output';
}

/**
 * Build and compile the RCA blog graph
 */
export function createRCABlogGraph() {
  const graph = new StateGraph(RCABlogState);
  
  graph.addNode('search_incidents', searchIncidentsNode);
  graph.addNode('validate_incidents', validateIncidentsNode);
  graph.addNode('select_incident', selectIncidentNode);
  graph.addNode('generate_blog', generateBlogNode);
  graph.addNode('validate_output', validateOutputNode);
  
  graph.addEdge(START, 'search_incidents');
  
  graph.addConditionalEdges('search_incidents', routeAfterSearch, {
    'search_incidents': 'search_incidents',
    'validate_incidents': 'validate_incidents',
    'validate_output': 'validate_output'
  });
  
  graph.addEdge('validate_incidents', 'select_incident');
  graph.addEdge('select_incident', 'generate_blog');
  
  graph.addConditionalEdges('generate_blog', routeAfterGeneration, {
    'generate_blog': 'generate_blog',
    'validate_output': 'validate_output'
  });
  
  graph.addEdge('validate_output', END);
  
  return graph.compile();
}

/**
 * Run the RCA blog generation pipeline
 */
export async function generateRCABlog(company) {
  const graph = createRCABlogGraph();
  
  console.log('\n' + '═'.repeat(60));
  console.log('🚀 LANGGRAPH RCA BLOG PIPELINE');
  console.log('═'.repeat(60));
  console.log(`Company: ${company}`);
  
  const initialState = {
    company,
    searchQueries: [],
    incidents: [],
    selectedIncident: null,
    blogContent: null,
    searchAttempts: 0,
    maxSearchAttempts: 2,
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
    
    console.log(`Title: ${finalResult.blogContent?.title}`);
    console.log(`Company: ${company}`);
    console.log('═'.repeat(60) + '\n');
    
    return {
      success: true,
      blogContent: finalResult.blogContent,
      incident: finalResult.selectedIncident,
      company
    };
    
  } catch (error) {
    console.error('Pipeline error:', error);
    return { success: false, error: error.message };
  }
}

export default { createRCABlogGraph, generateRCABlog };
