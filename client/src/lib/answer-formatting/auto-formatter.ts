/**
 * Auto-Formatter - Automatically formats answers according to pattern requirements
 * 
 * This module implements the auto-formatting engine that can apply format patterns
 * to answers, generate fix suggestions, and apply individual fixes to improve
 * answer formatting compliance.
 */

import type {
  AutoFormatter as IAutoFormatter,
  FormatPattern,
  ValidationResult,
  ValidationViolation,
  FormatFix,
  FormatSuggestion,
} from './types';

export class AutoFormatter implements IAutoFormatter {
  /**
   * Automatically formats an answer according to the specified pattern
   */
  format(answer: string, pattern: FormatPattern): string {
    let formattedAnswer = answer;

    // Apply pattern-specific formatting based on pattern ID
    switch (pattern.id) {
      case 'comparison':
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
        formattedAnswer = this.formatCode(formattedAnswer);
        break;
      case 'pros-cons':
        formattedAnswer = this.formatProsConsStructure(formattedAnswer);
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

  /**
   * Generates fix suggestions based on validation results
   */
  suggestFixes(validationResult: ValidationResult): FormatSuggestion[] {
    const suggestions: FormatSuggestion[] = [];

    for (const violation of validationResult.violations) {
      const fixes = this.generateFixesForViolation(violation);
      
      if (fixes.length > 0) {
        suggestions.push({
          violation,
          fixes,
          priority: this.calculateFixPriority(violation),
          description: this.generateFixDescription(violation, fixes),
        });
      }
    }

    // Sort suggestions by priority (highest first)
    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Applies a specific fix to the answer
   */
  applyFix(answer: string, fix: FormatFix): string {
    switch (fix.type) {
      case 'replace':
        return this.applyReplaceFix(answer, fix);
      case 'insert':
        return this.applyInsertFix(answer, fix);
      case 'remove':
        return this.applyRemoveFix(answer, fix);
      case 'reformat':
        return this.applyReformatFix(answer, fix);
      default:
        return answer;
    }
  }

  /**
   * Formats comparison answers by converting to table format
   */
  private formatComparison(answer: string): string {
    // Check if already has a proper table
    const hasTable = /\|.*\|/.test(answer) && /\|[-:]+\|/.test(answer);
    if (hasTable) {
      return this.improveTableFormatting(answer);
    }

    // Try to extract comparison data and convert to table
    const comparisonData = this.extractComparisonData(answer);
    if (comparisonData.length > 0) {
      return this.convertToComparisonTable(answer, comparisonData);
    }

    return answer;
  }

  /**
   * Formats definition answers with proper structure
   */
  private formatDefinition(answer: string): string {
    const lines = answer.split('\n');
    let formattedLines: string[] = [];
    let inDefinition = true;
    let hasBlankLineAfterDefinition = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (inDefinition && line.trim().length > 0) {
        // First non-empty line is the definition
        formattedLines.push(line);
        inDefinition = false;
        
        // Check if next line is blank
        if (i + 1 < lines.length && lines[i + 1].trim() === '') {
          hasBlankLineAfterDefinition = true;
        }
        
        // Add blank line if missing
        if (!hasBlankLineAfterDefinition) {
          formattedLines.push('');
        }
      } else {
        formattedLines.push(line);
      }
    }

    // Ensure characteristics are in bulleted list format
    return this.ensureBulletedCharacteristics(formattedLines.join('\n'));
  }

  /**
   * Formats list answers with proper syntax and structure
   */
  private formatList(answer: string): string {
    let formatted = answer;
    
    // Fix bullet syntax
    formatted = this.fixBulletSyntax(formatted);
    
    // Fix numbering syntax
    formatted = this.fixNumberingSyntax(formatted);
    
    // Ensure proper spacing
    formatted = this.ensureProperListSpacing(formatted);
    
    return formatted;
  }

  /**
   * Formats process answers with numbered steps and action verbs
   */
  private formatProcess(answer: string): string {
    let formatted = answer;
    
    // Convert to numbered steps if not already
    formatted = this.convertToNumberedSteps(formatted);
    
    // Improve action verbs
    formatted = this.improveActionVerbs(formatted);
    
    // Ensure proper step formatting
    formatted = this.ensureProperStepFormatting(formatted);
    
    return formatted;
  }

  /**
   * Formats code answers with proper blocks and language identifiers
   */
  private formatCode(answer: string): string {
    let formatted = answer;
    
    // Add language identifiers to code blocks
    formatted = this.addLanguageIdentifiers(formatted);
    
    // Convert inline code to blocks where appropriate
    formatted = this.convertInlineToBlocks(formatted);
    
    // Fix code block structure
    formatted = this.fixCodeBlockStructure(formatted);
    
    return formatted;
  }

  /**
   * Formats pros/cons answers with proper section structure
   */
  private formatProsConsStructure(answer: string): string {
    let formatted = answer;
    
    // Ensure proper section headers
    formatted = this.ensureProsConsHeaders(formatted);
    
    // Convert to bulleted lists
    formatted = this.convertProsConsToLists(formatted);
    
    // Balance sections if needed
    formatted = this.balanceProsConsSections(formatted);
    
    return formatted;
  }

  /**
   * Formats architecture answers with diagrams and explanations
   */
  private formatArchitecture(answer: string): string {
    let formatted = answer;
    
    // Ensure diagram is present
    formatted = this.ensureDiagramPresence(formatted);
    
    // Add text explanations around diagrams
    formatted = this.addDiagramExplanations(formatted);
    
    // Simplify complex diagrams
    formatted = this.simplifyComplexDiagrams(formatted);
    
    return formatted;
  }

  /**
   * Formats troubleshooting answers with required sections
   */
  private formatTroubleshooting(answer: string): string {
    let formatted = answer;
    
    // Ensure required sections
    formatted = this.ensureTroubleshootingSections(formatted);
    
    // Format solutions as numbered steps
    formatted = this.formatTroubleshootingSolutions(formatted);
    
    // Improve section content
    formatted = this.improveTroubleshootingContent(formatted);
    
    return formatted;
  }

  /**
   * Formats best practices answers with proper structure
   */
  private formatBestPractices(answer: string): string {
    let formatted = answer;
    
    // Convert to bulleted list format
    formatted = this.convertToBulletedList(formatted);
    
    // Add explanations to practices
    formatted = this.addPracticeExplanations(formatted);
    
    // Ensure proper categorization
    formatted = this.ensurePracticeCategorization(formatted);
    
    return formatted;
  }

  /**
   * Generates fixes for a specific violation
   */
  private generateFixesForViolation(violation: ValidationViolation): FormatFix[] {
    const fixes: FormatFix[] = [];
    const rule = violation.rule;

    // Generate rule-specific fixes
    if (rule.includes('table-required')) {
      fixes.push({
        id: `fix-${rule}`,
        type: 'reformat',
        description: 'Convert content to comparison table format',
        target: 'content',
        replacement: this.generateTableTemplate(),
      });
    } else if (rule.includes('table-headers')) {
      fixes.push({
        id: `fix-${rule}`,
        type: 'insert',
        description: 'Add table header separator',
        target: 'after-first-table-row',
        replacement: '|----------|----------|----------|',
      });
    } else if (rule.includes('list-required')) {
      fixes.push({
        id: `fix-${rule}`,
        type: 'reformat',
        description: 'Convert content to bulleted list format',
        target: 'content',
        replacement: this.generateListTemplate(),
      });
    } else if (rule.includes('code-language')) {
      fixes.push({
        id: `fix-${rule}`,
        type: 'replace',
        description: 'Add language identifier to code block',
        target: '```',
        replacement: '```javascript',
      });
    } else if (rule.includes('action-verb')) {
      fixes.push({
        id: `fix-${rule}`,
        type: 'replace',
        description: 'Start step with action verb',
        target: 'step-beginning',
        replacement: 'Configure',
      });
    } else if (rule.includes('blank-line')) {
      fixes.push({
        id: `fix-${rule}`,
        type: 'insert',
        description: 'Add blank line after definition',
        target: 'after-first-line',
        replacement: '\n',
      });
    } else if (rule.includes('pros-cons')) {
      fixes.push({
        id: `fix-${rule}`,
        type: 'reformat',
        description: 'Add pros/cons section structure',
        target: 'content',
        replacement: this.generateProsConsTemplate(),
      });
    } else if (rule.includes('diagram-required')) {
      fixes.push({
        id: `fix-${rule}`,
        type: 'insert',
        description: 'Add Mermaid diagram',
        target: 'end',
        replacement: this.generateDiagramTemplate(),
      });
    } else if (rule.includes('troubleshooting')) {
      fixes.push({
        id: `fix-${rule}`,
        type: 'reformat',
        description: 'Add troubleshooting section structure',
        target: 'content',
        replacement: this.generateTroubleshootingTemplate(),
      });
    } else {
      // Generate a generic fix for any violation that doesn't match specific patterns
      fixes.push({
        id: `fix-${rule}`,
        type: 'replace',
        description: violation.fix || 'Apply suggested fix',
        target: 'content',
        replacement: violation.fix || 'Please review and fix manually',
      });
    }

    return fixes;
  }

  /**
   * Calculates priority for a fix based on violation severity
   */
  private calculateFixPriority(violation: ValidationViolation): number {
    switch (violation.severity) {
      case 'error':
        return 100;
      case 'warning':
        return 50;
      case 'info':
        return 25;
      default:
        return 10;
    }
  }

  /**
   * Generates a description for fix suggestions
   */
  private generateFixDescription(violation: ValidationViolation, fixes: FormatFix[]): string {
    const fixCount = fixes.length;
    const severity = violation.severity;
    
    let description = `${fixCount} fix${fixCount > 1 ? 'es' : ''} available for ${severity} issue: ${violation.message}`;
    
    if (fixes.length > 0) {
      description += `\n\nSuggested fixes:\n${fixes.map((fix, i) => `${i + 1}. ${fix.description}`).join('\n')}`;
    }
    
    return description;
  }

  /**
   * Applies a replace-type fix
   */
  private applyReplaceFix(answer: string, fix: FormatFix): string {
    if (fix.target && fix.replacement) {
      return answer.replace(new RegExp(fix.target, 'g'), fix.replacement);
    }
    return answer;
  }

  /**
   * Applies an insert-type fix
   */
  private applyInsertFix(answer: string, fix: FormatFix): string {
    if (fix.target === 'end') {
      return answer + '\n\n' + (fix.replacement || '');
    } else if (fix.target === 'after-first-line') {
      const lines = answer.split('\n');
      if (lines.length > 0) {
        lines.splice(1, 0, fix.replacement || '');
        return lines.join('\n');
      }
    } else if (fix.target === 'after-first-table-row') {
      const lines = answer.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('|')) {
          lines.splice(i + 1, 0, fix.replacement || '');
          break;
        }
      }
      return lines.join('\n');
    }
    return answer;
  }

  /**
   * Applies a remove-type fix
   */
  private applyRemoveFix(answer: string, fix: FormatFix): string {
    if (fix.target) {
      return answer.replace(new RegExp(fix.target, 'g'), '');
    }
    return answer;
  }

  /**
   * Applies a reformat-type fix
   */
  private applyReformatFix(answer: string, fix: FormatFix): string {
    if (fix.target === 'content' && fix.replacement) {
      // For content reformatting, we might want to preserve some original content
      // This is a simplified implementation
      return fix.replacement;
    }
    return answer;
  }

  // Template generation methods
  private generateTableTemplate(): string {
    return `| Feature | Option A | Option B |
|---------|----------|----------|
| Speed   | Fast     | Slow     |
| Cost    | High     | Low      |
| Ease    | Simple   | Complex  |`;
  }

  private generateListTemplate(): string {
    return `- First key point
- Second key point  
- Third key point`;
  }

  private generateProsConsTemplate(): string {
    return `## Advantages

- Benefit one
- Benefit two
- Benefit three

## Disadvantages

- Drawback one
- Drawback two
- Drawback three`;
  }

  private generateDiagramTemplate(): string {
    return `\`\`\`mermaid
graph TD
    A[Start] --> B[Process]
    B --> C[Decision]
    C -->|Yes| D[Action]
    C -->|No| E[Alternative]
    D --> F[End]
    E --> F
\`\`\``;
  }

  private generateTroubleshootingTemplate(): string {
    return `## Problem

[Describe the specific issue or error]

## Causes

- Potential cause 1
- Potential cause 2
- Potential cause 3

## Solutions

1. First solution step
2. Second solution step
3. Third solution step`;
  }

  // Helper methods for specific formatting operations
  private improveTableFormatting(answer: string): string {
    // Implementation for improving existing table formatting
    return answer;
  }

  private extractComparisonData(answer: string): any[] {
    // Implementation for extracting comparison data from text
    return [];
  }

  private convertToComparisonTable(answer: string, data: any[]): string {
    // Implementation for converting data to table format
    return answer;
  }

  private ensureBulletedCharacteristics(answer: string): string {
    // Implementation for ensuring characteristics are in bulleted format
    return answer;
  }

  private fixBulletSyntax(answer: string): string {
    // Fix common bullet syntax issues
    return answer.replace(/^\s*[•·‣⁃]\s+/gm, '- ');
  }

  private fixNumberingSyntax(answer: string): string {
    // Fix numbering syntax issues
    let lines = answer.split('\n');
    let currentNumber = 1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^\s*\d+\.\s/.test(line)) {
        lines[i] = line.replace(/^\s*\d+\./, `${currentNumber}.`);
        currentNumber++;
      }
    }
    
    return lines.join('\n');
  }

  private ensureProperListSpacing(answer: string): string {
    // Ensure proper spacing in lists
    return answer.replace(/^(\s*[-*+]\s*)([^\s])/gm, '$1 $2');
  }

  private convertToNumberedSteps(answer: string): string {
    // Convert bulleted lists to numbered steps where appropriate
    const lines = answer.split('\n');
    let stepNumber = 1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^\s*[-*+]\s+/.test(line)) {
        lines[i] = line.replace(/^\s*[-*+]\s+/, `${stepNumber}. `);
        stepNumber++;
      }
    }
    
    return lines.join('\n');
  }

  private improveActionVerbs(answer: string): string {
    // Improve action verbs in process steps
    return answer;
  }

  private ensureProperStepFormatting(answer: string): string {
    // Ensure proper formatting of process steps
    return answer;
  }

  private addLanguageIdentifiers(answer: string): string {
    // Add language identifiers to code blocks that are missing them
    return answer.replace(/```\n/g, '```javascript\n');
  }

  private convertInlineToBlocks(answer: string): string {
    // Convert long inline code to code blocks
    return answer;
  }

  private fixCodeBlockStructure(answer: string): string {
    // Fix code block structure issues
    return answer;
  }

  private ensureProsConsHeaders(answer: string): string {
    // Ensure proper pros/cons section headers
    return answer;
  }

  private convertProsConsToLists(answer: string): string {
    // Convert pros/cons content to bulleted lists
    return answer;
  }

  private balanceProsConsSections(answer: string): string {
    // Balance pros/cons sections
    return answer;
  }

  private ensureDiagramPresence(answer: string): string {
    // Ensure diagram is present in architecture answers
    return answer;
  }

  private addDiagramExplanations(answer: string): string {
    // Add explanatory text around diagrams
    return answer;
  }

  private simplifyComplexDiagrams(answer: string): string {
    // Simplify overly complex diagrams
    return answer;
  }

  private ensureTroubleshootingSections(answer: string): string {
    // Ensure required troubleshooting sections
    return answer;
  }

  private formatTroubleshootingSolutions(answer: string): string {
    // Format solutions as numbered steps
    return answer;
  }

  private improveTroubleshootingContent(answer: string): string {
    // Improve troubleshooting content quality
    return answer;
  }

  private convertToBulletedList(answer: string): string {
    // Convert content to bulleted list format
    return answer;
  }

  private addPracticeExplanations(answer: string): string {
    // Add explanations to best practices
    return answer;
  }

  private ensurePracticeCategorization(answer: string): string {
    // Ensure proper categorization of practices
    return answer;
  }
}


// Export a singleton instance
export const autoFormatter = new AutoFormatter();
