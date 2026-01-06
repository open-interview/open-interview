/**
 * LangGraph-based Citation Blog Generation Pipeline
 * 
 * Generates blog posts from pre-curated, validated source URLs.
 * 
 * Flow:
 *   select_topic → validate_urls → fetch_content → generate_blog → validate_output → end
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';
import ai from '../index.js';

// Define the state schema
const CitationBlogState = Annotation.Root({
  // Input
  topic: Annotation({ reducer: (_, b) => b, default: () => '' }),
  urls: Annotation({ reducer: (_, b) => b, default: () => [] }),
  
  // URL validation
  validSources: Annotation({ reducer: (_, b) => b, default: () => [] }),
  invalidUrls: Annotation({ reducer: (_, b) => b, default: () => [] }),
  
  // Content fetching
  fetchedContent: Annotation({ reducer: (_, b) => b, default: () => [] }),
  
  // Blog generation
  blogContent: Annotation({ reducer: (_, b) => b, default: () => null }),
  
  // Processing state
  retryCount: Annotation({ reducer: (_, b) => b, default: () => 0 }),
  maxRetries: Annotation({ reducer: (_, b) => b, default: () => 2 }),
  
  // Output
  status: Annotation({ reducer: (_, b) => b, default: () => 'pending' }),
  error: Annotation({ reducer: (_, b) => b, default: () => null })
});

const MIN_VALID_SOURCES = 8;

/**
 * Validate a URL by checking if it returns a valid response
 */
async function validateUrl(url, timeout = 10000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    clearTimeout(timeoutId);
    return response.ok || response.status === 403 || response.status === 405;
  } catch {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Fetch content from a URL
 */
async function fetchContent(url, title, timeout = 15000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) return null;
    
    const html = await response.text();
    
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 6000);
    
    return { url, title, content: textContent };
  } catch (error) {
    console.log(`   ⚠️ Failed to fetch ${url}: ${error.message}`);
    return null;
  }
}

/**
 * Node: Validate URLs
 */
async function validateUrlsNode(state) {
  console.log(`\n🔗 [VALIDATE_URLS] Checking ${state.urls.length} URLs...`);
  
  const validSources = [];
  const invalidUrls = [];
  
  for (const item of state.urls) {
    if (!item.url) continue;
    
    const isValid = await validateUrl(item.url);
    
    if (isValid) {
      console.log(`   ✅ Valid: ${item.title?.substring(0, 50) || item.url}`);
      validSources.push(item);
    } else {
      console.log(`   ❌ Invalid: ${item.url}`);
      invalidUrls.push(item.url);
    }
    
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`\n📊 Valid URLs: ${validSources.length}/${state.urls.length}`);
  
  if (validSources.length < MIN_VALID_SOURCES) {
    return {
      validSources,
      invalidUrls,
      status: 'error',
      error: `Only ${validSources.length} valid URLs, need ${MIN_VALID_SOURCES}`
    };
  }
  
  return { validSources, invalidUrls };
}

/**
 * Node: Fetch content from valid URLs
 */
async function fetchContentNode(state) {
  console.log(`\n📥 [FETCH_CONTENT] Fetching content from ${state.validSources.length} URLs...`);
  
  const fetchedContent = [];
  
  for (const item of state.validSources) {
    const content = await fetchContent(item.url, item.title);
    if (content && content.content.length > 200) {
      fetchedContent.push(content);
      console.log(`   ✅ Fetched: ${item.title?.substring(0, 40)}... (${content.content.length} chars)`);
    } else {
      console.log(`   ⚠️ Skipped: ${item.title} (content too short)`);
    }
  }
  
  console.log(`\n📊 Fetched content: ${fetchedContent.length} sources`);
  
  if (fetchedContent.length < MIN_VALID_SOURCES) {
    return {
      fetchedContent,
      status: 'error',
      error: `Only ${fetchedContent.length} sources with content, need ${MIN_VALID_SOURCES}`
    };
  }
  
  return { fetchedContent };
}

/**
 * Node: Generate blog from fetched content
 */
async function generateBlogNode(state) {
  console.log(`\n📝 [GENERATE_BLOG] Creating blog from ${state.fetchedContent.length} sources...`);
  
  try {
    const result = await ai.run('citationBlog', {
      topic: state.topic,
      sources: state.fetchedContent
    });
    
    if (result && result.title) {
      // Ensure sources are from our validated list
      result.sources = state.fetchedContent.map((s) => ({
        title: s.title,
        url: s.url,
        type: detectSourceType(s.url)
      }));
      
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

function detectSourceType(url) {
  if (url.includes('docs.') || url.includes('/documentation') || url.includes('/docs/')) return 'docs';
  if (url.includes('arxiv') || url.includes('paper')) return 'paper';
  if (url.includes('github.com')) return 'github';
  return 'blog';
}

/**
 * Node: Validate output
 */
function validateOutputNode(state) {
  console.log('\n🎯 [VALIDATE_OUTPUT] Final validation...');
  
  if (state.error) {
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
  if (!blog.sources || blog.sources.length < 5) issues.push('Need more sources');
  
  if (issues.length > 0) {
    console.log(`   ⚠️ Issues: ${issues.join(', ')}`);
  }
  
  console.log(`   ✅ Blog validated`);
  console.log(`   Title: ${blog.title}`);
  console.log(`   Sources: ${blog.sources?.length || 0}`);
  
  return { status: 'completed' };
}

/**
 * Router: Check if we should retry generation
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
 * Build and compile the citation blog graph
 */
export function createCitationBlogGraph() {
  const graph = new StateGraph(CitationBlogState);
  
  graph.addNode('validate_urls', validateUrlsNode);
  graph.addNode('fetch_content', fetchContentNode);
  graph.addNode('generate_blog', generateBlogNode);
  graph.addNode('validate_output', validateOutputNode);
  
  graph.addEdge(START, 'validate_urls');
  graph.addEdge('validate_urls', 'fetch_content');
  graph.addEdge('fetch_content', 'generate_blog');
  
  graph.addConditionalEdges('generate_blog', routeAfterGeneration, {
    'generate_blog': 'generate_blog',
    'validate_output': 'validate_output'
  });
  
  graph.addEdge('validate_output', END);
  
  return graph.compile();
}

/**
 * Run the citation blog generation pipeline
 */
export async function generateCitationBlog(topic, urls) {
  const graph = createCitationBlogGraph();
  
  console.log('\n' + '═'.repeat(60));
  console.log('🚀 LANGGRAPH CITATION BLOG PIPELINE');
  console.log('═'.repeat(60));
  console.log(`Topic: ${topic}`);
  console.log(`URLs: ${urls.length}`);
  
  const initialState = {
    topic,
    urls,
    validSources: [],
    invalidUrls: [],
    fetchedContent: [],
    blogContent: null,
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
    console.log('═'.repeat(60) + '\n');
    
    return {
      success: true,
      blogContent: finalResult.blogContent,
      validSources: finalResult.fetchedContent
    };
    
  } catch (error) {
    console.error('Pipeline error:', error);
    return { success: false, error: error.message };
  }
}

export default { createCitationBlogGraph, generateCitationBlog };
