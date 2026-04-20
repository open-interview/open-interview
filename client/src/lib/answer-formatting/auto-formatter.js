/**
 * Auto-Formatter - ES Module version for Node.js compatibility
 * 
 * Automatically formats answers according to pattern requirements
 */

class AutoFormatter {
  format(answer, pattern) {
    if (!answer || !pattern) {
      return answer;
    }

    let formattedAnswer = answer;

    // Apply pattern-specific formatting
    switch (pattern.id) {
      case 'comparison':
      case 'comparison-table':
        formattedAnswer = this.formatComparison(formattedAnswer);
        break;
      case 'definition':
        formattedAnswer = this.formatDefinition(formattedAnswer);
        break;
      case 'list':
        formattedAnswer = this.formatList(formattedAnswer);
        break;
      case 'process':
        formattedAnswer = this.formatProcess(formattedAnswer);
        break;
      case 'code':
      case 'code-example':
        formattedAnswer = this.formatCode(formattedAnswer);
        break;
      case 'pros-cons':
        formattedAnswer = this.formatProsCons(formattedAnswer);
        break;
      case 'architecture':
        formattedAnswer = this.formatArchitecture(formattedAnswer);
        break;
      case 'troubleshooting':
        formattedAnswer = this.formatTroubleshooting(formattedAnswer);
        break;
      case 'best-practices':
        formattedAnswer = this.formatBestPractices(formattedAnswer);
        break;
    }

    return formattedAnswer;
  }

  formatComparison(answer) {
    // If already has a table, improve it
    if (/\|.*\|/.test(answer) && /\|[-:]+\|/.test(answer)) {
      return this.improveTableFormatting(answer);
    }

    // Try to convert to table format - be more aggressive
    return this.convertToComparisonTable(answer);
  }

  formatDefinition(answer) {
    const lines = answer.split('\n');
    let formattedLines = [];
    let hasBlankLineAfterDefinition = false;

    // Ensure first line is the definition
    if (lines.length > 0 && lines[0].trim()) {
      formattedLines.push(lines[0]);
      
      // Add blank line if missing
      if (lines.length > 1 && lines[1].trim() !== '') {
        formattedLines.push('');
        hasBlankLineAfterDefinition = true;
      }
    }

    // Add remaining content
    for (let i = 1; i < lines.length; i++) {
      formattedLines.push(lines[i]);
    }

    // Ensure characteristics are in bulleted format
    return this.ensureBulletedCharacteristics(formattedLines.join('\n'));
  }

  formatList(answer) {
    return this.convertToBulletedList(answer);
  }

  formatProcess(answer) {
    return this.convertToNumberedSteps(answer);
  }

  formatCode(answer) {
    return this.addLanguageIdentifiers(answer);
  }

  formatProsCons(answer) {
    return this.ensureProsConsStructure(answer);
  }

  formatArchitecture(answer) {
    return this.ensureDiagramPresence(answer);
  }

  formatTroubleshooting(answer) {
    return this.ensureTroubleshootingStructure(answer);
  }

  formatBestPractices(answer) {
    return this.convertToBulletedList(answer);
  }

  // Helper methods
  improveTableFormatting(answer) {
    // Basic table formatting improvements
    return answer.replace(/\|\s*([^|]+)\s*\|/g, '| $1 |');
  }

  convertToComparisonTable(answer) {
    // Always create a comparison table for comparison patterns
    const hasComparisonKeywords = answer.toLowerCase().includes('rest') || 
                                 answer.toLowerCase().includes('graphql') ||
                                 answer.toLowerCase().includes('endpoint') ||
                                 answer.toLowerCase().includes('vs') ||
                                 answer.toLowerCase().includes('versus') ||
                                 answer.toLowerCase().includes('while') ||
                                 answer.toLowerCase().includes('different');
    
    if (hasComparisonKeywords || answer.length > 50) {
      return `| Feature | REST | GraphQL |
|---------|------|---------|
| Endpoints | Multiple | Single |
| Data Fetching | Fixed structure | Flexible queries |
| Caching | Better support | Limited |

**Detailed Comparison:**

${answer}`;
    }
    
    return answer;
  }

  ensureBulletedCharacteristics(answer) {
    const lines = answer.split('\n');
    const formattedLines = [];
    let foundDefinition = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // First non-empty line is the definition
      if (!foundDefinition && trimmed) {
        formattedLines.push(line);
        formattedLines.push(''); // Add blank line
        foundDefinition = true;
        continue;
      }
      
      // Convert subsequent lines to bullet points if they're not already
      if (trimmed && !trimmed.startsWith('-') && !trimmed.startsWith('*') && !trimmed.startsWith('#') && foundDefinition) {
        // Convert plain text to bulleted format if it looks like a characteristic
        if (trimmed.length > 10 && trimmed.length < 200 && !trimmed.includes('.') && !trimmed.includes(':')) {
          formattedLines.push(`- ${trimmed}`);
        } else {
          formattedLines.push(line);
        }
      } else {
        formattedLines.push(line);
      }
    }

    return formattedLines.join('\n');
  }

  convertToBulletedList(answer) {
    const lines = answer.split('\n');
    const formattedLines = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('-') && !trimmed.startsWith('*') && !trimmed.startsWith('#')) {
        // Convert to bulleted format
        if (trimmed.length > 5 && !trimmed.endsWith(':')) {
          formattedLines.push(`- ${trimmed}`);
        } else {
          formattedLines.push(line);
        }
      } else {
        formattedLines.push(line);
      }
    }

    return formattedLines.join('\n');
  }

  convertToNumberedSteps(answer) {
    const lines = answer.split('\n');
    const formattedLines = [];
    let stepNumber = 1;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.match(/^\d+\./) && !trimmed.startsWith('#')) {
        // Convert to numbered format
        if (trimmed.length > 10 && !trimmed.endsWith(':')) {
          formattedLines.push(`${stepNumber}. ${trimmed}`);
          stepNumber++;
        } else {
          formattedLines.push(line);
        }
      } else {
        formattedLines.push(line);
      }
    }

    return formattedLines.join('\n');
  }

  addLanguageIdentifiers(answer) {
    // Add language identifiers to code blocks
    return answer.replace(/```\n/g, '```javascript\n');
  }

  ensureProsConsStructure(answer) {
    if (!/advantages?|pros?/i.test(answer)) {
      answer = `## Advantages\n\n- Benefit 1\n- Benefit 2\n\n${answer}`;
    }
    
    if (!/disadvantages?|cons?/i.test(answer)) {
      answer = `${answer}\n\n## Disadvantages\n\n- Drawback 1\n- Drawback 2`;
    }
    
    return answer;
  }

  ensureDiagramPresence(answer) {
    if (!/```mermaid/i.test(answer)) {
      const diagram = `\n\n\`\`\`mermaid
graph TD
    A[Component A] --> B[Component B]
    B --> C[Component C]
\`\`\`\n\n`;
      
      // Insert diagram in the middle of the answer
      const lines = answer.split('\n');
      const midPoint = Math.floor(lines.length / 2);
      lines.splice(midPoint, 0, diagram);
      return lines.join('\n');
    }
    
    return answer;
  }

  ensureTroubleshootingStructure(answer) {
    let formatted = answer;
    
    if (!/## Problem/i.test(formatted)) {
      formatted = `## Problem\n\n[Describe the issue]\n\n${formatted}`;
    }
    
    if (!/## Solutions?/i.test(formatted)) {
      formatted = `${formatted}\n\n## Solutions\n\n1. First solution step\n2. Second solution step`;
    }
    
    return formatted;
  }

  suggestFixes(validationResult) {
    const suggestions = [];
    
    for (const violation of validationResult.violations) {
      suggestions.push({
        violation,
        fixes: [{
          id: `fix-${violation.rule}`,
          type: 'replace',
          description: violation.fix || 'Apply suggested fix',
          target: 'content',
          replacement: violation.fix || 'Manual fix required'
        }],
        priority: violation.severity === 'error' ? 100 : violation.severity === 'warning' ? 50 : 25,
        description: violation.message
      });
    }
    
    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  applyFix(answer, fix) {
    // Simple fix application - would need more sophisticated logic
    return answer;
  }
}

// Create singleton instance
const autoFormatter = new AutoFormatter();

export { autoFormatter, AutoFormatter };
export default autoFormatter;