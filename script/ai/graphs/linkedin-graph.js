/**
 * LangGraph-based LinkedIn Post Generation Pipeline
 * 
 * This graph orchestrates LinkedIn post generation with story-style content,
 * quality checks, and duplicate tag removal.
 * 
 * Flow:
 *   generate_story → quality_check_1 → build_post → quality_check_2 → final_validate → end
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';
import ai from '../index.js';

const PRACTICE_LINK = 'https://open-interview.github.io/';

// Define the state schema using Annotation
const LinkedInState = Annotation.Root({
  // Input data
  postId: Annotation({ reducer: (_, b) => b, default: () => '' }),
  title: Annotation({ reducer: (_, b) => b, default: () => '' }),
  url: Annotation({ reducer: (_, b) => b, default: () => '' }),
  excerpt: Annotation({ reducer: (_, b) => b, default: () => '' }),
  channel: Annotation({ reducer: (_, b) => b, default: () => '' }),
  tags: Annotation({ reducer: (_, b) => b, default: () => '' }),
  
  // Generated content
  story: Annotation({ reducer: (_, b) => b, default: () => '' }),
  finalContent: Annotation({ reducer: (_, b) => b, default: () => '' }),
  cleanedTags: Annotation({ reducer: (_, b) => b, default: () => '' }),
  
  // Quality tracking
  qualityIssues: Annotation({ reducer: (a, b) => [...a, ...b], default: () => [] }),
  retryCount: Annotation({ reducer: (_, b) => b, default: () => 0 }),
  maxRetries: Annotation({ reducer: (_, b) => b, default: () => 2 }),
  
  // Output
  status: Annotation({ reducer: (_, b) => b, default: () => 'pending' }),
  error: Annotation({ reducer: (_, b) => b, default: () => null })
});

/**
 * Get channel emoji
 */
function getChannelEmoji(channel) {
  const emojiMap = {
    'system-design': '🏗️',
    'devops': '⚙️',
    'frontend': '🎨',
    'backend': '🔧',
    'database': '🗄️',
    'security': '🔐',
    'ml-ai': '🤖',
    'generative-ai': '🤖',
    'algorithms': '📊',
    'testing': '🧪',
    'sre': '📈',
    'kubernetes': '☸️',
    'aws': '☁️',
    'terraform': '🏗️',
    'behavioral': '💬',
    'data-engineering': '📊',
    'machine-learning': '🤖',
    'prompt-engineering': '💡',
    'llm-ops': '🔄'
  };
  return emojiMap[channel] || '📝';
}

/**
 * Node: Generate engaging story using AI
 */
async function generateStoryNode(state) {
  console.log('\n📝 [GENERATE_STORY] Creating engaging LinkedIn story...');
  
  try {
    const result = await ai.run('linkedinStory', {
      title: state.title,
      excerpt: state.excerpt,
      channel: state.channel,
      tags: state.tags
    });
    
    if (!result.story || result.story.length < 50) {
      throw new Error('Generated story too short');
    }
    
    console.log(`   ✅ Story generated (${result.story.length} chars)`);
    console.log(`   Preview: ${result.story.substring(0, 100)}...`);
    
    return {
      story: result.story
    };
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    
    // Fallback to simple template
    const emoji = getChannelEmoji(state.channel);
    const fallbackStory = `${emoji} ${state.title}\n\n${state.excerpt || 'Check out this in-depth technical article!'}`;
    
    console.log(`   Using fallback template`);
    return {
      story: fallbackStory,
      qualityIssues: ['AI generation failed, using fallback']
    };
  }
}

/**
 * Node: First quality check on generated story
 */
function qualityCheck1Node(state) {
  console.log('\n🔍 [QUALITY_CHECK_1] Checking story quality...');
  
  const issues = [];
  let cleanStory = state.story;
  
  // Remove any hashtags that leaked into story
  const hashtagsInStory = cleanStory.match(/#\w+/g) || [];
  if (hashtagsInStory.length > 0) {
    issues.push(`Removed ${hashtagsInStory.length} hashtags from story`);
    cleanStory = cleanStory.replace(/#\w+/g, '').trim();
  }
  
  // Remove any URLs that leaked into story
  const urlsInStory = cleanStory.match(/https?:\/\/[^\s]+/g) || [];
  if (urlsInStory.length > 0) {
    issues.push(`Removed ${urlsInStory.length} URLs from story`);
    cleanStory = cleanStory.replace(/https?:\/\/[^\s]+/g, '').trim();
  }
  
  // Check for repeated sentences
  const sentences = cleanStory.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const uniqueSentences = [...new Set(sentences.map(s => s.trim().toLowerCase()))];
  if (uniqueSentences.length < sentences.length * 0.8) {
    issues.push('Possible repeated content detected');
  }
  
  // Check length
  if (cleanStory.length > 1500) {
    issues.push('Story may be too long');
  }
  
  if (cleanStory.length < 100) {
    issues.push('Story may be too short');
  }
  
  if (issues.length > 0) {
    console.log(`   ⚠️ Issues: ${issues.join(', ')}`);
  } else {
    console.log(`   ✅ Story quality OK`);
  }
  
  return {
    story: cleanStory,
    qualityIssues: issues
  };
}

/**
 * Node: Build final post content
 */
function buildPostNode(state) {
  console.log('\n🔨 [BUILD_POST] Assembling final post...');
  
  // Deduplicate tags
  const allTags = (state.tags || '').match(/#\w+/g) || [];
  const tagsLower = allTags.map(t => t.toLowerCase());
  const uniqueTags = [...new Set(tagsLower)];
  
  // Rebuild tags preserving original casing
  const deduplicatedTags = uniqueTags.map(t => {
    const original = allTags.find(at => at.toLowerCase() === t);
    return original || t;
  });
  
  const cleanedTags = deduplicatedTags.join(' ') || '#tech #engineering #interview';
  
  if (deduplicatedTags.length < allTags.length) {
    console.log(`   Removed ${allTags.length - deduplicatedTags.length} duplicate tags`);
  }
  
  // Build final content
  const lines = [
    state.story,
    '',
    '🔗 Read the full article:',
    state.url,
    '',
    '🎯 Practice interview questions:',
    PRACTICE_LINK,
    '',
    cleanedTags
  ];
  
  const finalContent = lines.join('\n');
  
  console.log(`   ✅ Post built (${finalContent.length} chars)`);
  
  return {
    finalContent,
    cleanedTags
  };
}

/**
 * Node: Second quality check on final content
 */
function qualityCheck2Node(state) {
  console.log('\n🔍 [QUALITY_CHECK_2] Final quality check...');
  
  const issues = [];
  const content = state.finalContent;
  
  // Check total length
  if (content.length > 3000) {
    issues.push('Content exceeds LinkedIn limit (3000 chars)');
  }
  
  // Check for duplicate hashtags in final content
  const allHashtags = content.match(/#\w+/g) || [];
  const uniqueHashtags = [...new Set(allHashtags.map(t => t.toLowerCase()))];
  if (uniqueHashtags.length < allHashtags.length) {
    issues.push('Duplicate hashtags still present');
  }
  
  // Check required elements are present
  if (!content.includes(state.url)) {
    issues.push('Article URL missing');
  }
  
  if (!content.includes(PRACTICE_LINK)) {
    issues.push('Practice link missing');
  }
  
  if (issues.length > 0) {
    console.log(`   ⚠️ Issues: ${issues.join(', ')}`);
  } else {
    console.log(`   ✅ Final quality OK`);
  }
  
  return {
    qualityIssues: issues
  };
}

/**
 * Node: Final validation
 */
function finalValidateNode(state) {
  console.log('\n🎯 [FINAL_VALIDATE] Final validation...');
  
  if (state.error) {
    console.log(`   ❌ Error: ${state.error}`);
    return { status: 'error' };
  }
  
  if (!state.finalContent || state.finalContent.length < 100) {
    console.log(`   ❌ No valid content generated`);
    return { status: 'error', error: 'No valid content' };
  }
  
  // Check for critical issues
  const criticalIssues = state.qualityIssues.filter(i => 
    i.includes('exceeds') || i.includes('missing')
  );
  
  if (criticalIssues.length > 0) {
    console.log(`   ⚠️ Critical issues: ${criticalIssues.join(', ')}`);
  }
  
  console.log(`   ✅ Post validated and ready`);
  console.log(`   Character count: ${state.finalContent.length}/3000`);
  
  return { status: 'completed' };
}

/**
 * Build and compile the LinkedIn post generation graph
 */
export function createLinkedInGraph() {
  const graph = new StateGraph(LinkedInState);
  
  // Add nodes
  graph.addNode('generate_story', generateStoryNode);
  graph.addNode('quality_check_1', qualityCheck1Node);
  graph.addNode('build_post', buildPostNode);
  graph.addNode('quality_check_2', qualityCheck2Node);
  graph.addNode('final_validate', finalValidateNode);
  
  // Add edges - linear flow
  graph.addEdge(START, 'generate_story');
  graph.addEdge('generate_story', 'quality_check_1');
  graph.addEdge('quality_check_1', 'build_post');
  graph.addEdge('build_post', 'quality_check_2');
  graph.addEdge('quality_check_2', 'final_validate');
  graph.addEdge('final_validate', END);
  
  return graph.compile();
}

/**
 * Run the LinkedIn post generation pipeline
 * @param {Object} postData - Post data (title, url, excerpt, channel, tags)
 * @returns {Object} Result with final content
 */
export async function generateLinkedInPost(postData) {
  const graph = createLinkedInGraph();
  
  console.log('\n' + '═'.repeat(60));
  console.log('🚀 LANGGRAPH LINKEDIN POST PIPELINE');
  console.log('═'.repeat(60));
  console.log(`Title: ${postData.title?.substring(0, 50)}...`);
  console.log(`Channel: ${postData.channel}`);
  
  const initialState = {
    postId: postData.postId || '',
    title: postData.title,
    url: postData.url,
    excerpt: postData.excerpt || '',
    channel: postData.channel || '',
    tags: postData.tags || '#tech #engineering #interview',
    story: '',
    finalContent: '',
    cleanedTags: '',
    qualityIssues: [],
    retryCount: 0,
    maxRetries: 2,
    status: 'pending',
    error: null
  };
  
  try {
    let finalResult = initialState;
    
    for await (const step of await graph.stream(initialState)) {
      const [nodeName, nodeState] = Object.entries(step)[0];
      finalResult = { ...finalResult, ...nodeState };
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('📋 PIPELINE RESULT');
    console.log('═'.repeat(60));
    console.log(`Status: ${finalResult.status}`);
    
    if (finalResult.status === 'error') {
      console.log(`Error: ${finalResult.error}`);
      console.log('═'.repeat(60) + '\n');
      return {
        success: false,
        error: finalResult.error
      };
    }
    
    if (finalResult.qualityIssues.length > 0) {
      console.log(`Quality Issues: ${finalResult.qualityIssues.join(', ')}`);
    }
    
    console.log('═'.repeat(60) + '\n');
    
    return {
      success: true,
      content: finalResult.finalContent,
      qualityIssues: finalResult.qualityIssues
    };
    
  } catch (error) {
    console.error('Pipeline error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export default { createLinkedInGraph, generateLinkedInPost };
