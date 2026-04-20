/**
 * 5-Agent Blog Pipeline Executor
 * Orchestrates the multi-agent blog generation process
 */

import { spawn } from 'child_process';
import { PIPELINE_CONFIG, PIPELINE_STAGES, QUALITY_GATES, RETRY_CONFIG } from './blog-pipeline-config.js';

/**
 * Call OpenCode CLI with retry logic
 */
async function callOpenCode(config, userPrompt, retries = 0) {
  const fullPrompt = `${config.systemPrompt}\n\n${userPrompt}`;
  
  return new Promise((resolve, reject) => {
    let output = '';
    const proc = spawn('opencode', ['run', '--model', config.model, '--format', 'json', fullPrompt], {
      timeout: RETRY_CONFIG.timeoutMs,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    const timeout = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error('OpenCode timeout'));
    }, RETRY_CONFIG.timeoutMs);
    
    proc.stdout.on('data', (data) => { output += data.toString(); });
    proc.stderr.on('data', (data) => { output += data.toString(); });
    
    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve(output.trim());
      } else if (retries < RETRY_CONFIG.maxRetries) {
        console.log(`   ⚠️  Retry ${retries + 1}/${RETRY_CONFIG.maxRetries}...`);
        setTimeout(() => {
          callOpenCode(config, userPrompt, retries + 1).then(resolve).catch(reject);
        }, RETRY_CONFIG.backoffMs * (retries + 1));
      } else {
        reject(new Error(`OpenCode failed with code ${code}`));
      }
    });
  });
}

/**
 * Agent 1: Research Agent
 */
export async function runResearchAgent(question) {
  console.log('🔬 Agent 1: Research Agent');
  
  const prompt = `Research the following technical topic and find real-world examples:

Topic: ${question.question}
Context: ${question.answer || ''}
Channel: ${question.channel}
Difficulty: ${question.difficulty}

Find:
1. 8-12 high-quality sources (prioritize official docs, engineering blogs, case studies)
2. 2-4 real-world production examples from major tech companies
3. Key technical insights and patterns
4. Recent developments (last 2 years preferred)

Return valid JSON only.`;

  const response = await callOpenCode(PIPELINE_CONFIG.research, prompt);
  const data = JSON.parse(response);
  
  // Validate quality gates
  if (data.sources.length < QUALITY_GATES.research.minSources) {
    throw new Error(`Insufficient sources: ${data.sources.length} < ${QUALITY_GATES.research.minSources}`);
  }
  
  console.log(`   ✅ Found ${data.sources.length} sources, ${data.realWorldCases.length} cases`);
  return data;
}

/**
 * Agent 2: Structure Agent
 */
export async function runStructureAgent(question, researchData) {
  console.log('🏗️  Agent 2: Structure Agent');
  
  const prompt = `Create a compelling blog post structure:

Topic: ${question.question}
Research Insights: ${JSON.stringify(researchData.keyInsights)}
Real-World Cases: ${JSON.stringify(researchData.realWorldCases)}

Create:
1. Compelling title (60-70 chars)
2. Hook that draws readers in
3. 4-8 main sections with clear purpose
4. Mermaid diagram placements
5. Code example placements
6. Strong conclusion

Return valid JSON only.`;

  const response = await callOpenCode(PIPELINE_CONFIG.structure, prompt);
  const data = JSON.parse(response);
  
  // Validate quality gates
  if (data.sections.length < QUALITY_GATES.structure.minSections) {
    throw new Error(`Insufficient sections: ${data.sections.length} < ${QUALITY_GATES.structure.minSections}`);
  }
  
  console.log(`   ✅ Created structure with ${data.sections.length} sections, ${data.diagrams.length} diagrams`);
  return data;
}

/**
 * Agent 3: Content Agent
 */
export async function runContentAgent(question, researchData, structureData) {
  console.log('✍️  Agent 3: Content Agent');
  
  const prompt = `Write an elite technical blog post:

Title: ${structureData.title}
Hook: ${structureData.hook}
Structure: ${JSON.stringify(structureData.sections)}
Sources: ${JSON.stringify(researchData.sources)}
Real-World Cases: ${JSON.stringify(researchData.realWorldCases)}

Write complete MDX content with:
1. Frontmatter (YAML)
2. Compelling hook using blockquote
3. All sections with technical depth
4. Mermaid diagrams for architecture
5. Code examples with explanations
6. Real-world examples
7. Strong conclusion
8. Proper formatting (short paragraphs, bullets, bold)

Channel: ${question.channel}
Difficulty: ${question.difficulty}
Target reading time: 8-12 minutes

Return complete MDX file content.`;

  const response = await callOpenCode(PIPELINE_CONFIG.content, prompt);
  
  // Validate quality gates
  const wordCount = response.split(/\s+/).length;
  if (wordCount < QUALITY_GATES.content.minWords) {
    throw new Error(`Content too short: ${wordCount} < ${QUALITY_GATES.content.minWords}`);
  }
  
  console.log(`   ✅ Generated ${wordCount} words`);
  return response;
}

/**
 * Agent 4: Polish Agent
 */
export async function runPolishAgent(content) {
  console.log('✨ Agent 4: Polish Agent');
  
  const prompt = `Polish this technical blog post for maximum impact:

${content}

Enhance:
1. Readability and flow
2. Sentence structure and transitions
3. Technical accuracy
4. Formatting consistency
5. Add callout boxes for key insights (use blockquotes with emoji)
6. Strengthen hook and conclusion
7. Ensure short paragraphs (3-4 sentences)

Maintain:
- Technical depth
- Professional tone
- All code examples
- All diagrams
- All sources

Return complete polished MDX content.`;

  const response = await callOpenCode(PIPELINE_CONFIG.polish, prompt);
  
  console.log(`   ✅ Content polished`);
  return response;
}

/**
 * Agent 5: SEO Agent
 */
export async function runSEOAgent(content) {
  console.log('🎯 Agent 5: SEO Agent');
  
  const prompt = `Optimize this blog post for SEO and engagement:

${content}

Generate:
1. Meta description (150-160 chars)
2. 8-12 relevant keywords
3. Optimized headings (if needed)
4. Social media snippets
5. Alt text suggestions for diagrams

Return valid JSON only.`;

  const response = await callOpenCode(PIPELINE_CONFIG.seo, prompt);
  const data = JSON.parse(response);
  
  // Validate quality gates
  if (data.seo.keywords.length < QUALITY_GATES.seo.minKeywords) {
    throw new Error(`Insufficient keywords: ${data.seo.keywords.length} < ${QUALITY_GATES.seo.minKeywords}`);
  }
  
  console.log(`   ✅ SEO optimized with ${data.seo.keywords.length} keywords`);
  return data;
}

/**
 * Execute full 5-agent pipeline
 */
export async function executePipeline(question) {
  console.log(`\n🚀 Starting 5-Agent Pipeline for: ${question.question.substring(0, 60)}...\n`);
  
  try {
    // Stage 1: Research
    const researchData = await runResearchAgent(question);
    
    // Stage 2: Structure
    const structureData = await runStructureAgent(question, researchData);
    
    // Stage 3: Content
    let content = await runContentAgent(question, researchData, structureData);
    
    // Stage 4: Polish
    content = await runPolishAgent(content);
    
    // Stage 5: SEO
    const seoData = await runSEOAgent(content);
    
    // Merge SEO data into content frontmatter
    const finalContent = mergeSEOData(content, seoData);
    
    console.log('\n✅ Pipeline completed successfully!\n');
    
    return {
      content: finalContent,
      metadata: {
        sources: researchData.sources,
        realWorldCases: researchData.realWorldCases,
        seo: seoData.seo,
        structure: structureData
      }
    };
  } catch (error) {
    console.error(`\n❌ Pipeline failed: ${error.message}\n`);
    throw error;
  }
}

/**
 * Merge SEO data into content frontmatter
 */
function mergeSEOData(content, seoData) {
  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return content;
  
  const frontmatter = frontmatterMatch[1];
  const body = content.substring(frontmatterMatch[0].length);
  
  // Add SEO fields
  const enhancedFrontmatter = `${frontmatter}
excerpt: ${seoData.seo.description}
seo:
  keywords: ${JSON.stringify(seoData.seo.keywords)}
  description: ${seoData.seo.description}`;
  
  return `---\n${enhancedFrontmatter}\n---${body}`;
}
