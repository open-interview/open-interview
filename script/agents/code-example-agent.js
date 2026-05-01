/**
 * Code Example Generator Agent
 * Generates relevant code snippets for technical concepts
 */

import ai from '../ai/index.js';

const TECHNICAL_CHANNELS = ['aws', 'kubernetes', 'terraform', 'docker', 'devops', 'backend', 'frontend'];

function needsCodeExample(channel, content) {
  if (!TECHNICAL_CHANNELS.includes(channel)) return false;
  
  // Check if content mentions technical concepts that benefit from code
  const codeIndicators = [
    'api', 'configuration', 'deploy', 'implement', 'setup', 'install',
    'command', 'script', 'yaml', 'json', 'terraform', 'kubectl', 'docker'
  ];
  
  const contentLower = content.toLowerCase();
  return codeIndicators.some(indicator => contentLower.includes(indicator));
}

export async function generateCodeExamples(blogContent, channel) {
  if (!needsCodeExample(channel, JSON.stringify(blogContent))) {
    return { generated: false, examples: [] };
  }

  try {
    const examples = [];
    
    // Generate code example for main concept
    const mainConcept = blogContent.title || blogContent.introduction?.substring(0, 100);
    
    const prompt = `Generate a concise, practical code example for: ${mainConcept}

Requirements:
- Language: ${getLanguageForChannel(channel)}
- Include comments
- Show best practices
- Keep it under 20 lines
- Return ONLY valid JSON: {"language": "...", "code": "...", "description": "..."}`;

    const result = await ai.run('generate', { 
      prompt,
      context: { channel, concept: mainConcept }
    });

    if (result && result.code) {
      examples.push({
        language: result.language || getLanguageForChannel(channel),
        code: result.code,
        description: result.description || 'Example implementation',
        placement: 'after-section-1'
      });
    }

    return {
      generated: examples.length > 0,
      examples
    };
  } catch (error) {
    console.error('Code generation failed:', error.message);
    return { generated: false, examples: [], error: error.message };
  }
}

function getLanguageForChannel(channel) {
  const languageMap = {
    'aws': 'bash',
    'kubernetes': 'yaml',
    'terraform': 'hcl',
    'docker': 'dockerfile',
    'devops': 'bash',
    'backend': 'javascript',
    'frontend': 'javascript'
  };
  return languageMap[channel] || 'bash';
}

export default { generateCodeExamples };
