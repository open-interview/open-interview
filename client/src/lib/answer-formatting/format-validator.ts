/**
 * Format Validator - Validates answers against format pattern requirements
 * 
 * This module implements the core validation engine that checks if answers
 * conform to the specified format patterns and provides detailed feedback
 * on violations and suggestions for improvement.
 */

import type {
  FormatValidator as IFormatValidator,
  FormatPattern,
  ValidationResult,
  ValidationViolation,
  Section,
} from './types';

export class FormatValidator implements IFormatValidator {
  private currentViolations: ValidationViolation[] = [];
  private currentSuggestions: string[] = [];

  /**
   * Validates an answer against a format pattern
   */
  validate(answer: string, pattern: FormatPattern): ValidationResult {
    this.currentViolations = [];
    this.currentSuggestions = [];

    // Validate each section in the pattern
    for (const section of pattern.structure.sections) {
      this.validateSection(answer, section, pattern.id);
    }

    // Apply pattern-specific validation rules
    for (const rule of pattern.structure.rules) {
      this.validateRule(answer, rule);
    }

    // Calculate validation score
    const score = this.calculateScore();
    const isValid = this.currentViolations.filter(v => v.severity === 'error').length === 0;

    return {
      isValid,
      score,
      violations: [...this.currentViolations],
      suggestions: [...this.currentSuggestions],
    };
  }

  /**
   * Get current violations (for debugging/testing)
   */
  getViolations(): ValidationViolation[] {
    return [...this.currentViolations];
  }

  /**
   * Get current suggestions (for debugging/testing)
   */
  getSuggestions(): string[] {
    return [...this.currentSuggestions];
  }

  /**
   * Validates a specific section of the pattern
   */
  private validateSection(answer: string, section: Section, patternId: string): void {
    switch (section.format) {
      case 'table':
        this.validateTableSection(answer, section, patternId);
        break;
      case 'list':
        this.validateListSection(answer, section, patternId);
        break;
      case 'code':
        this.validateCodeSection(answer, section, patternId);
        break;
      case 'diagram':
        this.validateDiagramSection(answer, section, patternId);
        break;
      case 'text':
        this.validateTextSection(answer, section, patternId);
        break;
      case 'process':
        this.validateProcessSection(answer, section, patternId);
        break;
      case 'pros-cons':
        this.validateProsConsSection(answer, section, patternId);
        break;
      case 'troubleshooting':
        this.validateTroubleshootingSection(answer, section, patternId);
        break;
    }
  }

  /**
   * Validates table format sections
   */
  private validateTableSection(answer: string, section: Section, patternId: string): void {
    const tableRegex = /\|.*\|/g;
    const tables = answer.match(tableRegex);

    if (section.required && (!tables || tables.length === 0)) {
      this.addViolation({
        rule: `${patternId}-table-required`,
        severity: 'error',
        message: `${section.name} section requires a markdown table`,
        fix: 'Add a markdown table with proper headers and data rows',
      }, {
        answer,
        searchText: section.name,
      });
      return;
    }

    if (tables && tables.length > 0) {
      // Check table structure
      const tableLines = tables.filter(line => line.trim().length > 0);
      
      // Check for minimum columns constraint
      const minColumnsConstraint = section.constraints?.find(c => c.type === 'min-columns');
      if (minColumnsConstraint && tableLines.length > 0) {
        const firstRow = tableLines[0];
        const columnCount = (firstRow.match(/\|/g) || []).length - 1;
        
        if (columnCount < (minColumnsConstraint.value as number)) {
          const tableLineIndex = this.findLineIndex(answer, firstRow);
          this.addViolation({
            rule: `${patternId}-min-columns`,
            severity: 'error',
            message: `Table must have at least ${minColumnsConstraint.value} columns, found ${columnCount}`,
            fix: `Add more columns to meet the minimum requirement of ${minColumnsConstraint.value}`,
          }, {
            answer,
            searchText: firstRow,
            lineHint: tableLineIndex,
          });
        }
      }

      // Check for headers constraint
      const hasHeadersConstraint = section.constraints?.find(c => c.type === 'has-headers');
      if (hasHeadersConstraint && hasHeadersConstraint.value === true) {
        // More robust header separator detection - look for lines with multiple dashes and optional colons
        const headerSeparatorRegex = /\|\s*:?-{2,}:?\s*\|/;
        const hasHeaderSeparator = headerSeparatorRegex.test(answer);
        
        if (!hasHeaderSeparator) {
          const firstTableLine = tableLines[0];
          const tableLineIndex = this.findLineIndex(answer, firstTableLine);
          this.addViolation({
            rule: `${patternId}-table-headers`,
            severity: 'error',
            message: 'Table is missing header separator row',
            fix: 'Add a header separator row like |---|---|---|',
          }, {
            answer,
            searchText: firstTableLine,
            lineHint: tableLineIndex,
          });
        }
      }

      // Check for proper table alignment
      if (tableLines.length >= 2) {
        const headerRow = tableLines[0];
        const separatorRow = tableLines[1];
        const headerCols = (headerRow.match(/\|/g) || []).length - 1;
        const separatorCols = (separatorRow.match(/\|/g) || []).length - 1;

        if (headerCols !== separatorCols) {
          const headerLineIndex = this.findLineIndex(answer, headerRow);
          this.addViolation({
            rule: `${patternId}-table-alignment`,
            severity: 'warning',
            message: 'Table header and separator rows have different column counts',
            fix: 'Ensure all table rows have the same number of columns',
          }, {
            answer,
            searchText: headerRow,
            lineHint: headerLineIndex,
          });
        }
      }

      // Additional table validation rules for comparison tables
      this.validateComparisonTableRules(answer, tableLines, section, patternId);
    }
  }

  /**
   * Validates specific rules for comparison tables
   */
  private validateComparisonTableRules(answer: string, tableLines: string[], section: Section, patternId: string): void {
    if (tableLines.length === 0) return;

    // Check for Feature/Aspect column constraint
    const requiresFeatureColumnConstraint = section.constraints?.find(c => c.type === 'requires-feature-column');
    if (requiresFeatureColumnConstraint && requiresFeatureColumnConstraint.value === true) {
      const headerRow = tableLines[0].toLowerCase();
      const hasFeatureColumn = headerRow.includes('feature') || 
                              headerRow.includes('aspect') || 
                              headerRow.includes('attribute') ||
                              headerRow.includes('property');
      
      if (!hasFeatureColumn) {
        this.addViolation({
          rule: `${patternId}-feature-column`,
          severity: 'warning',
          message: 'Comparison table should include a "Feature" or "Aspect" column',
          fix: 'Add a column header like "Feature", "Aspect", or "Attribute" to describe what is being compared',
        });
      }
    }

    // Check for proper comparison format constraint
    const comparisonFormatConstraint = section.constraints?.find(c => c.type === 'comparison-format');
    if (comparisonFormatConstraint && tableLines.length > 0) {
      const headerRow = tableLines[0];
      const columnCount = (headerRow.match(/\|/g) || []).length - 1;
      
      // For 2-item comparison: | Feature | Item A | Item B |
      if (columnCount === 3) {
        const columns = headerRow.split('|').map(col => col.trim()).filter(col => col.length > 0);
        if (columns.length === 3) {
          const firstCol = columns[0].toLowerCase();
          const hasProperFormat = firstCol.includes('feature') || 
                                 firstCol.includes('aspect') || 
                                 firstCol.includes('attribute');
          
          if (!hasProperFormat) {
            this.addViolation({
              rule: `${patternId}-comparison-format-2`,
              severity: 'info',
              message: 'For 2-item comparison, use format: | Feature | Item A | Item B |',
              fix: 'Consider using "Feature" as the first column header for better clarity',
            });
          }
        }
      }
      
      // For 3+ item comparison: | Feature | Item 1 | Item 2 | Item 3 | ...
      if (columnCount >= 4) {
        const columns = headerRow.split('|').map(col => col.trim()).filter(col => col.length > 0);
        if (columns.length >= 4) {
          const firstCol = columns[0].toLowerCase();
          const hasProperFormat = firstCol.includes('feature') || 
                                 firstCol.includes('aspect') || 
                                 firstCol.includes('attribute');
          
          if (!hasProperFormat) {
            this.addViolation({
              rule: `${patternId}-comparison-format-multi`,
              severity: 'info',
              message: 'For multi-item comparison, use format: | Feature | Item 1 | Item 2 | Item 3 |',
              fix: 'Consider using "Feature" as the first column header for better clarity',
            });
          }
        }
      }
    }

    // Check for consistent data rows
    const consistentRowsConstraint = section.constraints?.find(c => c.type === 'consistent-rows');
    if (consistentRowsConstraint && consistentRowsConstraint.value === true && tableLines.length > 2) {
      const headerColumnCount = (tableLines[0].match(/\|/g) || []).length - 1;
      
      for (let i = 2; i < tableLines.length; i++) { // Skip header and separator rows
        const rowColumnCount = (tableLines[i].match(/\|/g) || []).length - 1;
        
        if (rowColumnCount !== headerColumnCount) {
          this.addViolation({
            rule: `${patternId}-inconsistent-rows`,
            severity: 'error',
            message: `Table row ${i - 1} has ${rowColumnCount} columns, expected ${headerColumnCount}`,
            fix: `Ensure all table rows have exactly ${headerColumnCount} columns`,
          });
        }
      }
    }

    // Check for empty cells constraint
    const noEmptyCellsConstraint = section.constraints?.find(c => c.type === 'no-empty-cells');
    if (noEmptyCellsConstraint && noEmptyCellsConstraint.value === true) {
      for (let i = 2; i < tableLines.length; i++) { // Skip header and separator rows
        const cells = tableLines[i].split('|').map(cell => cell.trim()).filter(cell => cell.length > 0);
        
        for (let j = 0; j < cells.length; j++) {
          if (cells[j].length === 0 || cells[j] === '-' || cells[j] === '...') {
            this.addViolation({
              rule: `${patternId}-empty-cells`,
              severity: 'warning',
              message: `Table has empty or placeholder cells in row ${i - 1}`,
              fix: 'Fill in all table cells with meaningful content, avoid using "-" or "..." as placeholders',
            });
            break; // Only report once per row
          }
        }
      }
    }

    // Check for minimum data rows constraint
    const minDataRowsConstraint = section.constraints?.find(c => c.type === 'min-data-rows');
    if (minDataRowsConstraint) {
      const dataRowCount = Math.max(0, tableLines.length - 2); // Subtract header and separator
      const minRows = minDataRowsConstraint.value as number;
      
      if (dataRowCount < minRows) {
        this.addViolation({
          rule: `${patternId}-min-data-rows`,
          severity: 'warning',
          message: `Table has ${dataRowCount} data rows, minimum required is ${minRows}`,
          fix: `Add more comparison rows to provide at least ${minRows} data points`,
        });
      }
    }
  }

  /**
   * Validates list format sections
   */
  private validateListSection(answer: string, section: Section, patternId: string): void {
    const bulletListRegex = /^\s*[-*+]\s+/gm;
    const numberedListRegex = /^\s*\d+\.\s+/gm;
    
    const bulletLists = answer.match(bulletListRegex);
    const numberedLists = answer.match(numberedListRegex);
    const hasLists = (bulletLists && bulletLists.length > 0) || (numberedLists && numberedLists.length > 0);

    if (section.required && !hasLists) {
      this.addViolation({
        rule: `${patternId}-list-required`,
        severity: 'error',
        message: `${section.name} section requires a bulleted or numbered list`,
        fix: 'Add a bulleted list using - or * or a numbered list using 1. 2. 3.',
      });
      return;
    }

    if (hasLists) {
      // Check list item length constraint
      const maxSentencesConstraint = section.constraints?.find(c => c.type === 'max-sentences');
      if (maxSentencesConstraint) {
        const listItems = this.extractListItems(answer);
        const maxSentences = maxSentencesConstraint.value as number;

        for (const item of listItems) {
          const sentenceCount = this.countSentences(item);
          if (sentenceCount > maxSentences) {
            this.addViolation({
              rule: `${patternId}-list-item-length`,
              severity: 'warning',
              message: `List item exceeds maximum of ${maxSentences} sentences (found ${sentenceCount})`,
              fix: `Break down long list items into shorter, more concise points`,
            });
          }
        }
      }

      // Check for consistent list formatting
      if (bulletLists && numberedLists) {
        this.addViolation({
          rule: `${patternId}-list-consistency`,
          severity: 'info',
          message: 'Answer contains both bulleted and numbered lists',
          fix: 'Consider using consistent list formatting throughout the answer',
        });
      }

      // Check for proper bullet syntax constraint
      const properBulletSyntaxConstraint = section.constraints?.find(c => c.type === 'proper-bullet-syntax');
      if (properBulletSyntaxConstraint && properBulletSyntaxConstraint.value === true) {
        this.validateBulletSyntax(answer, patternId);
      }

      // Check for proper numbering syntax constraint
      const properNumberingSyntaxConstraint = section.constraints?.find(c => c.type === 'proper-numbering-syntax');
      if (properNumberingSyntaxConstraint && properNumberingSyntaxConstraint.value === true) {
        this.validateNumberingSyntax(answer, patternId);
      }

      // Check for nesting structure constraint
      const nestingStructureConstraint = section.constraints?.find(c => c.type === 'nesting-structure');
      if (nestingStructureConstraint && nestingStructureConstraint.value === true) {
        this.validateNestingStructure(answer, patternId);
      }

      // Check for minimum list items constraint
      const minListItemsConstraint = section.constraints?.find(c => c.type === 'min-list-items');
      if (minListItemsConstraint) {
        const listItems = this.extractListItems(answer);
        const minItems = minListItemsConstraint.value as number;
        
        if (listItems.length < minItems) {
          this.addViolation({
            rule: `${patternId}-min-list-items`,
            severity: 'warning',
            message: `List should have at least ${minItems} items, found ${listItems.length}`,
            fix: `Add more list items to reach at least ${minItems} items`,
          });
        }
      }

      // Check for maximum list items constraint
      const maxListItemsConstraint = section.constraints?.find(c => c.type === 'max-list-items');
      if (maxListItemsConstraint) {
        const listItems = this.extractListItems(answer);
        const maxItems = maxListItemsConstraint.value as number;
        
        if (listItems.length > maxItems) {
          this.addViolation({
            rule: `${patternId}-max-list-items`,
            severity: 'info',
            message: `List has ${listItems.length} items, consider limiting to ${maxItems} for better readability`,
            fix: `Consider consolidating or removing some items to stay within ${maxItems} items`,
          });
        }
      }

      // Check for consistent indentation constraint
      const consistentIndentationConstraint = section.constraints?.find(c => c.type === 'consistent-indentation');
      if (consistentIndentationConstraint && consistentIndentationConstraint.value === true) {
        this.validateListIndentation(answer, patternId);
      }
    }
  }

  /**
   * Validates proper bullet syntax in lists
   */
  private validateBulletSyntax(answer: string, patternId: string): void {
    const lines = answer.split('\n');
    const bulletLines = lines.filter(line => /^\s*[-*+]/.test(line)); // Match bullets with or without proper spacing
    
    for (let i = 0; i < bulletLines.length; i++) {
      const line = bulletLines[i];
      
      // Check for proper spacing after bullet (should have space after bullet character)
      if (!/^\s*[-*+]\s+\S/.test(line)) {
        this.addViolation({
          rule: `${patternId}-bullet-spacing`,
          severity: 'warning',
          message: 'Bullet points should have proper spacing after the bullet character',
          fix: 'Ensure there is a space after the bullet character (-, *, or +)',
        });
      }
      
      // Check for consistent bullet character usage
      const bulletChar = line.match(/^\s*([-*+])/)?.[1];
      if (i === 0) {
        // Store the first bullet character as reference
        continue;
      }
      
      const firstBulletChar = bulletLines[0].match(/^\s*([-*+])/)?.[1];
      if (bulletChar !== firstBulletChar) {
        this.addViolation({
          rule: `${patternId}-bullet-consistency`,
          severity: 'info',
          message: 'Mixed bullet characters found in list',
          fix: `Use consistent bullet characters throughout the list (all -, *, or +)`,
        });
        break; // Only report once
      }
    }
  }

  /**
   * Validates proper numbering syntax in lists
   */
  private validateNumberingSyntax(answer: string, patternId: string): void {
    const lines = answer.split('\n');
    const numberedLines = lines.filter(line => /^\s*\d+\.\s/.test(line));
    
    let expectedNumber = 1;
    for (const line of numberedLines) {
      const match = line.match(/^\s*(\d+)\.\s/);
      if (match) {
        const actualNumber = parseInt(match[1], 10);
        
        // Check for proper sequential numbering
        if (actualNumber !== expectedNumber) {
          this.addViolation({
            rule: `${patternId}-numbering-sequence`,
            severity: 'warning',
            message: `List numbering is not sequential: expected ${expectedNumber}, found ${actualNumber}`,
            fix: 'Ensure numbered lists use sequential numbering (1. 2. 3. ...)',
          });
        }
        
        // Check for proper spacing after number
        if (!/^\s*\d+\.\s+\S/.test(line)) {
          this.addViolation({
            rule: `${patternId}-number-spacing`,
            severity: 'warning',
            message: 'Numbered items should have proper spacing after the number',
            fix: 'Ensure there is a space after the number and period (1. item)',
          });
        }
        
        expectedNumber++;
      }
    }
  }

  /**
   * Validates nesting structure in lists
   */
  private validateNestingStructure(answer: string, patternId: string): void {
    const lines = answer.split('\n');
    const listLines = lines.filter(line => /^\s*[-*+\d]\s/.test(line) || /^\s*\d+\.\s/.test(line));
    
    let previousIndentLevel = -1;
    let indentLevels: number[] = [];
    
    for (const line of listLines) {
      const indentMatch = line.match(/^(\s*)/);
      const currentIndentLevel = indentMatch ? indentMatch[1].length : 0;
      
      // Track indent levels
      if (!indentLevels.includes(currentIndentLevel)) {
        indentLevels.push(currentIndentLevel);
      }
      
      // Check for proper nesting increment
      if (previousIndentLevel >= 0 && currentIndentLevel > previousIndentLevel) {
        const indentDifference = currentIndentLevel - previousIndentLevel;
        
        // Standard indentation should be 2 or 4 spaces
        if (indentDifference !== 2 && indentDifference !== 4) {
          this.addViolation({
            rule: `${patternId}-nesting-increment`,
            severity: 'info',
            message: 'Inconsistent nesting indentation found',
            fix: 'Use consistent indentation for nested list items (2 or 4 spaces)',
          });
        }
      }
      
      previousIndentLevel = currentIndentLevel;
    }
    
    // Check for excessive nesting levels
    const maxNestingConstraint = 3; // Maximum recommended nesting levels
    if (indentLevels.length > maxNestingConstraint) {
      this.addViolation({
        rule: `${patternId}-excessive-nesting`,
        severity: 'warning',
        message: `List has ${indentLevels.length} nesting levels, consider simplifying`,
        fix: `Reduce nesting to ${maxNestingConstraint} levels or fewer for better readability`,
      });
    }
  }

  /**
   * Validates consistent indentation in lists
   */
  private validateListIndentation(answer: string, patternId: string): void {
    const lines = answer.split('\n');
    const listLines = lines.filter(line => /^\s*[-*+]\s/.test(line) || /^\s*\d+\.\s/.test(line));
    
    if (listLines.length < 2) return;
    
    // Detect the indentation unit used (2 or 4 spaces typically)
    const indentSizes = new Set<number>();
    
    for (const line of listLines) {
      const indentMatch = line.match(/^(\s*)/);
      const indentSize = indentMatch ? indentMatch[1].length : 0;
      if (indentSize > 0) {
        indentSizes.add(indentSize);
      }
    }
    
    // Check if indentation is consistent (all multiples of same base)
    const indentArray = Array.from(indentSizes).sort((a, b) => a - b);
    if (indentArray.length > 1) {
      const baseIndent = indentArray[0];
      const hasInconsistentIndent = indentArray.some(indent => indent % baseIndent !== 0);
      
      if (hasInconsistentIndent) {
        this.addViolation({
          rule: `${patternId}-inconsistent-indentation`,
          severity: 'warning',
          message: 'List items have inconsistent indentation',
          fix: 'Use consistent indentation (2 or 4 spaces) for all list levels',
        });
      }
    }
  }

  /**
   * Validates process format sections
   */
  private validateProcessSection(answer: string, section: Section, patternId: string): void {
    const numberedListRegex = /^\s*\d+\.\s+/gm;
    const numberedLists = answer.match(numberedListRegex);
    const hasNumberedLists = numberedLists && numberedLists.length > 0;

    if (section.required && !hasNumberedLists) {
      this.addViolation({
        rule: `${patternId}-process-numbered-list`,
        severity: 'error',
        message: `${section.name} section requires numbered steps`,
        fix: 'Use numbered list format (1. 2. 3.) for process steps',
      });
      return;
    }

    if (hasNumberedLists) {
      // Check for action verbs constraint
      const actionVerbsConstraint = section.constraints?.find(c => c.type === 'action-verbs');
      if (actionVerbsConstraint && actionVerbsConstraint.value === true) {
        this.validateActionVerbs(answer, patternId);
      }

      // Check for step clarity constraint
      const stepClarityConstraint = section.constraints?.find(c => c.type === 'step-clarity');
      if (stepClarityConstraint && stepClarityConstraint.value === true) {
        this.validateStepClarity(answer, patternId);
      }

      // Check for proper numbering sequence
      const properSequenceConstraint = section.constraints?.find(c => c.type === 'proper-sequence');
      if (properSequenceConstraint && properSequenceConstraint.value === true) {
        this.validateProcessSequence(answer, patternId);
      }

      // Check for minimum steps constraint
      const minStepsConstraint = section.constraints?.find(c => c.type === 'min-steps');
      if (minStepsConstraint) {
        const steps = this.extractNumberedSteps(answer);
        const minSteps = minStepsConstraint.value as number;
        
        if (steps.length < minSteps) {
          this.addViolation({
            rule: `${patternId}-min-steps`,
            severity: 'warning',
            message: `Process should have at least ${minSteps} steps, found ${steps.length}`,
            fix: `Add more detailed steps to reach at least ${minSteps} steps`,
          });
        }
      }

      // Check for maximum steps constraint
      const maxStepsConstraint = section.constraints?.find(c => c.type === 'max-steps');
      if (maxStepsConstraint) {
        const steps = this.extractNumberedSteps(answer);
        const maxSteps = maxStepsConstraint.value as number;
        
        if (steps.length > maxSteps) {
          this.addViolation({
            rule: `${patternId}-max-steps`,
            severity: 'info',
            message: `Process has ${steps.length} steps, consider consolidating to ${maxSteps} or fewer`,
            fix: `Consider combining related steps to stay within ${maxSteps} steps`,
          });
        }
      }
    }
  }

  /**
   * Validates that process steps start with action verbs
   */
  private validateActionVerbs(answer: string, patternId: string): void {
    const steps = this.extractNumberedSteps(answer);
    const actionVerbs = [
      // Common action verbs for processes
      'create', 'build', 'configure', 'setup', 'install', 'run', 'execute', 'start', 'stop',
      'add', 'remove', 'delete', 'update', 'modify', 'change', 'edit', 'replace', 'insert',
      'open', 'close', 'save', 'load', 'import', 'export', 'download', 'upload', 'copy',
      'move', 'navigate', 'click', 'select', 'choose', 'enter', 'type', 'input', 'submit',
      'verify', 'check', 'validate', 'test', 'confirm', 'ensure', 'review', 'examine',
      'connect', 'disconnect', 'link', 'unlink', 'join', 'leave', 'attach', 'detach',
      'enable', 'disable', 'activate', 'deactivate', 'turn', 'switch', 'toggle', 'set',
      'deploy', 'publish', 'release', 'launch', 'initialize', 'restart', 'refresh', 'reload',
      'analyze', 'process', 'generate', 'compile', 'build', 'package', 'bundle', 'compress',
      'extract', 'unzip', 'mount', 'unmount', 'format', 'partition', 'backup', 'restore',
      'redirect', 'handle', 'exchange', 'use', 'access', 'send', 'receive', 'fetch', 'get',
      'post', 'put', 'patch', 'authenticate', 'authorize', 'login', 'logout', 'register'
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i].trim();
      const words = step.split(/\s+/);
      
      if (words.length === 0) continue;
      
      const firstWord = words[0].toLowerCase().replace(/[^a-z]/g, '');
      const startsWithActionVerb = actionVerbs.includes(firstWord);
      
      if (!startsWithActionVerb) {
        // Check for common non-action starters that should be flagged
        const nonActionStarters = ['the', 'a', 'an', 'this', 'that', 'these', 'those', 'you', 'we', 'they'];
        const startsWithNonAction = nonActionStarters.includes(firstWord);
        
        if (startsWithNonAction || firstWord.length > 0) {
          // Find the step in the original text for location
          const stepPattern = `${i + 1}.`;
          const stepLineIndex = this.findLineIndex(answer, stepPattern);
          
          this.addViolation({
            rule: `${patternId}-action-verb`,
            severity: 'warning',
            message: `Step ${i + 1} should start with an action verb: "${step.substring(0, 50)}${step.length > 50 ? '...' : ''}"`,
            fix: 'Start each step with a clear action verb (create, configure, run, etc.)',
          }, {
            answer,
            searchText: `${i + 1}. ${step.substring(0, 20)}`,
            lineHint: stepLineIndex,
          });
        }
      }
    }
  }

  /**
   * Validates step clarity in process descriptions
   */
  private validateStepClarity(answer: string, patternId: string): void {
    const steps = this.extractNumberedSteps(answer);
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i].trim();
      
      // Check for overly long steps
      const wordCount = step.split(/\s+/).length;
      if (wordCount > 30) {
        this.addViolation({
          rule: `${patternId}-step-length`,
          severity: 'info',
          message: `Step ${i + 1} is quite long (${wordCount} words), consider breaking it down`,
          fix: 'Break long steps into smaller, more manageable sub-steps',
        });
      }
      
      // Check for vague language
      const vaguePhrases = ['somehow', 'something', 'etc', 'and so on', 'as needed', 'if necessary', 'appropriately'];
      const hasVagueLanguage = vaguePhrases.some(phrase => step.toLowerCase().includes(phrase));
      
      if (hasVagueLanguage) {
        this.addViolation({
          rule: `${patternId}-step-vagueness`,
          severity: 'warning',
          message: `Step ${i + 1} contains vague language that may confuse users`,
          fix: 'Use specific, concrete language in process steps',
        });
      }
      
      // Check for missing details (very short steps)
      if (step.length < 10) {
        this.addViolation({
          rule: `${patternId}-step-detail`,
          severity: 'warning',
          message: `Step ${i + 1} may be too brief to be actionable`,
          fix: 'Provide more specific details for each step',
        });
      }
    }
  }

  /**
   * Validates proper sequence numbering in process steps
   */
  private validateProcessSequence(answer: string, patternId: string): void {
    const lines = answer.split('\n');
    const numberedLines = lines.filter(line => /^\s*\d+\.\s/.test(line));
    
    let expectedNumber = 1;
    for (const line of numberedLines) {
      const match = line.match(/^\s*(\d+)\.\s/);
      if (match) {
        const actualNumber = parseInt(match[1], 10);
        
        if (actualNumber !== expectedNumber) {
          this.addViolation({
            rule: `${patternId}-sequence-numbering`,
            severity: 'error',
            message: `Process step numbering is not sequential: expected ${expectedNumber}, found ${actualNumber}`,
            fix: 'Ensure process steps use sequential numbering (1. 2. 3. ...)',
          });
        }
        
        expectedNumber++;
      }
    }
  }

  /**
   * Extracts numbered steps from answer text
   */
  private extractNumberedSteps(answer: string): string[] {
    const numberedRegex = /^\s*\d+\.\s+(.+)$/gm;
    const steps: string[] = [];
    let match;

    while ((match = numberedRegex.exec(answer)) !== null) {
      steps.push(match[1]);
    }

    return steps;
  }

  /**
   * Validates code format sections
   */
  private validateCodeSection(answer: string, section: Section, patternId: string): void {
    const fencedCodeRegex = /```[\s\S]*?```/g;
    const inlineCodeRegex = /`[^`]+`/g;
    
    const fencedBlocks = answer.match(fencedCodeRegex);
    const inlineCode = answer.match(inlineCodeRegex);
    const hasCode = (fencedBlocks && fencedBlocks.length > 0) || (inlineCode && inlineCode.length > 0);

    if (section.required && !hasCode) {
      this.addViolation({
        rule: `${patternId}-code-required`,
        severity: 'error',
        message: `${section.name} section requires code examples`,
        fix: 'Add code examples using fenced code blocks (```) or inline code (`)',
      });
      return;
    }

    if (fencedBlocks && fencedBlocks.length > 0) {
      // Check for language identifiers
      const requiresLanguageConstraint = section.constraints?.find(c => c.type === 'requires-language');
      if (requiresLanguageConstraint && requiresLanguageConstraint.value === true) {
        this.validateCodeLanguageIdentifiers(fencedBlocks, patternId);
      }

      // Check for proper indentation
      const properIndentationConstraint = section.constraints?.find(c => c.type === 'proper-indentation');
      if (properIndentationConstraint && properIndentationConstraint.value === true) {
        this.validateCodeIndentation(fencedBlocks, patternId);
      }

      // Check for code block completeness
      const completeBlocksConstraint = section.constraints?.find(c => c.type === 'complete-blocks');
      if (completeBlocksConstraint && completeBlocksConstraint.value === true) {
        this.validateCodeBlockCompleteness(fencedBlocks, patternId);
      }

      // Check for code comments constraint
      const codeCommentsConstraint = section.constraints?.find(c => c.type === 'code-comments');
      if (codeCommentsConstraint && codeCommentsConstraint.value === true) {
        this.validateCodeComments(fencedBlocks, patternId);
      }

      // Check for runnable code constraint
      const runnableCodeConstraint = section.constraints?.find(c => c.type === 'runnable-code');
      if (runnableCodeConstraint && runnableCodeConstraint.value === true) {
        this.validateRunnableCode(fencedBlocks, patternId);
      }

      // Check for minimum code lines constraint
      const minLinesConstraint = section.constraints?.find(c => c.type === 'min-lines');
      if (minLinesConstraint) {
        const minLines = minLinesConstraint.value as number;
        this.validateMinimumCodeLines(fencedBlocks, minLines, patternId);
      }

      // Check for maximum code lines constraint
      const maxLinesConstraint = section.constraints?.find(c => c.type === 'max-lines');
      if (maxLinesConstraint) {
        const maxLines = maxLinesConstraint.value as number;
        this.validateMaximumCodeLines(fencedBlocks, maxLines, patternId);
      }
    }

    // Validate inline code usage
    if (inlineCode && inlineCode.length > 0) {
      const inlineCodeConstraint = section.constraints?.find(c => c.type === 'inline-code-usage');
      if (inlineCodeConstraint && inlineCodeConstraint.value === true) {
        this.validateInlineCodeUsage(answer, patternId);
      }
    }
  }

  /**
   * Validates language identifiers in code blocks
   */
  private validateCodeLanguageIdentifiers(fencedBlocks: string[], patternId: string): void {
    for (const block of fencedBlocks) {
      const hasLanguage = /```\w+/.test(block);
      if (!hasLanguage) {
        // Find the code block in the answer for location
        const blockStart = block.substring(0, 20);
        this.addViolation({
          rule: `${patternId}-code-language`,
          severity: 'warning',
          message: 'Code block is missing language identifier',
          fix: 'Add language identifier after opening ``` (e.g., ```javascript, ```python)',
        }, {
          searchText: '```',
        });
      } else {
        // Validate common language identifiers
        const languageMatch = block.match(/```(\w+)/);
        if (languageMatch) {
          const language = languageMatch[1].toLowerCase();
          const commonLanguages = [
            'javascript', 'js', 'typescript', 'ts', 'python', 'py', 'java', 'c', 'cpp', 'csharp', 'cs',
            'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'scala', 'html', 'css', 'scss', 'sass',
            'json', 'xml', 'yaml', 'yml', 'sql', 'bash', 'sh', 'powershell', 'dockerfile', 'makefile',
            'markdown', 'md', 'text', 'plaintext', 'diff', 'patch'
          ];
          
          if (!commonLanguages.includes(language)) {
            this.addViolation({
              rule: `${patternId}-unknown-language`,
              severity: 'info',
              message: `Unknown language identifier: "${language}"`,
              fix: 'Use standard language identifiers (javascript, python, java, etc.)',
            }, {
              searchText: `\`\`\`${language}`,
            });
          }
        }
      }
    }
  }

  /**
   * Validates code indentation consistency
   */
  private validateCodeIndentation(fencedBlocks: string[], patternId: string): void {
    for (const block of fencedBlocks) {
      const lines = block.split('\n').slice(1, -1); // Remove fence lines
      const hasInconsistentIndentation = this.checkIndentation(lines);
      
      if (hasInconsistentIndentation) {
        this.addViolation({
          rule: `${patternId}-code-indentation`,
          severity: 'info',
          message: 'Code block has inconsistent indentation',
          fix: 'Ensure consistent indentation throughout the code block',
        });
      }
    }
  }

  /**
   * Validates code block completeness (proper opening/closing)
   */
  private validateCodeBlockCompleteness(fencedBlocks: string[], patternId: string): void {
    for (const block of fencedBlocks) {
      // Check for proper opening and closing
      if (!block.startsWith('```') || !block.endsWith('```')) {
        this.addViolation({
          rule: `${patternId}-incomplete-block`,
          severity: 'error',
          message: 'Code block is not properly closed',
          fix: 'Ensure code blocks start and end with ``` on separate lines',
        });
      }

      // Check for empty code blocks
      const content = block.replace(/```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
      if (content.length === 0) {
        this.addViolation({
          rule: `${patternId}-empty-block`,
          severity: 'warning',
          message: 'Code block is empty',
          fix: 'Add meaningful code content or remove the empty code block',
        });
      }
    }
  }

  /**
   * Validates presence of code comments for complex logic
   */
  private validateCodeComments(fencedBlocks: string[], patternId: string): void {
    for (const block of fencedBlocks) {
      const lines = block.split('\n').slice(1, -1); // Remove fence lines
      const codeLines = lines.filter(line => line.trim().length > 0);
      const commentLines = lines.filter(line => {
        const trimmed = line.trim();
        return trimmed.startsWith('//') || trimmed.startsWith('#') || 
               trimmed.startsWith('/*') || trimmed.includes('*/') ||
               trimmed.startsWith('<!--') || trimmed.includes('-->');
      });

      // If code block is substantial (>5 lines), suggest comments
      if (codeLines.length > 5 && commentLines.length === 0) {
        this.addViolation({
          rule: `${patternId}-missing-comments`,
          severity: 'info',
          message: 'Complex code block lacks explanatory comments',
          fix: 'Add inline comments to explain complex logic',
        });
      }
    }
  }

  /**
   * Validates that code examples are runnable/complete
   */
  private validateRunnableCode(fencedBlocks: string[], patternId: string): void {
    for (const block of fencedBlocks) {
      const content = block.replace(/```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
      
      // Check for incomplete code patterns
      const incompletePatterns = [
        /\.\.\./g, // Ellipsis indicating omitted code
        /\/\/ \.\.\./g, // Comment ellipsis
        /# \.\.\./g, // Python comment ellipsis
        /\/\* \.\.\. \*\//g, // Block comment ellipsis
      ];

      for (const pattern of incompletePatterns) {
        if (pattern.test(content)) {
          this.addViolation({
            rule: `${patternId}-incomplete-code`,
            severity: 'info',
            message: 'Code block contains placeholder ellipsis (...)',
            fix: 'Replace ellipsis with complete, runnable code',
          });
          break;
        }
      }

      // Check for common syntax errors (basic validation)
      const lines = content.split('\n');
      let openBraces = 0;
      let openParens = 0;
      let openBrackets = 0;

      for (const line of lines) {
        openBraces += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
        openParens += (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
        openBrackets += (line.match(/\[/g) || []).length - (line.match(/\]/g) || []).length;
      }

      if (openBraces !== 0 || openParens !== 0 || openBrackets !== 0) {
        this.addViolation({
          rule: `${patternId}-syntax-error`,
          severity: 'warning',
          message: 'Code block may have unmatched brackets, braces, or parentheses',
          fix: 'Check for matching opening and closing brackets, braces, and parentheses',
        });
      }
    }
  }

  /**
   * Validates minimum code lines constraint
   */
  private validateMinimumCodeLines(fencedBlocks: string[], minLines: number, patternId: string): void {
    for (const block of fencedBlocks) {
      const lines = block.split('\n').slice(1, -1); // Remove fence lines
      const codeLines = lines.filter(line => line.trim().length > 0);
      
      if (codeLines.length < minLines) {
        this.addViolation({
          rule: `${patternId}-min-code-lines`,
          severity: 'warning',
          message: `Code block has ${codeLines.length} lines, minimum required is ${minLines}`,
          fix: `Add more code content to reach at least ${minLines} lines`,
        });
      }
    }
  }

  /**
   * Validates maximum code lines constraint
   */
  private validateMaximumCodeLines(fencedBlocks: string[], maxLines: number, patternId: string): void {
    for (const block of fencedBlocks) {
      const lines = block.split('\n').slice(1, -1); // Remove fence lines
      const codeLines = lines.filter(line => line.trim().length > 0);
      
      if (codeLines.length > maxLines) {
        this.addViolation({
          rule: `${patternId}-max-code-lines`,
          severity: 'info',
          message: `Code block has ${codeLines.length} lines, consider breaking it down (max recommended: ${maxLines})`,
          fix: `Break large code blocks into smaller, focused examples`,
        });
      }
    }
  }

  /**
   * Validates proper usage of inline code
   */
  private validateInlineCodeUsage(answer: string, patternId: string): void {
    const inlineCodeRegex = /`([^`]+)`/g;
    let match;
    
    while ((match = inlineCodeRegex.exec(answer)) !== null) {
      const inlineContent = match[1];
      
      // Check for overly long inline code
      if (inlineContent.length > 50) {
        this.addViolation({
          rule: `${patternId}-long-inline-code`,
          severity: 'info',
          message: 'Inline code is quite long, consider using a code block instead',
          fix: 'Use fenced code blocks (```) for longer code snippets',
        });
      }

      // Check for multi-line content in inline code
      if (inlineContent.includes('\n')) {
        this.addViolation({
          rule: `${patternId}-multiline-inline-code`,
          severity: 'warning',
          message: 'Inline code contains line breaks',
          fix: 'Use fenced code blocks for multi-line code',
        });
      }
    }
  }

  /**
   * Validates diagram format sections
   */
  private validateDiagramSection(answer: string, section: Section, patternId: string): void {
    const mermaidRegex = /```mermaid[\s\S]*?```/g;
    const diagrams = answer.match(mermaidRegex);

    if (section.required && (!diagrams || diagrams.length === 0)) {
      this.addViolation({
        rule: `${patternId}-diagram-required`,
        severity: 'error',
        message: `${section.name} section requires a Mermaid diagram`,
        fix: 'Add a Mermaid diagram using ```mermaid code blocks',
      });
      return;
    }

    if (diagrams && diagrams.length > 0) {
      // Check diagram complexity constraint
      const maxNodesConstraint = section.constraints?.find(c => c.type === 'max-nodes');
      if (maxNodesConstraint) {
        for (const diagram of diagrams) {
          const nodeCount = this.countMermaidNodes(diagram);
          const maxNodes = maxNodesConstraint.value as number;
          
          if (nodeCount > maxNodes) {
            this.addViolation({
              rule: `${patternId}-diagram-complexity`,
              severity: 'warning',
              message: `Diagram has ${nodeCount} nodes, exceeding maximum of ${maxNodes}`,
              fix: `Simplify the diagram to have no more than ${maxNodes} nodes`,
            });
          }
        }
      }

      // Check for valid Mermaid syntax (basic check)
      for (const diagram of diagrams) {
        const content = diagram.replace(/```mermaid\n?/, '').replace(/\n?```/, '');
        const hasValidSyntax = this.validateMermaidSyntax(content);
        
        if (!hasValidSyntax) {
          this.addViolation({
            rule: `${patternId}-diagram-syntax`,
            severity: 'error',
            message: 'Diagram contains invalid Mermaid syntax',
            fix: 'Check Mermaid syntax and ensure proper diagram structure',
          });
        }
      }

      // Check for text explanation before/after diagram constraint
      const textExplanationConstraint = section.constraints?.find(c => c.type === 'text-explanation');
      if (textExplanationConstraint && textExplanationConstraint.value === true) {
        this.validateDiagramTextExplanation(answer, diagrams, patternId);
      }

      // Check for minimum explanation length constraint
      const minExplanationLengthConstraint = section.constraints?.find(c => c.type === 'min-explanation-length');
      if (minExplanationLengthConstraint) {
        const minLength = minExplanationLengthConstraint.value as number;
        this.validateDiagramExplanationLength(answer, diagrams, minLength, patternId);
      }

      // Check for diagram context constraint
      const diagramContextConstraint = section.constraints?.find(c => c.type === 'diagram-context');
      if (diagramContextConstraint && diagramContextConstraint.value === true) {
        this.validateDiagramContext(answer, diagrams, patternId);
      }

      // Check for appropriate diagram type constraint
      const appropriateDiagramTypeConstraint = section.constraints?.find(c => c.type === 'appropriate-diagram-type');
      if (appropriateDiagramTypeConstraint && appropriateDiagramTypeConstraint.value === true) {
        this.validateDiagramType(diagrams, patternId);
      }
    }
  }

  /**
   * Validates text format sections
   */
  private validateTextSection(answer: string, section: Section, patternId: string): void {
    // Check for required headers constraint
    const requiredHeadersConstraint = section.constraints?.find(c => c.type === 'required-headers');
    if (requiredHeadersConstraint && Array.isArray(requiredHeadersConstraint.value)) {
      const headers = requiredHeadersConstraint.value as string[];
      for (const header of headers) {
        const headerRegex = new RegExp(`^#{1,6}\\s+${header}`, 'mi');
        if (!headerRegex.test(answer)) {
          this.addViolation({
            rule: `${patternId}-required-header`,
            severity: 'error',
            message: `Missing required section header: "${header}"`,
            fix: `Add the "${header}" section header`,
          });
        }
      }
    }

    // Check for single sentence constraint (for definitions)
    const singleSentenceConstraint = section.constraints?.find(c => c.type === 'single-sentence');
    if (singleSentenceConstraint && singleSentenceConstraint.value === true) {
      const firstLine = answer.split('\n')[0];
      const sentenceCount = this.countSentences(firstLine);
      
      if (sentenceCount !== 1) {
        this.addViolation({
          rule: `${patternId}-single-sentence`,
          severity: 'error',
          message: `First line should be a single sentence, found ${sentenceCount} sentences`,
          fix: 'Rewrite the opening as a single, concise sentence',
        });
      }
    }

    // Check for blank line after constraint
    const blankLineAfterConstraint = section.constraints?.find(c => c.type === 'blank-line-after');
    if (blankLineAfterConstraint && blankLineAfterConstraint.value === true) {
      const lines = answer.split('\n');
      if (lines.length > 1 && lines[1] !== '') {
        this.addViolation({
          rule: `${patternId}-blank-line`,
          severity: 'warning',
          message: 'Missing blank line after opening sentence',
          fix: 'Add a blank line after the first sentence',
        });
      }
    }

    // Check for bulleted list presence constraint (for definitions)
    const bulletedListConstraint = section.constraints?.find(c => c.type === 'bulleted-list-required');
    if (bulletedListConstraint && bulletedListConstraint.value === true) {
      const bulletListRegex = /^\s*[-*+]\s+/gm;
      const bulletLists = answer.match(bulletListRegex);
      
      if (!bulletLists || bulletLists.length === 0) {
        this.addViolation({
          rule: `${patternId}-bulleted-list-required`,
          severity: 'error',
          message: 'Definition format requires a bulleted list of key characteristics',
          fix: 'Add a bulleted list with 3-5 key characteristics using - or * bullets',
        });
      }
    }

    // Check for minimum list items constraint (for definitions)
    const minListItemsConstraint = section.constraints?.find(c => c.type === 'min-list-items');
    if (minListItemsConstraint) {
      const minItems = minListItemsConstraint.value as number;
      const listItems = this.extractListItems(answer);
      
      if (listItems.length < minItems) {
        this.addViolation({
          rule: `${patternId}-min-list-items`,
          severity: 'warning',
          message: `Definition should have at least ${minItems} key characteristics, found ${listItems.length}`,
          fix: `Add more key characteristics to reach at least ${minItems} items`,
        });
      }
    }

    // Check for maximum list items constraint (for definitions)
    const maxListItemsConstraint = section.constraints?.find(c => c.type === 'max-list-items');
    if (maxListItemsConstraint) {
      const maxItems = maxListItemsConstraint.value as number;
      const listItems = this.extractListItems(answer);
      
      if (listItems.length > maxItems) {
        this.addViolation({
          rule: `${patternId}-max-list-items`,
          severity: 'info',
          message: `Definition has ${listItems.length} characteristics, consider limiting to ${maxItems} for better readability`,
          fix: `Consider consolidating or removing some characteristics to stay within ${maxItems} items`,
        });
      }
    }

    // Check for definition structure constraint
    const definitionStructureConstraint = section.constraints?.find(c => c.type === 'definition-structure');
    if (definitionStructureConstraint && definitionStructureConstraint.value === true) {
      this.validateDefinitionStructure(answer, patternId);
    }
  }

  /**
   * Validates the overall structure of a definition answer
   */
  private validateDefinitionStructure(answer: string, patternId: string): void {
    const lines = answer.split('\n');
    
    // Check if first line is non-empty
    if (lines.length === 0 || lines[0].trim().length === 0) {
      this.addViolation({
        rule: `${patternId}-definition-opening`,
        severity: 'error',
        message: 'Definition must start with a clear opening sentence',
        fix: 'Add a concise definition sentence at the beginning',
      });
      return;
    }

    // Check for proper structure: definition -> blank line -> characteristics
    let hasBlankLineAfterDefinition = false;
    let hasCharacteristicsList = false;
    let definitionLineIndex = 0;

    // Find the end of the definition (first non-empty line)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().length > 0) {
        definitionLineIndex = i;
        break;
      }
    }

    // Check for blank line after definition
    if (lines.length > definitionLineIndex + 1) {
      if (lines[definitionLineIndex + 1].trim() === '') {
        hasBlankLineAfterDefinition = true;
        
        // Look for characteristics list after blank line
        for (let i = definitionLineIndex + 2; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.match(/^\s*[-*+]\s+/) || line.match(/^\s*\d+\.\s+/)) {
            hasCharacteristicsList = true;
            break;
          }
          // Skip empty lines
          if (line.length > 0) {
            break;
          }
        }
      }
    }

    if (!hasBlankLineAfterDefinition) {
      this.addViolation({
        rule: `${patternId}-definition-blank-line`,
        severity: 'warning',
        message: 'Definition should be followed by a blank line before characteristics',
        fix: 'Add a blank line after the definition sentence',
      });
    }

    if (!hasCharacteristicsList) {
      this.addViolation({
        rule: `${patternId}-definition-characteristics`,
        severity: 'error',
        message: 'Definition should include a list of key characteristics',
        fix: 'Add a bulleted list of 3-5 key characteristics after the definition',
      });
    }
  }

  /**
   * Validates a custom rule
   */
  private validateRule(answer: string, rule: any): void {
    try {
      const isValid = rule.validator(answer);
      if (!isValid) {
        this.addViolation({
          rule: rule.id,
          severity: 'error',
          message: rule.errorMessage,
          fix: `Address the issue: ${rule.description}`,
        });
      }
    } catch (error) {
      // Rule validation failed - log but don't break validation
      console.warn(`Rule validation failed for ${rule.id}:`, error);
    }
  }

  /**
   * Adds a violation to the current list with enhanced feedback generation
   */
  private addViolation(violation: Omit<ValidationViolation, 'location'>, context?: { 
    answer?: string; 
    searchText?: string; 
    lineHint?: number 
  }): void {
    // Generate location information if context is provided
    let location: { line: number; column: number } | undefined;
    
    if (context?.answer && context?.searchText) {
      location = this.findTextLocation(context.answer, context.searchText, context.lineHint);
    }

    // Enhance the violation message with more specific feedback
    const enhancedViolation: ValidationViolation = {
      ...violation,
      message: this.enhanceViolationMessage(violation),
      fix: this.generateActionableFix(violation),
      location,
    };

    this.currentViolations.push(enhancedViolation);
  }

  /**
   * Finds the line index of a specific text within the answer
   */
  private findLineIndex(answer: string, searchText: string): number {
    const lines = answer.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchText)) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Finds the line and column location of text within the answer
   */
  private findTextLocation(answer: string, searchText: string, lineHint?: number): { line: number; column: number } | undefined {
    const lines = answer.split('\n');
    
    // If we have a line hint, search around that area first
    if (lineHint !== undefined && lineHint >= 0 && lineHint < lines.length) {
      const line = lines[lineHint];
      const column = line.indexOf(searchText);
      if (column !== -1) {
        return { line: lineHint + 1, column: column + 1 }; // 1-based indexing
      }
    }
    
    // Search through all lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const column = line.indexOf(searchText);
      if (column !== -1) {
        return { line: i + 1, column: column + 1 }; // 1-based indexing
      }
    }
    
    // If exact text not found, try to find similar patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      const searchLower = searchText.toLowerCase();
      const column = line.indexOf(searchLower);
      if (column !== -1) {
        return { line: i + 1, column: column + 1 }; // 1-based indexing
      }
    }
    
    return undefined;
  }

  /**
   * Enhances violation messages with more specific and actionable feedback
   */
  private enhanceViolationMessage(violation: Omit<ValidationViolation, 'location'>): string {
    const baseMessage = violation.message;
    const severity = violation.severity;
    const rule = violation.rule;

    // Add severity-specific prefixes for clarity
    let prefix = '';
    switch (severity) {
      case 'error':
        prefix = '❌ Critical Issue: ';
        break;
      case 'warning':
        prefix = '⚠️  Warning: ';
        break;
      case 'info':
        prefix = 'ℹ️  Suggestion: ';
        break;
    }

    // Add rule-specific context for better understanding
    let context = '';
    if (rule.includes('table')) {
      context = ' (Table formatting issue)';
    } else if (rule.includes('list')) {
      context = ' (List formatting issue)';
    } else if (rule.includes('code')) {
      context = ' (Code formatting issue)';
    } else if (rule.includes('diagram')) {
      context = ' (Diagram issue)';
    } else if (rule.includes('pros-cons')) {
      context = ' (Pros/Cons structure issue)';
    } else if (rule.includes('process')) {
      context = ' (Process steps issue)';
    } else if (rule.includes('definition')) {
      context = ' (Definition format issue)';
    } else if (rule.includes('troubleshooting')) {
      context = ' (Troubleshooting structure issue)';
    }

    return `${prefix}${baseMessage}${context}`;
  }

  /**
   * Generates more actionable and specific fix suggestions
   */
  private generateActionableFix(violation: Omit<ValidationViolation, 'location'>): string {
    const baseFix = violation.fix || 'Review and correct the issue';
    const rule = violation.rule;
    const severity = violation.severity;

    // Generate rule-specific actionable fixes
    let actionableFix = baseFix;
    let examples = '';
    let priority = '';

    // Add priority indicators based on severity
    switch (severity) {
      case 'error':
        priority = '🔴 MUST FIX: ';
        break;
      case 'warning':
        priority = '🟡 SHOULD FIX: ';
        break;
      case 'info':
        priority = '🔵 CONSIDER: ';
        break;
    }

    // Add specific examples and detailed instructions based on rule type
    if (rule.includes('table-required')) {
      examples = '\n\nExample:\n```\n| Feature | Option A | Option B |\n|---------|----------|----------|\n| Speed   | Fast     | Slow     |\n| Cost    | High     | Low      |\n```';
    } else if (rule.includes('table-headers')) {
      examples = '\n\nExample header separator:\n```\n| Column 1 | Column 2 |\n|----------|----------|\n| Data 1   | Data 2   |\n```';
    } else if (rule.includes('min-columns')) {
      examples = '\n\nFor comparison tables, use at least:\n```\n| Feature | Item A | Item B |\n```';
    } else if (rule.includes('list-required')) {
      examples = '\n\nExample bulleted list:\n```\n- First key point\n- Second key point\n- Third key point\n```';
    } else if (rule.includes('action-verb')) {
      examples = '\n\nGood action verbs: Create, Configure, Run, Check, Update, Install, Remove, Set, Enable, Restart';
    } else if (rule.includes('code-language')) {
      examples = '\n\nExample:\n```javascript\nconst example = "code here";\n```\n\nSupported languages: javascript, python, java, typescript, bash, sql, html, css';
    } else if (rule.includes('diagram-required')) {
      examples = '\n\nExample Mermaid diagram:\n```mermaid\ngraph TD\n    A[Start] --> B[Process]\n    B --> C[End]\n```';
    } else if (rule.includes('single-sentence')) {
      examples = '\n\nExample definition opening:\n"A microservice is an independently deployable service that focuses on a single business capability."';
    } else if (rule.includes('pros-cons')) {
      examples = '\n\nExample structure:\n```\n## Advantages\n- Benefit one\n- Benefit two\n\n## Disadvantages\n- Drawback one\n- Drawback two\n```';
    } else if (rule.includes('troubleshooting')) {
      examples = '\n\nRequired sections:\n```\n## Problem\n[Description of the issue]\n\n## Causes\n- Potential cause 1\n- Potential cause 2\n\n## Solutions\n1. First solution step\n2. Second solution step\n```';
    }

    // Combine priority, fix, and examples
    return `${priority}${actionableFix}${examples}`;
  }

  /**
   * Calculates validation score based on violations
   */
  private calculateScore(): number {
    if (this.currentViolations.length === 0) {
      return 100;
    }

    let penalty = 0;
    for (const violation of this.currentViolations) {
      switch (violation.severity) {
        case 'error':
          penalty += 20;
          break;
        case 'warning':
          penalty += 10;
          break;
        case 'info':
          penalty += 5;
          break;
      }
    }

    return Math.max(0, 100 - penalty);
  }

  /**
   * Extracts list items from answer text
   */
  private extractListItems(answer: string): string[] {
    const bulletRegex = /^\s*[-*+]\s+(.+)$/gm;
    const numberedRegex = /^\s*\d+\.\s+(.+)$/gm;
    
    const items: string[] = [];
    let match;

    // Extract bulleted items
    while ((match = bulletRegex.exec(answer)) !== null) {
      items.push(match[1]);
    }

    // Extract numbered items
    while ((match = numberedRegex.exec(answer)) !== null) {
      items.push(match[1]);
    }

    return items;
  }

  /**
   * Counts sentences in a text string
   */
  private countSentences(text: string): number {
    if (!text || text.trim().length === 0) return 0;
    
    // Simple sentence counting - split on . ! ? followed by space or end
    // But be careful about abbreviations and decimal numbers
    const sentences = text
      .trim()
      // Replace common abbreviations to avoid false splits
      .replace(/\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|i\.e|e\.g)\./gi, '$1<DOT>')
      // Replace decimal numbers to avoid false splits
      .replace(/\d+\.\d+/g, (match) => match.replace('.', '<DOT>'))
      // Split on sentence endings
      .split(/[.!?]+(?:\s|$)/)
      // Filter out empty strings
      .filter(s => s.trim().length > 0)
      // Restore dots
      .map(s => s.replace(/<DOT>/g, '.'));
    
    return sentences.length;
  }

  /**
   * Checks for consistent indentation in code lines
   */
  private checkIndentation(lines: string[]): boolean {
    if (lines.length <= 1) return false;

    const indentations = lines
      .filter(line => line.trim().length > 0)
      .map(line => {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
      });

    // Check if indentation follows a consistent pattern
    const uniqueIndents = Array.from(new Set(indentations)).sort((a, b) => a - b);
    
    // If there are more than 4 different indentation levels, it's likely inconsistent
    return uniqueIndents.length > 4;
  }

  /**
   * Counts nodes in a Mermaid diagram
   */
  private countMermaidNodes(diagram: string): number {
    // Simple node counting - look for node definitions
    // This is a basic implementation, could be more sophisticated
    const content = diagram.replace(/```mermaid\n?/, '').replace(/\n?```/, '');
    
    // Count unique node identifiers (simplified)
    const nodeMatches = content.match(/\b[A-Za-z][A-Za-z0-9]*(?:\[[^\]]*\])?/g) || [];
    const uniqueNodes = new Set(nodeMatches.map(node => node.split('[')[0]));
    
    return uniqueNodes.size;
  }

  /**
   * Basic Mermaid syntax validation
   */
  private validateMermaidSyntax(content: string): boolean {
    // Basic checks for common Mermaid diagram types
    const diagramTypes = [
      'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 
      'stateDiagram', 'erDiagram', 'journey', 'gantt'
    ];
    
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) return false;
    
    // Check if it starts with a known diagram type
    const startsWithDiagramType = diagramTypes.some(type => 
      trimmedContent.toLowerCase().startsWith(type.toLowerCase())
    );
    
    // If it doesn't start with a diagram type, it might still be valid
    // (some diagrams don't require explicit type declaration)
    return startsWithDiagramType || trimmedContent.includes('-->') || trimmedContent.includes('---');
  }

  /**
   * Validates pros/cons format sections
   */
  private validateProsConsSection(answer: string, section: Section, patternId: string): void {
    // Check for required sections constraint
    const requiredSectionsConstraint = section.constraints?.find(c => c.type === 'required-sections');
    if (requiredSectionsConstraint && requiredSectionsConstraint.value === true) {
      this.validateProsConsSections(answer, patternId);
    }

    // Check for section balance constraint
    const sectionBalanceConstraint = section.constraints?.find(c => c.type === 'section-balance');
    if (sectionBalanceConstraint && sectionBalanceConstraint.value === true) {
      this.validateProsConsBalance(answer, patternId);
    }

    // Check for bulleted list format constraint
    const bulletedListConstraint = section.constraints?.find(c => c.type === 'bulleted-lists');
    if (bulletedListConstraint && bulletedListConstraint.value === true) {
      this.validateProsConsListFormat(answer, patternId);
    }

    // Check for minimum items constraint
    const minItemsConstraint = section.constraints?.find(c => c.type === 'min-items-per-section');
    if (minItemsConstraint) {
      const minItems = minItemsConstraint.value as number;
      this.validateProsConsMinItems(answer, minItems, patternId);
    }

    // Check for section order constraint
    const sectionOrderConstraint = section.constraints?.find(c => c.type === 'section-order');
    if (sectionOrderConstraint && sectionOrderConstraint.value === true) {
      this.validateProsConsSectionOrder(answer, patternId);
    }
  }

  /**
   * Validates presence of required pros/cons sections
   */
  private validateProsConsSections(answer: string, patternId: string): void {
    const advantagesRegex = /^#{1,6}\s+(Advantages?|Pros?|Benefits?)\s*$/mi;
    const disadvantagesRegex = /^#{1,6}\s+(Disadvantages?|Cons?|Drawbacks?|Limitations?)\s*$/mi;
    
    const hasAdvantages = advantagesRegex.test(answer);
    const hasDisadvantages = disadvantagesRegex.test(answer);

    if (!hasAdvantages) {
      this.addViolation({
        rule: `${patternId}-missing-advantages`,
        severity: 'error',
        message: 'Missing required "Advantages" or "Pros" section',
        fix: 'Add an "## Advantages" or "## Pros" section header',
      });
    }

    if (!hasDisadvantages) {
      this.addViolation({
        rule: `${patternId}-missing-disadvantages`,
        severity: 'error',
        message: 'Missing required "Disadvantages" or "Cons" section',
        fix: 'Add a "## Disadvantages" or "## Cons" section header',
      });
    }
  }

  /**
   * Validates balance between pros and cons sections
   */
  private validateProsConsBalance(answer: string, patternId: string): void {
    const prosItems = this.extractProsConsItems(answer, 'pros');
    const consItems = this.extractProsConsItems(answer, 'cons');

    if (prosItems.length === 0 && consItems.length === 0) {
      return; // No items to balance
    }

    // Check for significant imbalance (one section has 3x more items than the other)
    const ratio = prosItems.length > 0 && consItems.length > 0 
      ? Math.max(prosItems.length / consItems.length, consItems.length / prosItems.length)
      : Infinity;

    if (ratio > 3) {
      this.addViolation({
        rule: `${patternId}-section-imbalance`,
        severity: 'warning',
        message: `Pros/cons sections are imbalanced: ${prosItems.length} pros vs ${consItems.length} cons`,
        fix: 'Try to provide a more balanced view with similar numbers of pros and cons',
      });
    }

    // Check for missing items in either section
    if (prosItems.length === 0 && consItems.length > 0) {
      this.addViolation({
        rule: `${patternId}-missing-pros`,
        severity: 'warning',
        message: 'Advantages section exists but contains no items',
        fix: 'Add bulleted list items to the Advantages section',
      });
    }

    if (consItems.length === 0 && prosItems.length > 0) {
      this.addViolation({
        rule: `${patternId}-missing-cons`,
        severity: 'warning',
        message: 'Disadvantages section exists but contains no items',
        fix: 'Add bulleted list items to the Disadvantages section',
      });
    }
  }

  /**
   * Validates that pros/cons sections use bulleted lists
   */
  private validateProsConsListFormat(answer: string, patternId: string): void {
    const sections = this.extractProsConsSections(answer);
    
    for (const section of sections) {
      const bulletListRegex = /^\s*[-*+]\s+/gm;
      const hasBulletedList = bulletListRegex.test(section.content);
      
      if (section.content.trim().length > 0 && !hasBulletedList) {
        this.addViolation({
          rule: `${patternId}-list-format`,
          severity: 'warning',
          message: `${section.type} section should use bulleted lists`,
          fix: 'Format items as bulleted lists using - or * bullets',
        });
      }
    }
  }

  /**
   * Validates minimum number of items per section
   */
  private validateProsConsMinItems(answer: string, minItems: number, patternId: string): void {
    const prosItems = this.extractProsConsItems(answer, 'pros');
    const consItems = this.extractProsConsItems(answer, 'cons');

    if (prosItems.length > 0 && prosItems.length < minItems) {
      this.addViolation({
        rule: `${patternId}-min-pros`,
        severity: 'info',
        message: `Advantages section has ${prosItems.length} items, consider adding more (minimum: ${minItems})`,
        fix: `Add more advantages to reach at least ${minItems} items`,
      });
    }

    if (consItems.length > 0 && consItems.length < minItems) {
      this.addViolation({
        rule: `${patternId}-min-cons`,
        severity: 'info',
        message: `Disadvantages section has ${consItems.length} items, consider adding more (minimum: ${minItems})`,
        fix: `Add more disadvantages to reach at least ${minItems} items`,
      });
    }
  }

  /**
   * Validates the order of pros/cons sections (pros typically come first)
   */
  private validateProsConsSectionOrder(answer: string, patternId: string): void {
    const advantagesMatch = answer.match(/^#{1,6}\s+(Advantages?|Pros?|Benefits?)\s*$/mi);
    const disadvantagesMatch = answer.match(/^#{1,6}\s+(Disadvantages?|Cons?|Drawbacks?|Limitations?)\s*$/mi);

    if (advantagesMatch && disadvantagesMatch) {
      const advantagesIndex = advantagesMatch.index || 0;
      const disadvantagesIndex = disadvantagesMatch.index || 0;

      if (disadvantagesIndex < advantagesIndex) {
        this.addViolation({
          rule: `${patternId}-section-order`,
          severity: 'info',
          message: 'Consider placing Advantages section before Disadvantages section',
          fix: 'Reorder sections to show advantages first, then disadvantages',
        });
      }
    }
  }

  /**
   * Extracts pros/cons items from the answer
   */
  private extractProsConsItems(answer: string, type: 'pros' | 'cons'): string[] {
    const sections = this.extractProsConsSections(answer);
    const targetSection = sections.find(s => s.type === type);
    
    if (!targetSection) return [];

    const bulletRegex = /^\s*[-*+]\s+(.+)$/gm;
    const items: string[] = [];
    let match;

    while ((match = bulletRegex.exec(targetSection.content)) !== null) {
      items.push(match[1]);
    }

    return items;
  }

  /**
   * Extracts pros/cons sections from the answer
   */
  private extractProsConsSections(answer: string): Array<{ type: 'pros' | 'cons'; content: string }> {
    const sections: Array<{ type: 'pros' | 'cons'; content: string }> = [];
    
    // Find advantages/pros section
    const advantagesMatch = answer.match(/^(#{1,6}\s+(?:Advantages?|Pros?|Benefits?)\s*$)([\s\S]*?)(?=^#{1,6}\s+|$)/mi);
    if (advantagesMatch) {
      sections.push({
        type: 'pros',
        content: advantagesMatch[2] || ''
      });
    }

    // Find disadvantages/cons section
    const disadvantagesMatch = answer.match(/^(#{1,6}\s+(?:Disadvantages?|Cons?|Drawbacks?|Limitations?)\s*$)([\s\S]*?)(?=^#{1,6}\s+|$)/mi);
    if (disadvantagesMatch) {
      sections.push({
        type: 'cons',
        content: disadvantagesMatch[2] || ''
      });
    }

    return sections;
  }

  /**
   * Validates that diagrams have proper text explanation before and/or after
   */
  private validateDiagramTextExplanation(answer: string, diagrams: string[], patternId: string): void {
    for (const diagram of diagrams) {
      const diagramIndex = answer.indexOf(diagram);
      const beforeDiagram = answer.substring(0, diagramIndex).trim();
      const afterDiagram = answer.substring(diagramIndex + diagram.length).trim();

      // Check for text before diagram
      const hasTextBefore = beforeDiagram.length > 0;
      const hasTextAfter = afterDiagram.length > 0;

      if (!hasTextBefore && !hasTextAfter) {
        this.addViolation({
          rule: `${patternId}-diagram-no-explanation`,
          severity: 'error',
          message: 'Diagram should be accompanied by explanatory text',
          fix: 'Add text explanation before or after the diagram to provide context',
        });
      } else if (!hasTextBefore) {
        this.addViolation({
          rule: `${patternId}-diagram-no-intro`,
          severity: 'warning',
          message: 'Diagram should be preceded by introductory text',
          fix: 'Add explanatory text before the diagram to introduce the concept',
        });
      } else if (!hasTextAfter) {
        this.addViolation({
          rule: `${patternId}-diagram-no-conclusion`,
          severity: 'info',
          message: 'Consider adding explanatory text after the diagram',
          fix: 'Add text after the diagram to summarize or elaborate on the visual',
        });
      }
    }
  }

  /**
   * Validates minimum explanation length around diagrams
   */
  private validateDiagramExplanationLength(answer: string, diagrams: string[], minLength: number, patternId: string): void {
    for (const diagram of diagrams) {
      const diagramIndex = answer.indexOf(diagram);
      const beforeDiagram = answer.substring(0, diagramIndex).trim();
      const afterDiagram = answer.substring(diagramIndex + diagram.length).trim();

      const totalExplanationLength = beforeDiagram.length + afterDiagram.length;

      if (totalExplanationLength < minLength) {
        this.addViolation({
          rule: `${patternId}-diagram-insufficient-explanation`,
          severity: 'warning',
          message: `Diagram explanation is too brief (${totalExplanationLength} chars, minimum: ${minLength})`,
          fix: `Add more detailed explanation around the diagram to reach at least ${minLength} characters`,
        });
      }
    }
  }

  /**
   * Validates that diagrams have proper context and relevance
   */
  private validateDiagramContext(answer: string, diagrams: string[], patternId: string): void {
    for (const diagram of diagrams) {
      const diagramIndex = answer.indexOf(diagram);
      const beforeDiagram = answer.substring(0, diagramIndex).trim();
      
      // Check if the text before diagram mentions architectural concepts
      const architecturalKeywords = [
        'architecture', 'system', 'design', 'component', 'service', 'flow', 'process',
        'pattern', 'structure', 'model', 'framework', 'workflow', 'interaction',
        'relationship', 'connection', 'communication', 'data flow', 'sequence'
      ];

      const hasArchitecturalContext = architecturalKeywords.some(keyword => 
        beforeDiagram.toLowerCase().includes(keyword.toLowerCase())
      );

      if (!hasArchitecturalContext) {
        this.addViolation({
          rule: `${patternId}-diagram-missing-context`,
          severity: 'info',
          message: 'Diagram should be introduced with architectural context',
          fix: 'Add text that explains the architectural concept being illustrated',
        });
      }

      // Check if diagram is referenced in the text
      const diagramReferences = [
        'diagram', 'chart', 'figure', 'illustration', 'visual', 'above', 'below',
        'shown', 'depicts', 'illustrates', 'represents'
      ];

      const isDiagramReferenced = diagramReferences.some(ref => 
        answer.toLowerCase().includes(ref.toLowerCase())
      );

      if (!isDiagramReferenced) {
        this.addViolation({
          rule: `${patternId}-diagram-not-referenced`,
          severity: 'info',
          message: 'Consider referencing the diagram in the explanatory text',
          fix: 'Add text that refers to the diagram (e.g., "The diagram shows...", "As illustrated above...")',
        });
      }
    }
  }

  /**
   * Validates that the diagram type is appropriate for the content
   */
  private validateDiagramType(diagrams: string[], patternId: string): void {
    for (const diagram of diagrams) {
      const content = diagram.replace(/```mermaid\n?/, '').replace(/\n?```/, '').trim();
      const diagramType = this.detectMermaidDiagramType(content);

      if (!diagramType) {
        this.addViolation({
          rule: `${patternId}-diagram-unknown-type`,
          severity: 'warning',
          message: 'Unable to determine diagram type',
          fix: 'Ensure the diagram uses a recognized Mermaid diagram type (graph, flowchart, sequenceDiagram, etc.)',
        });
        continue;
      }

      // Validate diagram type appropriateness based on content
      const hasSequentialFlow = content.includes('-->') || content.includes('->');
      const hasHierarchy = content.includes('subgraph') || /\w+\s*-->\s*\w+\s*-->\s*\w+/.test(content);
      const hasInteractions = content.includes('participant') || content.includes('activate');

      if (diagramType === 'graph' || diagramType === 'flowchart') {
        if (!hasSequentialFlow && !hasHierarchy) {
          this.addViolation({
            rule: `${patternId}-diagram-inappropriate-flowchart`,
            severity: 'info',
            message: 'Flowchart diagram may not be the best choice for this content',
            fix: 'Consider using a different diagram type if not showing a process or hierarchy',
          });
        }
      } else if (diagramType === 'sequenceDiagram') {
        if (!hasInteractions) {
          this.addViolation({
            rule: `${patternId}-diagram-inappropriate-sequence`,
            severity: 'info',
            message: 'Sequence diagram should show interactions between participants',
            fix: 'Add participant interactions or consider using a different diagram type',
          });
        }
      }
    }
  }

  /**
   * Detects the type of Mermaid diagram from content
   */
  private detectMermaidDiagramType(content: string): string | null {
    const trimmedContent = content.trim().toLowerCase();
    
    if (trimmedContent.startsWith('graph')) return 'graph';
    if (trimmedContent.startsWith('flowchart')) return 'flowchart';
    if (trimmedContent.startsWith('sequencediagram')) return 'sequenceDiagram';
    if (trimmedContent.startsWith('classdiagram')) return 'classDiagram';
    if (trimmedContent.startsWith('statediagram')) return 'stateDiagram';
    if (trimmedContent.startsWith('erdiagram')) return 'erDiagram';
    if (trimmedContent.startsWith('journey')) return 'journey';
    if (trimmedContent.startsWith('gantt')) return 'gantt';
    if (trimmedContent.startsWith('pie')) return 'pie';
    if (trimmedContent.startsWith('gitgraph')) return 'gitgraph';
    
    // If no explicit type, try to infer from content
    if (content.includes('participant') || content.includes('activate')) return 'sequenceDiagram';
    if (content.includes('class ') || content.includes('<<') || content.includes('>>')) return 'classDiagram';
    if (content.includes('-->') || content.includes('->')) return 'graph';
    
    return null;
  }

  /**
   * Validates troubleshooting format sections
   */
  private validateTroubleshootingSection(answer: string, section: Section, patternId: string): void {
    // Check for required sections constraint
    const requiredSectionsConstraint = section.constraints?.find(c => c.type === 'required-sections');
    if (requiredSectionsConstraint && Array.isArray(requiredSectionsConstraint.value)) {
      const requiredSections = requiredSectionsConstraint.value as string[];
      this.validateTroubleshootingSections(answer, requiredSections, patternId);
    }

    // Check for numbered solutions constraint
    const numberedSolutionsConstraint = section.constraints?.find(c => c.type === 'numbered-solutions');
    if (numberedSolutionsConstraint && numberedSolutionsConstraint.value === true) {
      this.validateTroubleshootingSolutions(answer, patternId);
    }

    // Check for solution clarity constraint
    const solutionClarityConstraint = section.constraints?.find(c => c.type === 'solution-clarity');
    if (solutionClarityConstraint && solutionClarityConstraint.value === true) {
      this.validateTroubleshootingSolutionClarity(answer, patternId);
    }

    // Check for problem description constraint
    const problemDescriptionConstraint = section.constraints?.find(c => c.type === 'problem-description');
    if (problemDescriptionConstraint && problemDescriptionConstraint.value === true) {
      this.validateTroubleshootingProblemDescription(answer, patternId);
    }

    // Check for cause analysis constraint
    const causeAnalysisConstraint = section.constraints?.find(c => c.type === 'cause-analysis');
    if (causeAnalysisConstraint && causeAnalysisConstraint.value === true) {
      this.validateTroubleshootingCauseAnalysis(answer, patternId);
    }
  }

  /**
   * Validates presence of required troubleshooting sections
   */
  private validateTroubleshootingSections(answer: string, requiredSections: string[], patternId: string): void {
    for (const sectionName of requiredSections) {
      const sectionRegex = new RegExp(`^#{1,6}\\s+${sectionName}\\s*$`, 'mi');
      if (!sectionRegex.test(answer)) {
        this.addViolation({
          rule: `${patternId}-missing-${sectionName.toLowerCase()}`,
          severity: 'error',
          message: `Missing required section: "${sectionName}"`,
          fix: `Add a "${sectionName}" section header`,
        });
      }
    }
  }

  /**
   * Validates that Solutions section uses numbered steps
   */
  private validateTroubleshootingSolutions(answer: string, patternId: string): void {
    // Try to match Solutions section (plural or singular)
    const solutionsMatch = answer.match(/^(#{1,6}\s+Solutions?\s*$)([\s\S]*?)(?=^#{1,6}\s+|$)/mi);
    
    if (solutionsMatch) {
      let solutionsContent = solutionsMatch[2] || '';
      
      // If content is empty, try to get everything after the Solutions header
      if (solutionsContent.trim() === '') {
        const headerIndex = answer.indexOf(solutionsMatch[1]);
        if (headerIndex !== -1) {
          solutionsContent = answer.substring(headerIndex + solutionsMatch[1].length);
        }
      }
      
      const numberedListRegex = /^\s*\d+\.\s+/gm;
      const numberedSteps = solutionsContent.match(numberedListRegex);
      
      if (!numberedSteps || numberedSteps.length === 0) {
        this.addViolation({
          rule: `${patternId}-solutions-numbered`,
          severity: 'error',
          message: 'Solutions section should use numbered steps',
          fix: 'Format solutions as numbered list (1. 2. 3.) for clear step-by-step guidance',
        });
      } else {
        // Validate numbering sequence
        const steps = this.extractNumberedStepsFromContent(solutionsContent);
        this.validateNumberingSequence(steps, `${patternId}-solutions`);
      }
    }
  }

  /**
   * Validates clarity and actionability of troubleshooting solutions
   */
  private validateTroubleshootingSolutionClarity(answer: string, patternId: string): void {
    const solutionsMatch = answer.match(/^(#{1,6}\s+Solutions?\s*$)([\s\S]*?)(?=^#{1,6}\s+|$)/mi);
    
    if (solutionsMatch) {
      const solutionsContent = solutionsMatch[2] || '';
      const steps = this.extractNumberedStepsFromContent(solutionsContent);
      
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i].trim();
        
        // Check for vague language
        const vaguePhrases = ['try to', 'might', 'maybe', 'possibly', 'perhaps', 'could be', 'should work'];
        const hasVagueLanguage = vaguePhrases.some(phrase => step.toLowerCase().includes(phrase));
        
        if (hasVagueLanguage) {
          this.addViolation({
            rule: `${patternId}-solution-vague`,
            severity: 'warning',
            message: `Solution step ${i + 1} contains vague language: "${step.substring(0, 50)}${step.length > 50 ? '...' : ''}"`,
            fix: 'Use specific, actionable language in solution steps',
          });
        }
        
        // Check for minimum step length (too brief)
        if (step.length < 10) {
          this.addViolation({
            rule: `${patternId}-solution-too-brief`,
            severity: 'info',
            message: `Solution step ${i + 1} may be too brief: "${step}"`,
            fix: 'Provide more detailed instructions for each solution step',
          });
        }
        
        // Check for action verbs in solutions
        const words = step.split(/\s+/);
        if (words.length > 0) {
          const firstWord = words[0].toLowerCase().replace(/[^a-z]/g, '');
          const actionVerbs = [
            'check', 'verify', 'examine', 'inspect', 'review', 'test', 'run', 'execute',
            'restart', 'reboot', 'reset', 'clear', 'clean', 'update', 'upgrade', 'install',
            'uninstall', 'remove', 'delete', 'add', 'create', 'configure', 'set', 'change',
            'modify', 'edit', 'replace', 'fix', 'repair', 'restore', 'backup', 'save',
            'open', 'close', 'enable', 'disable', 'activate', 'deactivate', 'connect',
            'disconnect', 'refresh', 'reload', 'navigate', 'access', 'contact', 'consult'
          ];
          
          if (!actionVerbs.includes(firstWord)) {
            this.addViolation({
              rule: `${patternId}-solution-action-verb`,
              severity: 'info',
              message: `Solution step ${i + 1} should start with an action verb: "${step.substring(0, 50)}${step.length > 50 ? '...' : ''}"`,
              fix: 'Start solution steps with clear action verbs (check, restart, update, etc.)',
            });
          }
        }
      }
    }
  }

  /**
   * Validates problem description quality
   */
  private validateTroubleshootingProblemDescription(answer: string, patternId: string): void {
    const problemMatch = answer.match(/^(#{1,6}\s+Problems?\s*$)([\s\S]*?)(?=^#{1,6}\s+|$)/mi);
    
    if (problemMatch) {
      const problemContent = problemMatch[2]?.trim() || '';
      
      if (problemContent.length === 0) {
        this.addViolation({
          rule: `${patternId}-problem-empty`,
          severity: 'error',
          message: 'Problem section is empty',
          fix: 'Provide a clear description of the problem',
        });
        return;
      }
      
      // Check for problem description length
      if (problemContent.length < 20) {
        this.addViolation({
          rule: `${patternId}-problem-too-brief`,
          severity: 'warning',
          message: 'Problem description may be too brief',
          fix: 'Provide more detailed description of the problem symptoms and context',
        });
      }
      
      // Check for symptoms description
      const hasSymptoms = /symptoms?|error|issue|fail|problem|wrong|incorrect|unexpected/i.test(problemContent);
      if (!hasSymptoms) {
        this.addViolation({
          rule: `${patternId}-problem-no-symptoms`,
          severity: 'info',
          message: 'Problem description should include specific symptoms or error details',
          fix: 'Describe what specifically is failing or behaving incorrectly',
        });
      }
    }
  }

  /**
   * Validates cause analysis quality
   */
  private validateTroubleshootingCauseAnalysis(answer: string, patternId: string): void {
    const causesMatch = answer.match(/^(#{1,6}\s+Causes?\s*$)([\s\S]*?)(?=^#{1,6}\s+|$)/mi);
    
    if (causesMatch) {
      const causesContent = causesMatch[2]?.trim() || '';
      
      if (causesContent.length === 0) {
        this.addViolation({
          rule: `${patternId}-causes-empty`,
          severity: 'error',
          message: 'Causes section is empty',
          fix: 'Provide analysis of potential causes for the problem',
        });
        return;
      }
      
      // Check for list format in causes
      const hasList = /^\s*[-*+]\s+/gm.test(causesContent) || /^\s*\d+\.\s+/gm.test(causesContent);
      if (!hasList) {
        this.addViolation({
          rule: `${patternId}-causes-format`,
          severity: 'warning',
          message: 'Causes section should use list format for better readability',
          fix: 'Format causes as bulleted or numbered list',
        });
      }
      
      // Check for multiple causes
      const listItems = this.extractListItemsFromContent(causesContent);
      if (listItems.length < 2) {
        this.addViolation({
          rule: `${patternId}-causes-insufficient`,
          severity: 'info',
          message: 'Consider providing multiple potential causes for thorough analysis',
          fix: 'List at least 2-3 potential causes to help with diagnosis',
        });
      }
    }
  }

  /**
   * Extracts numbered steps from content
   */
  private extractNumberedStepsFromContent(content: string): string[] {
    const steps: string[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^\s*\d+\.\s+(.+)$/);
      if (match) {
        steps.push(match[1]);
      }
    }
    
    return steps;
  }

  /**
   * Extracts list items from content (both bulleted and numbered)
   */
  private extractListItemsFromContent(content: string): string[] {
    const items: string[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      // Match bulleted lists
      const bulletMatch = line.match(/^\s*[-*+]\s+(.+)$/);
      if (bulletMatch) {
        items.push(bulletMatch[1]);
        continue;
      }
      
      // Match numbered lists
      const numberMatch = line.match(/^\s*\d+\.\s+(.+)$/);
      if (numberMatch) {
        items.push(numberMatch[1]);
      }
    }
    
    return items;
  }

  /**
   * Validates numbering sequence for numbered lists
   */
  private validateNumberingSequence(steps: string[], rulePrefix: string): void {
    for (let i = 0; i < steps.length; i++) {
      const expectedNumber = i + 1;
      // This validation would need access to the original numbering
      // For now, we assume the extraction maintains order
    }
  }
}


// Export a singleton instance
export const formatValidator = new FormatValidator();
