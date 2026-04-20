/**
 * Robust Markdown Parser
 * Handles edge cases in markdown formatting, especially for technical content
 */

export function parseRobustMarkdown(text: string): string {
  if (!text) return '';
  
  let processed = text;
  
  // Step 1: Normalize line endings
  processed = processed.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Step 2: Fix Big-O notation
  processed = processed.replace(/([OΘΩ])\(([^)]+)\)/g, '`$1($2)`');
  
  // Step 3: Convert bullet characters to markdown
  processed = processed.replace(/•/g, '*');
  processed = processed.replace(/–/g, '-');
  processed = processed.replace(/—/g, '-');
  
  // Step 4: Handle bold text with colons followed by inline bullets
  // Pattern: "**Header**: * item1 * item2 * item3"
  // Convert to: "**Header**:\n\n* item1\n* item2\n* item3"
  processed = processed.replace(/\*\*([^*]+)\*\*:\s*\*\s+/g, (match, header) => {
    return `\n\n**${header}**:\n\n* `;
  });
  
  // Step 5: Split inline bullets into separate lines
  // Pattern: "* item1 * item2 * item3" on same line
  // This is tricky - we need to detect when asterisks are bullets vs bold markers
  const lines = processed.split('\n');
  const processedLines: string[] = [];
  
  for (let line of lines) {
    // Skip if line has bold markers (even number of **)
    const boldCount = (line.match(/\*\*/g) || []).length;
    if (boldCount > 0 && boldCount % 2 === 0) {
      // Line has complete bold markers, don't split bullets
      processedLines.push(line);
      continue;
    }
    
    // Check if line has multiple bullets (asterisks followed by space and capital letter)
    const bulletPattern = /\*\s+[A-Z]/g;
    const bulletMatches = line.match(bulletPattern);
    
    if (bulletMatches && bulletMatches.length > 1) {
      // Split into separate bullet points
      const parts = line.split(/\s*\*\s+/).filter(Boolean);
      for (const part of parts) {
        if (part.trim()) {
          processedLines.push(`* ${part.trim()}`);
        }
      }
    } else {
      processedLines.push(line);
    }
  }
  
  processed = processedLines.join('\n');
  
  // Step 6: Ensure proper spacing around headers
  processed = processed.replace(/([.!?])\s*\n\s*\*\*([^*]+)\*\*:/g, '$1\n\n**$2**:');
  
  // Step 7: Ensure bullets after colons have proper spacing
  processed = processed.replace(/:\s*\n\s*\*/g, ':\n\n*');
  
  // Step 8: Fix code blocks with bold
  processed = processed.replace(/\*\*\s*```/g, '**\n\n```');
  processed = processed.replace(/```\s*\*\*/g, '```\n\n**');
  
  // Step 9: Ensure proper spacing for nested lists
  processed = processed.replace(/\n\s*\*\*\s+([^*\n]+)/g, '\n  * $1');
  
  // Step 10: Clean up excessive whitespace
  processed = processed.replace(/\n{4,}/g, '\n\n\n');
  
  // Step 11: Ensure space after bullet markers
  processed = processed.replace(/\*([A-Za-z0-9])/g, '* $1');
  
  // Step 12: Fix bullets that start with bold text
  // Pattern: "* **Text**: description" should stay as is
  // Pattern: "* **Text** description" should stay as is
  
  // Step 13: Ensure paragraphs after bullets have spacing
  processed = processed.replace(/(\n\*[^\n]+)\n([A-Z][^*\n])/g, '$1\n\n$2');
  
  return processed;
}

/**
 * Alternative: Parse and structure the content
 * This creates a more structured representation
 */
export function structureMarkdownContent(text: string): {
  type: 'paragraph' | 'list' | 'heading' | 'code';
  content: string;
  items?: string[];
}[] {
  const parsed = parseRobustMarkdown(text);
  const lines = parsed.split('\n');
  const blocks: any[] = [];
  
  let currentBlock: any = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      continue;
    }
    
    // Check for list item
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      if (!currentBlock || currentBlock.type !== 'list') {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: 'list', items: [] };
      }
      currentBlock.items.push(trimmed.substring(2));
    }
    // Check for heading
    else if (trimmed.match(/^#+\s/)) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { type: 'heading', content: trimmed };
      blocks.push(currentBlock);
      currentBlock = null;
    }
    // Check for code block
    else if (trimmed.startsWith('```')) {
      if (currentBlock && currentBlock.type === 'code') {
        currentBlock.content += '\n' + line;
        blocks.push(currentBlock);
        currentBlock = null;
      } else {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: 'code', content: line };
      }
    }
    // Regular paragraph
    else {
      if (currentBlock && currentBlock.type === 'code') {
        currentBlock.content += '\n' + line;
      } else if (currentBlock && currentBlock.type === 'paragraph') {
        currentBlock.content += '\n' + line;
      } else {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: 'paragraph', content: line };
      }
    }
  }
  
  if (currentBlock) blocks.push(currentBlock);
  
  return blocks;
}
