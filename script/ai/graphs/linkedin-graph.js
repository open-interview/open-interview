/**
 * LangGraph-based LinkedIn Post Generation Pipeline
 * 
 * This graph orchestrates LinkedIn post generation with story-style content,
 * quality checks, URL validation, image generation, and duplicate tag removal.
 * 
 * Flow:
 *   validate_url → generate_image → generate_story → quality_check_1 → build_post → quality_check_2 → final_validate → end
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';
import ai from '../index.js';
import { generateLinkedInImage, validateLinkedInImage } from '../utils/linkedin-image-generator.js';

const PRACTICE_LINK = 'https://open-interview.github.io/';
const IMAGES_DIR = 'blog-output/images';

// Define the state schema using Annotation
const LinkedInState = Annotation.Root({
  // Input data
  postId: Annotation({ reducer: (_, b) => b, default: () => '' }),
  title: Annotation({ reducer: (_, b) => b, default: () => '' }),
  url: Annotation({ reducer: (_, b) => b, default: () => '' }),
  excerpt: Annotation({ reducer: (_, b) => b, default: () => '' }),
  channel: Annotation({ reducer: (_, b) => b, default: () => '' }),
  tags: Annotation({ reducer: (_, b) => b, default: () => '' }),
  
  // URL validation
  urlValid: Annotation({ reducer: (_, b) => b, default: () => false }),
  
  // Image generation
  imagePath: Annotation({ reducer: (_, b) => b, default: () => '' }),
  imageValid: Annotation({ reducer: (_, b) => b, default: () => false }),
  imageScene: Annotation({ reducer: (_, b) => b, default: () => '' }),
  
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
 * Validate a URL by checking if it returns a valid response
 */
async function validateUrl(url, timeout = 10000) {
  if (!url) return false;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkedInBot/1.0)'
      }
    });
    
    clearTimeout(timeoutId);
    return response.ok || response.status === 405; // 405 = Method Not Allowed (but page exists)
  } catch {
    // Try GET as fallback
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LinkedInBot/1.0)'
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
 * Node: Validate article URL exists
 */
async function validateUrlNode(state) {
  console.log('\n🔗 [VALIDATE_URL] Checking article URL...');
  console.log(`   URL: ${state.url}`);
  
  if (!state.url) {
    console.log('   ❌ No URL provided');
    return {
      urlValid: false,
      status: 'error',
      error: 'No article URL provided'
    };
  }
  
  const isValid = await validateUrl(state.url);
  
  if (isValid) {
    console.log('   ✅ Article URL is valid and accessible');
    return { urlValid: true };
  } else {
    console.log('   ❌ Article URL returned 404 or is unreachable');
    return {
      urlValid: false,
      status: 'error',
      error: `Article URL not accessible: ${state.url}`
    };
  }
}

/**
 * Router: After URL validation, decide to continue or stop
 */
function routeAfterUrlValidation(state) {
  if (!state.urlValid) {
    console.log('\n🔀 [ROUTER] URL invalid, stopping pipeline');
    return 'final_validate';
  }
  return 'generate_image';
}

/**
 * Node: Generate LinkedIn-compatible image
 */
async function generateImageNode(state) {
  console.log('\n🖼️  [GENERATE_IMAGE] Creating LinkedIn image...');
  
  // Skip image generation if disabled
  if (process.env.SKIP_IMAGE === 'true') {
    console.log('   ⚠️ Image generation skipped (SKIP_IMAGE=true)');
    return {
      imagePath: '',
      imageValid: false,
      qualityIssues: ['Image generation skipped']
    };
  }
  
  try {
    const result = await generateLinkedInImage(
      state.title,
      state.excerpt || '',
      IMAGES_DIR
    );
    
    if (result.success) {
      console.log(`   ✅ Image generated: ${result.path}`);
      console.log(`   Scene: ${result.scene}, Generator: ${result.generatorType}`);
      
      // Validate the generated image
      const validation = validateLinkedInImage(result.path);
      
      if (validation.warnings.length > 0) {
        console.log(`   ⚠️ Warnings: ${validation.warnings.join(', ')}`);
      }
      
      return {
        imagePath: result.path,
        imageValid: validation.valid,
        imageScene: result.scene,
        qualityIssues: validation.warnings
      };
    } else {
      console.log(`   ❌ Image generation failed: ${result.issues?.join(', ')}`);
      return {
        imagePath: '',
        imageValid: false,
        qualityIssues: result.issues || ['Image generation failed']
      };
    }
  } catch (error) {
    console.log(`   ❌ Image generation error: ${error.message}`);
    return {
      imagePath: '',
      imageValid: false,
      qualityIssues: [`Image error: ${error.message}`]
    };
  }
}

/**
 * Node: Generate engaging story using AI
 */
async function generateStoryNode(state) {
  console.log('\n📝 [GENERATE_STORY] Creating engaging LinkedIn story...');
  
  // Check if we should skip AI (for testing or when AI is unavailable)
  if (process.env.SKIP_AI === 'true') {
    console.log('   ⚠️ AI skipped (SKIP_AI=true)');
    return generateFallbackStory(state);
  }
  
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
    return generateFallbackStory(state);
  }
}

/**
 * Fallback hook patterns for when AI is unavailable
 * Includes recency-focused hooks for trending topics
 */
const FALLBACK_HOOKS = [
  (title, emoji) => `${emoji} ${title}\n\nEver wondered why this matters? Here's the breakdown.`,
  (title, emoji) => `${emoji} What if I told you this one concept could change how you approach ${title.toLowerCase().split(' ').slice(0, 3).join(' ')}?`,
  (title, emoji) => `${emoji} The hidden truth about ${title.toLowerCase().split(' ').slice(0, 3).join(' ')} nobody talks about.`,
  (title, emoji) => `${emoji} ${title}\n\nThis single insight separates good engineers from great ones.`,
  (title, emoji) => `${emoji} Stop making this mistake with ${title.toLowerCase().split(' ').slice(0, 3).join(' ')}.`,
  (title, emoji) => `${emoji} ${title}\n\nHere's what top engineers know that you don't.`,
  (title, emoji) => `${emoji} Why do senior devs approach ${title.toLowerCase().split(' ').slice(0, 3).join(' ')} differently?`,
  (title, emoji) => `${emoji} ${title}\n\nThe counterintuitive approach that actually works.`,
  // Recency-focused hooks
  (title, emoji) => `🆕 ${title}\n\nThe 2025 approach that's changing everything.`,
  (title, emoji) => `${emoji} ${title}\n\nIf you're not using this yet, you're falling behind.`,
  (title, emoji) => `${emoji} Major update alert: ${title.toLowerCase().split(' ').slice(0, 4).join(' ')} just got better.`,
  (title, emoji) => `${emoji} ${title}\n\nWhat changed in the last 6 months that you need to know.`
];

// Keywords that indicate recent/trending topics
const TRENDING_KEYWORDS = [
  'ai', 'llm', 'gpt', 'claude', 'gemini', 'copilot', 'cursor',
  'react 19', 'node 22', 'python 3.13', 'typescript 5',
  'kubernetes', 'docker', 'terraform', 'opentofu',
  'vector', 'rag', 'langchain', 'langgraph',
  'platform engineering', 'backstage', 'opentelemetry'
];

/**
 * Check if content relates to trending/recent topics
 */
function isTrendingTopic(title, channel, tags) {
  const content = `${title} ${channel} ${tags}`.toLowerCase();
  return TRENDING_KEYWORDS.some(kw => content.includes(kw));
}

/**
 * Generate fallback story without AI
 */
function generateFallbackStory(state) {
  const emoji = getChannelEmoji(state.channel);
  
  // Check if this is a trending topic - if so, prefer recency hooks (last 4 in array)
  const isTrending = isTrendingTopic(state.title, state.channel, state.tags);
  
  let hookIndex;
  if (isTrending) {
    // Use recency-focused hooks (indices 8-11)
    hookIndex = 8 + Math.floor(Math.random() * 4);
    console.log(`   📈 Trending topic detected, using recency hook`);
  } else {
    // Use standard hooks (indices 0-7)
    hookIndex = Math.floor(Math.random() * 8);
  }
  
  const hookFn = FALLBACK_HOOKS[hookIndex];
  
  let story = '';
  
  if (state.excerpt && state.excerpt.length > 50) {
    // Use excerpt but ensure it ends properly
    let excerpt = state.excerpt;
    
    // Truncate to ~200 chars at sentence boundary
    if (excerpt.length > 200) {
      const sentences = excerpt.match(/[^.!?]+[.!?]+/g) || [];
      excerpt = '';
      for (const sentence of sentences) {
        if ((excerpt + sentence).length <= 200) {
          excerpt += sentence;
        } else {
          break;
        }
      }
    }
    
    // Ensure it ends with punctuation
    if (!excerpt.match(/[.!?]$/)) {
      excerpt = excerpt.trim() + '.';
    }
    
    // Use varied hook + excerpt
    const hook = hookFn(state.title, emoji);
    story = `${hook}\n\n${excerpt}`;
  } else {
    // Use varied hook only
    story = hookFn(state.title, emoji);
  }
  
  console.log(`   Using fallback template #${hookIndex + 1} (${story.length} chars)`);
  return {
    story,
    qualityIssues: ['AI generation skipped, using fallback']
  };
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
  
  // Remove ASCII box characters that don't render well on LinkedIn
  const hasAsciiBox = cleanStory.match(/[┌┐└┘│─├┤┬┴┼]/);
  if (hasAsciiBox) {
    issues.push('Removed ASCII box characters (they break on LinkedIn)');
    // Replace box characters with simple alternatives
    cleanStory = cleanStory
      .replace(/[┌┐└┘├┤┬┴┼]/g, '')
      .replace(/[│]/g, '|')
      .replace(/[─]/g, '-')
      .replace(/\|\s*\|/g, ' → ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
  
  // Check for cut-off text (ends with incomplete word or ellipsis)
  if (cleanStory.match(/\.\.\.$|…$|\w-$/)) {
    issues.push('Story appears to be cut off');
    // Try to fix by finding last complete sentence
    const sentences = cleanStory.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length > 0) {
      cleanStory = sentences.join(' ').trim();
      issues.push('Truncated to last complete sentence');
    }
  }
  
  // Check for repeated sentences
  const sentences = cleanStory.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const uniqueSentences = [...new Set(sentences.map(s => s.trim().toLowerCase()))];
  if (uniqueSentences.length < sentences.length * 0.8) {
    issues.push('Possible repeated content detected');
  }
  
  // Length check - keep it concise for LinkedIn
  if (cleanStory.length > 700) {
    issues.push(`Story too long (${cleanStory.length} chars), truncating`);
    // Truncate to last complete sentence under 650 chars
    const allSentences = cleanStory.match(/[^.!?]+[.!?]+/g) || [];
    let truncated = '';
    for (const sentence of allSentences) {
      if ((truncated + sentence).length <= 650) {
        truncated += sentence;
      } else {
        break;
      }
    }
    if (truncated.length > 100) {
      cleanStory = truncated.trim();
    }
  }
  
  if (cleanStory.length < 100) {
    issues.push('Story may be too short');
  }
  
  // Check if story has emoji flow (good!)
  const hasEmojiFlow = cleanStory.match(/[→➡️⬇️]/) && cleanStory.match(/[✅❌🚀💡⚡🔥📈🔧📥📤⚙️]/);
  if (hasEmojiFlow) {
    console.log('   ✨ Emoji flow detected');
  }
  
  if (issues.length > 0) {
    console.log(`   ⚠️ Issues: ${issues.join(', ')}`);
  } else {
    console.log(`   ✅ Story quality OK`);
  }
  
  console.log(`   Final story length: ${cleanStory.length} chars`);
  
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
  let content = state.finalContent;
  
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
  
  // Check story doesn't end with cut-off text
  const storyPart = content.split('🔗')[0].trim();
  if (storyPart.match(/\.\.\.$|…$|,$/)) {
    issues.push('Story appears cut off - needs fix');
  }
  
  // Verify all sentences are complete (skip emoji-only lines and flow patterns)
  const sentences = storyPart.split(/(?<=[.!?])\s+/);
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    // Skip emoji flows (lines with arrows and emojis)
    const isEmojiFlow = trimmed.match(/[→➡️⬇️]/) && trimmed.match(/[✅❌🚀💡⚡🔥📈🔧📥📤⚙️1️⃣2️⃣3️⃣4️⃣]/);
    // Skip lines that are mostly emojis
    const isEmojiLine = trimmed.replace(/[\s→➡️⬇️✅❌🚀💡⚡🔥📈🔧📥📤⚙️1️⃣2️⃣3️⃣4️⃣🏗️🎨🗄️🔐🤖📊🧪☸️☁️💬🔄]/g, '').length < trimmed.length * 0.3;
    
    if (trimmed.length > 20 && !trimmed.match(/[.!?:"]$/) && !isEmojiFlow && !isEmojiLine) {
      issues.push(`Incomplete sentence detected: "${trimmed.substring(0, 30)}..."`);
    }
  }
  
  if (issues.length > 0) {
    console.log(`   ⚠️ Issues: ${issues.join(', ')}`);
  } else {
    console.log(`   ✅ Final quality OK`);
  }
  
  console.log(`   Total content length: ${content.length} chars`);
  
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
  graph.addNode('validate_url', validateUrlNode);
  graph.addNode('generate_image', generateImageNode);
  graph.addNode('generate_story', generateStoryNode);
  graph.addNode('quality_check_1', qualityCheck1Node);
  graph.addNode('build_post', buildPostNode);
  graph.addNode('quality_check_2', qualityCheck2Node);
  graph.addNode('final_validate', finalValidateNode);
  
  // Add edges - start with URL validation
  graph.addEdge(START, 'validate_url');
  
  // Conditional routing after URL validation
  graph.addConditionalEdges('validate_url', routeAfterUrlValidation, {
    'generate_image': 'generate_image',
    'final_validate': 'final_validate'
  });
  
  // Image generation leads to story generation
  graph.addEdge('generate_image', 'generate_story');
  
  // Rest of the flow
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
      const [, nodeState] = Object.entries(step)[0];
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
    
    // Log image info
    if (finalResult.imagePath) {
      console.log(`Image: ${finalResult.imagePath} (${finalResult.imageValid ? 'valid' : 'invalid'})`);
    }
    
    console.log('═'.repeat(60) + '\n');
    
    return {
      success: true,
      content: finalResult.finalContent,
      qualityIssues: finalResult.qualityIssues,
      image: {
        path: finalResult.imagePath,
        valid: finalResult.imageValid,
        scene: finalResult.imageScene
      }
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
