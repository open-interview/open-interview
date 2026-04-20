/**
 * Base prompt template components
 * Shared across all prompts for consistency
 */

export const jsonOutputRule = `IMPORTANT: Return ONLY the JSON object. No other text, no markdown, no explanations.`;

/**
 * Parse a value that might be a JSON string or already an array
 * Handles database values that are stored as JSON strings
 */
export function parseArrayField(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // If not valid JSON, try splitting by comma
      return value.includes(',') ? value.split(',').map(s => s.trim()) : [value];
    }
  }
  return [];
}

/**
 * STRICT MARKDOWN FORMATTING RULES
 * These rules MUST be followed for all generated content to ensure proper rendering.
 */
export const markdownFormattingRules = `
STRICT MARKDOWN FORMATTING RULES (MUST FOLLOW):

1. BOLD TEXT:
   - Use **text** with NO spaces inside: **correct** not ** incorrect **
   - Bold markers must be on the SAME LINE as the text: **Title** not **\\nTitle**
   - Never put ** on its own line
   - Never use ** immediately before or after code blocks

2. LISTS:
   - Each list item MUST be on its own line
   - Use "- " for bullets (dash + space)
   - Use "1. " for numbered lists (number + dot + space)
   - Add blank line before and after lists
   - Never combine multiple list items on one line

3. CODE BLOCKS:
   - Code fences (\`\`\`) MUST be on their own line
   - Never put ** markers inside code blocks
   - Always specify language: \`\`\`javascript not \`\`\`
   - Add blank line before and after code blocks

4. HEADINGS:
   - Use ## for main sections, ### for subsections
   - Add blank line after headings
   - Never use ** for headings, use # syntax

5. STRUCTURE:
   - Separate sections with blank lines
   - No trailing spaces at end of lines
   - Use proper paragraph breaks (blank line between paragraphs)

BAD EXAMPLES (DO NOT DO):
- "**\\n2. Title**" (bold split across lines)
- "**Item1**- **Item2**" (no newline between items)
- "text**\`\`\`code" (bold touching code fence)
- "- item1- item2" (multiple items on one line)

GOOD EXAMPLES:
- "**Title**" (bold on same line)
- "**Item1**\\n- **Item2**" (proper line breaks)
- "text\\n\\n\`\`\`javascript\\ncode\\n\`\`\`" (proper code block)
- "- item1\\n- item2" (each item on own line)
`;

export const qualityRules = {
  technical: `
- Be technically accurate and precise
- Use industry-standard terminology
- Include specific examples where helpful`,
  
  beginner: `
- Use simple, everyday language
- Avoid technical jargon
- Use relatable analogies`,
  
  concise: `
- Be direct and to the point
- No filler words or phrases
- Focus on the key insight`
};

/**
 * Build the system context for a prompt
 */
export function buildSystemContext(taskType) {
  const contexts = {
    eli5: 'You are an expert at explaining complex technical concepts in simple terms that anyone can understand.',
    tldr: 'You are an expert at distilling complex information into concise, actionable one-liners.',
    diagram: 'You are an expert at creating clear, meaningful technical diagrams using Mermaid syntax.',
    company: 'You are an expert recruiter who knows which companies ask specific interview questions.',
    classify: 'You are an expert at categorizing technical interview questions into appropriate channels.',
    improve: 'You are a senior technical interviewer who creates high-quality interview content.',
    generate: 'You are a senior technical interviewer at a top tech company creating realistic interview questions.',
    relevance: 'You are an expert at evaluating interview question quality and relevance.',
    blog: 'You are a senior tech writer who creates engaging, story-driven technical blog posts that developers love to read.',
    'blog-image': 'You are a creative director who designs engaging comic-style illustrations for tech blogs. You understand developer culture, technical concepts, and how to visualize abstract ideas in memorable ways.',
    'real-world-case': 'You are a tech industry analyst with deep knowledge of how major companies solve technical challenges. You know the famous incidents, scaling stories, and engineering decisions at companies like Netflix, Uber, Stripe, and others.'
  };
  
  return contexts[taskType] || 'You are a helpful AI assistant.';
}

/**
 * Build JSON output format instruction
 */
export function buildOutputFormat(schema) {
  return `Output this exact JSON structure:\n${JSON.stringify(schema, null, 2)}`;
}

/**
 * Build examples section for few-shot prompting
 */
export function buildExamplesSection(examples) {
  if (!examples || examples.length === 0) return '';
  
  let section = '\n\nEXAMPLES:\n';
  examples.forEach((ex, i) => {
    section += `\nExample ${i + 1}:\nInput: ${JSON.stringify(ex.input)}\nOutput: ${JSON.stringify(ex.output)}\n`;
  });
  return section;
}
