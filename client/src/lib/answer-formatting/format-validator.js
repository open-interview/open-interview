/**
 * Format Validator - ES Module version for Node.js compatibility
 * 
 * Validates answers against format pattern requirements
 */

class FormatValidator {
  constructor() {
    this.currentViolations = [];
    this.currentSuggestions = [];
  }

  validate(answer, pattern) {
    this.currentViolations = [];
    this.currentSuggestions = [];

    if (!answer || !pattern) {
      return {
        isValid: true,
        score: 100,
        violations: [],
        suggestions: []
      };
    }

    console.log(`   Validating against pattern: ${pattern.id}`);

    // Apply pattern-specific validation
    switch (pattern.id) {
      case 'comparison':
      case 'comparison-table':
        this.validateComparison(answer);
        break;
      case 'definition':
        this.validateDefinition(answer);
        break;
      case 'list':
        this.validateList(answer);
        break;
      case 'process':
        this.validateProcess(answer);
        break;
      case 'code':
      case 'code-example':
        this.validateCode(answer);
        break;
      case 'pros-cons':
        this.validateProsCons(answer);
        break;
      case 'architecture':
        this.validateArchitecture(answer);
        break;
      case 'troubleshooting':
        this.validateTroubleshooting(answer);
        break;
      case 'best-practices':
        this.validateBestPractices(answer);
        break;
      default:
        console.log(`   Unknown pattern: ${pattern.id}`);
    }

    const score = this.calculateScore();
    const isValid = this.currentViolations.filter(v => v.severity === 'error').length === 0;

    console.log(`   Found ${this.currentViolations.length} violations, score: ${score}`);

    return {
      isValid,
      score,
      violations: [...this.currentViolations],
      suggestions: [...this.currentSuggestions]
    };
  }

  validateComparison(answer) {
    const hasTable = /\|.*\|/.test(answer) && /\|[-:]+\|/.test(answer);
    
    if (!hasTable) {
      this.addViolation({
        rule: 'comparison-table-required',
        severity: 'error',
        message: 'Comparison answers should include a markdown table',
        fix: 'Add a comparison table with features and options'
      });
    } else {
      // Check table structure
      const tableLines = answer.match(/\|.*\|/g) || [];
      if (tableLines.length < 3) {
        this.addViolation({
          rule: 'comparison-table-structure',
          severity: 'warning',
          message: 'Table should have header, separator, and data rows',
          fix: 'Ensure table has proper structure with headers and data'
        });
      }
      
      // Check for minimum columns
      const firstRow = tableLines[0] || '';
      const columnCount = (firstRow.match(/\|/g) || []).length - 1;
      if (columnCount < 2) {
        this.addViolation({
          rule: 'comparison-min-columns',
          severity: 'error',
          message: `Table has ${columnCount} columns, minimum required is 2`,
          fix: 'Add more columns for proper comparison'
        });
      }
    }
  }

  validateDefinition(answer) {
    const lines = answer.split('\n');
    const firstLine = lines[0]?.trim() || '';
    
    if (firstLine.length === 0) {
      this.addViolation({
        rule: 'definition-opening',
        severity: 'error',
        message: 'Definition should start with a clear opening sentence',
        fix: 'Add a concise definition sentence at the beginning'
      });
    }

    // Check for blank line after definition
    if (lines.length > 1 && lines[1].trim() !== '') {
      this.addViolation({
        rule: 'definition-blank-line',
        severity: 'warning',
        message: 'Definition should be followed by a blank line',
        fix: 'Add a blank line after the definition sentence'
      });
    }

    // Check for bulleted list
    const hasBulletList = /^\s*[-*+]\s+/gm.test(answer);
    if (!hasBulletList) {
      this.addViolation({
        rule: 'definition-characteristics',
        severity: 'error',
        message: 'Definition should include bulleted key characteristics',
        fix: 'Add a bulleted list of 3-5 key characteristics'
      });
    } else {
      // Count bullet points
      const bulletPoints = (answer.match(/^\s*[-*+]\s+/gm) || []).length;
      if (bulletPoints < 3) {
        this.addViolation({
          rule: 'definition-min-characteristics',
          severity: 'warning',
          message: `Definition has ${bulletPoints} characteristics, should have at least 3`,
          fix: 'Add more key characteristics (aim for 3-5)'
        });
      }
    }
  }

  validateList(answer) {
    const hasList = /^\s*[-*+]\s+/gm.test(answer) || /^\s*\d+\.\s+/gm.test(answer);
    
    if (!hasList) {
      this.addViolation({
        rule: 'list-format-required',
        severity: 'error',
        message: 'List answers should use bulleted or numbered format',
        fix: 'Format content as bulleted (-) or numbered (1.) list'
      });
    }
  }

  validateProcess(answer) {
    const hasNumberedList = /^\s*\d+\.\s+/gm.test(answer);
    
    if (!hasNumberedList) {
      this.addViolation({
        rule: 'process-numbered-steps',
        severity: 'error',
        message: 'Process answers should use numbered steps',
        fix: 'Format process as numbered steps (1. 2. 3.)'
      });
    } else {
      // Check for action verbs
      const steps = answer.match(/^\s*\d+\.\s+(.+)$/gm) || [];
      const actionVerbs = ['set', 'configure', 'add', 'run', 'deploy', 'test', 'create', 'build', 'install', 'start', 'stop', 'check', 'verify'];
      
      let stepsWithoutActionVerbs = 0;
      for (const step of steps) {
        const stepText = step.replace(/^\s*\d+\.\s+/, '').toLowerCase();
        const hasActionVerb = actionVerbs.some(verb => stepText.startsWith(verb));
        if (!hasActionVerb) {
          stepsWithoutActionVerbs++;
        }
      }
      
      if (stepsWithoutActionVerbs > 0) {
        this.addViolation({
          rule: 'process-action-verbs',
          severity: 'warning',
          message: `${stepsWithoutActionVerbs} steps don't start with action verbs`,
          fix: 'Start each step with clear action verbs (configure, run, deploy, etc.)'
        });
      }
      
      // Check minimum steps
      if (steps.length < 3) {
        this.addViolation({
          rule: 'process-min-steps',
          severity: 'info',
          message: `Process has ${steps.length} steps, consider adding more detail`,
          fix: 'Break down the process into more detailed steps'
        });
      }
    }
  }

  validateCode(answer) {
    const hasCodeBlock = /```[\s\S]*?```/g.test(answer);
    
    if (!hasCodeBlock) {
      this.addViolation({
        rule: 'code-block-required',
        severity: 'warning',
        message: 'Code answers should include code blocks',
        fix: 'Add code examples using ``` fenced blocks'
      });
    } else {
      // Check for language identifiers
      const codeBlocks = answer.match(/```[\s\S]*?```/g) || [];
      for (const block of codeBlocks) {
        if (!block.match(/```\w+/)) {
          this.addViolation({
            rule: 'code-language-identifier',
            severity: 'info',
            message: 'Code blocks should specify language',
            fix: 'Add language identifier (e.g., ```javascript)'
          });
          break;
        }
      }
    }
  }

  validateProsCons(answer) {
    const hasAdvantages = /advantages?|pros?|benefits?/i.test(answer);
    const hasDisadvantages = /disadvantages?|cons?|drawbacks?/i.test(answer);
    
    if (!hasAdvantages) {
      this.addViolation({
        rule: 'pros-cons-advantages',
        severity: 'error',
        message: 'Missing advantages/pros section',
        fix: 'Add an "Advantages" or "Pros" section'
      });
    }
    
    if (!hasDisadvantages) {
      this.addViolation({
        rule: 'pros-cons-disadvantages',
        severity: 'error',
        message: 'Missing disadvantages/cons section',
        fix: 'Add a "Disadvantages" or "Cons" section'
      });
    }
  }

  validateArchitecture(answer) {
    const hasDiagram = /```mermaid[\s\S]*?```/g.test(answer);
    
    if (!hasDiagram) {
      this.addViolation({
        rule: 'architecture-diagram-required',
        severity: 'error',
        message: 'Architecture answers should include a Mermaid diagram',
        fix: 'Add a Mermaid diagram using ```mermaid blocks'
      });
    }
  }

  validateTroubleshooting(answer) {
    const hasProblem = /problem|issue|error/i.test(answer);
    const hasSolutions = /solution|fix|resolve/i.test(answer);
    
    if (!hasProblem) {
      this.addViolation({
        rule: 'troubleshooting-problem',
        severity: 'warning',
        message: 'Should describe the problem clearly',
        fix: 'Add a clear problem description'
      });
    }
    
    if (!hasSolutions) {
      this.addViolation({
        rule: 'troubleshooting-solutions',
        severity: 'error',
        message: 'Should provide solutions or fixes',
        fix: 'Add numbered solution steps'
      });
    }
  }

  validateBestPractices(answer) {
    const hasList = /^\s*[-*+]\s+/gm.test(answer) || /^\s*\d+\.\s+/gm.test(answer);
    
    if (!hasList) {
      this.addViolation({
        rule: 'best-practices-list',
        severity: 'warning',
        message: 'Best practices should be formatted as a list',
        fix: 'Format practices as bulleted or numbered list'
      });
    }
  }

  addViolation(violation) {
    this.currentViolations.push(violation);
  }

  calculateScore() {
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

  getViolations() {
    return [...this.currentViolations];
  }

  getSuggestions() {
    return [...this.currentSuggestions];
  }
}

// Create singleton instance
const formatValidator = new FormatValidator();

export { formatValidator, FormatValidator };
export default formatValidator;