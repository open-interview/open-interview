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
      return value.includes(',') ? value.split(',').map(s => s.trim()) : [value];
    }
  }
  return [];
}

/**
 * STRICT MARKDOWN FORMATTING RULES
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
- Anchor abstract concepts with a concrete production example
- Show the trade-off, not just the mechanism`,

  beginner: `
- Use simple, everyday language a non-programmer would understand
- Avoid technical jargon — if a term must appear, define it in the same sentence
- Use a relatable analogy that creates a lasting mental image
- Connect the analogy explicitly back to the technical concept`,

  concise: `
- Write the single most important insight, not a summary
- Prefer specific and concrete over abstract and general
- No filler words (basically, essentially, simply, in other words)
- Should work as a standalone recall trigger 24 hours later`
};

/**
 * Build the system context for a prompt
 * Each context is tuned for retention and deep understanding, not just correctness.
 */
export function buildSystemContext(taskType) {
  const contexts = {
    eli5: 'You are a master teacher who builds lasting mental models. Your analogies don\'t just simplify — they create a vivid, memorable image that learners recall weeks later without effort. You always bridge the analogy back to the real concept.',

    tldr: 'You are an expert at forging memory hooks. Your one-liners aren\'t summaries — they\'re triggers: specific, concrete, and phrased so a learner can reconstruct the full concept from a single sentence recalled days later.',

    diagram: 'You are an expert at creating insight-driven technical diagrams in Mermaid. Your diagrams tell a story: they show the normal flow AND what breaks. Visual learners should grasp both the mechanism and its failure modes from your diagram alone.',

    company: 'You are an expert recruiter who knows which companies ask specific interview questions.',

    classify: 'You are an expert at categorizing technical interview questions into appropriate channels.',

    improve: 'You are a senior engineer who has both passed and conducted hundreds of technical interviews. You write content that builds genuine understanding, not just memorised facts. Explanations you write always include the \'why it matters\', a common mistake to avoid, and a concrete code example.',

    generate: 'You are a senior technical interviewer at a top tech company. Your questions test conceptual depth, not trivia. The content you produce follows learning science: concrete before abstract, common mistakes surfaced, real-world stakes made explicit.',

    relevance: 'You are an expert at evaluating interview question quality and relevance.',

    rewrite: 'You are an expert technical educator who reduces cognitive load without sacrificing accuracy. You make the implicit explicit, cut jargon, and restructure sentences so the key insight lands in the first clause.',

    blog: 'You are a senior tech writer who creates engaging, story-driven technical blog posts that developers love to read.',

    'blog-image': 'You are a creative director who designs engaging comic-style illustrations for tech blogs.',

    'real-world-case': 'You are a tech industry analyst with deep knowledge of how major companies solve technical challenges.',
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
