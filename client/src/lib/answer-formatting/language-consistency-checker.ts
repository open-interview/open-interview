/**
 * Language Consistency Checker - Validates consistency across code examples in different languages
 * 
 * This module implements cross-language consistency validation that ensures
 * code examples in different programming languages follow the same structure,
 * have consistent explanations, and maintain proper language separation.
 */

import type {
  LanguageConsistencyChecker as ILanguageConsistencyChecker,
  ConsistencyResult,
  CodeExample,
  LanguageComparison,
} from './types';

export class LanguageConsistencyChecker implements ILanguageConsistencyChecker {
  /**
   * Checks consistency across multiple code examples in different languages
   */
  checkConsistency(answer: string): ConsistencyResult {
    const codeExamples = this.extractCodeExamples(answer);
    
    if (codeExamples.length < 2) {
      return {
        isConsistent: true,
        score: 100,
        violations: [],
        suggestions: [],
        languages: codeExamples.map(ex => ex.language),
        comparisons: []
      };
    }

    const violations: string[] = [];
    const suggestions: string[] = [];
    const comparisons: LanguageComparison[] = [];

    // Perform all comparisons in one pass to avoid duplicates
    for (let i = 0; i < codeExamples.length; i++) {
      for (let j = i + 1; j < codeExamples.length; j++) {
        const example1 = codeExamples[i];
        const example2 = codeExamples[j];
        
        // Perform comprehensive comparison
        const comparison = this.performComprehensiveComparison(example1, example2);
        comparisons.push(comparison);

        if (!comparison.isConsistent) {
          violations.push(
            `Inconsistency between ${example1.language} and ${example2.language}: ${comparison.differences.join(', ')}`
          );
          
          suggestions.push(
            `Ensure ${example1.language} and ${example2.language} examples are consistent in structure and functionality`
          );
        }
      }
    }

    // Check explanation consistency
    const explanationResult = this.checkExplanationConsistency(answer, codeExamples);
    violations.push(...explanationResult.violations);
    suggestions.push(...explanationResult.suggestions);

    // Check language separation
    const separationResult = this.checkLanguageSeparation(answer, codeExamples);
    violations.push(...separationResult.violations);
    suggestions.push(...separationResult.suggestions);

    // Calculate consistency score
    const score = this.calculateConsistencyScore(violations.length, codeExamples.length);
    const isConsistent = violations.length === 0;

    return {
      isConsistent,
      score,
      violations,
      suggestions,
      languages: codeExamples.map(ex => ex.language),
      comparisons
    };
  }

  /**
   * Extracts code examples from the answer text
   */
  private extractCodeExamples(answer: string): CodeExample[] {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const examples: CodeExample[] = [];
    let match;

    while ((match = codeBlockRegex.exec(answer)) !== null) {
      const language = match[1] || 'unknown';
      const code = match[2].trim();
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;

      if (code.length > 0) {
        examples.push({
          language: language.toLowerCase(),
          code,
          startIndex,
          endIndex,
          variables: this.extractVariables(code, language),
          functions: this.extractFunctions(code, language),
          structure: this.analyzeCodeStructure(code, language)
        });
      }
    }

    return examples;
  }

  /**
   * Performs comprehensive comparison between two code examples
   */
  private performComprehensiveComparison(example1: CodeExample, example2: CodeExample): LanguageComparison {
    const differences: string[] = [];
    
    // Structure comparison
    const structureComparison = this.compareStructures(example1, example2);
    differences.push(...structureComparison.differences);

    // Naming comparison
    const namingComparison = this.compareNaming(example1, example2);
    differences.push(...namingComparison.differences);

    // Functionality comparison
    const functionalityComparison = this.compareFunctionality(example1, example2);
    differences.push(...functionalityComparison.differences);

    // Calculate overall similarity
    const totalPossibleDifferences = 10; // Rough estimate of max differences
    const similarity = Math.max(0, 1 - (differences.length / totalPossibleDifferences));

    return {
      language1: example1.language,
      language2: example2.language,
      isConsistent: differences.length === 0,
      differences,
      similarity
    };
  }
  private checkStructureConsistency(examples: CodeExample[]): {
    violations: string[];
    suggestions: string[];
    comparisons: LanguageComparison[];
  } {
    const violations: string[] = [];
    const suggestions: string[] = [];
    const comparisons: LanguageComparison[] = [];

    if (examples.length < 2) return { violations, suggestions, comparisons };

    // Compare each pair of examples only once (avoid duplicates)
    for (let i = 0; i < examples.length; i++) {
      for (let j = i + 1; j < examples.length; j++) {
        const example1 = examples[i];
        const example2 = examples[j];
        
        const comparison = this.compareStructures(example1, example2);
        comparisons.push(comparison);

        if (!comparison.isConsistent) {
          violations.push(
            `Structure inconsistency between ${example1.language} and ${example2.language}: ${comparison.differences.join(', ')}`
          );
          
          suggestions.push(
            `Ensure ${example1.language} and ${example2.language} examples follow the same logical structure`
          );
        }
      }
    }

    return { violations, suggestions, comparisons };
  }

  /**
   * Checks explanation consistency across languages
   */
  private checkExplanationConsistency(answer: string, examples: CodeExample[]): {
    violations: string[];
    suggestions: string[];
  } {
    const violations: string[] = [];
    const suggestions: string[] = [];

    // Extract text explanations around each code block
    const explanations = examples.map(example => {
      const beforeCode = answer.substring(0, example.startIndex).trim();
      const afterCode = answer.substring(example.endIndex).trim();
      
      // Get the last paragraph before code and first paragraph after code
      const beforeParagraph = this.getLastParagraph(beforeCode);
      const afterParagraph = this.getFirstParagraph(afterCode);
      
      return {
        language: example.language,
        before: beforeParagraph,
        after: afterParagraph,
        total: beforeParagraph + ' ' + afterParagraph
      };
    });

    // Check if explanations are language-specific or generic
    const languageSpecificCount = explanations.filter(exp => 
      this.containsLanguageSpecificTerms(exp.total, exp.language)
    ).length;

    const genericCount = explanations.filter(exp => 
      !this.containsLanguageSpecificTerms(exp.total, exp.language)
    ).length;

    // If we have both language-specific and generic explanations, flag inconsistency
    if (languageSpecificCount > 0 && genericCount > 0) {
      violations.push(
        'Inconsistent explanation approach: some code examples have language-specific explanations while others are generic'
      );
      suggestions.push(
        'Use consistent explanation approach: either provide language-specific explanations for all examples or keep all explanations generic'
      );
    }

    // Check for missing explanations
    const missingExplanations = explanations.filter(exp => 
      exp.total.trim().length < 20
    );

    if (missingExplanations.length > 0) {
      violations.push(
        `Missing or insufficient explanations for ${missingExplanations.map(e => e.language).join(', ')} examples`
      );
      suggestions.push(
        'Provide adequate explanations for all code examples to maintain consistency'
      );
    }

    return { violations, suggestions };
  }

  /**
   * Checks proper separation between different language examples
   */
  private checkLanguageSeparation(answer: string, examples: CodeExample[]): {
    violations: string[];
    suggestions: string[];
  } {
    const violations: string[] = [];
    const suggestions: string[] = [];

    if (examples.length < 2) return { violations, suggestions };

    // Check spacing between code blocks
    for (let i = 0; i < examples.length - 1; i++) {
      const currentExample = examples[i];
      const nextExample = examples[i + 1];
      
      const textBetween = answer.substring(currentExample.endIndex, nextExample.startIndex);
      const linesBetween = textBetween.split('\n').length - 1;
      
      // Should have at least 2 lines between different language examples
      if (linesBetween < 2) {
        violations.push(
          `Insufficient separation between ${currentExample.language} and ${nextExample.language} examples`
        );
        suggestions.push(
          'Add more spacing or explanatory text between different language examples'
        );
      }
      
      // Check for language transition indicators
      const hasTransitionIndicator = this.hasLanguageTransition(textBetween, currentExample.language, nextExample.language);
      if (!hasTransitionIndicator && currentExample.language !== nextExample.language) {
        suggestions.push(
          `Consider adding transition text between ${currentExample.language} and ${nextExample.language} examples (e.g., "In ${nextExample.language}:", "The ${nextExample.language} equivalent:")`
        );
      }
    }

    return { violations, suggestions };
  }

  /**
   * Checks naming consistency across languages
   */
  private checkNamingConsistency(examples: CodeExample[]): {
    violations: string[];
    suggestions: string[];
    comparisons: LanguageComparison[];
  } {
    const violations: string[] = [];
    const suggestions: string[] = [];
    const comparisons: LanguageComparison[] = [];

    if (examples.length < 2) return { violations, suggestions, comparisons };

    // Compare variable and function names across languages (avoid duplicates)
    for (let i = 0; i < examples.length; i++) {
      for (let j = i + 1; j < examples.length; j++) {
        const example1 = examples[i];
        const example2 = examples[j];
        
        const namingComparison = this.compareNaming(example1, example2);
        comparisons.push(namingComparison);

        if (!namingComparison.isConsistent) {
          violations.push(
            `Naming inconsistency between ${example1.language} and ${example2.language}: ${namingComparison.differences.join(', ')}`
          );
          
          suggestions.push(
            `Use consistent naming patterns across ${example1.language} and ${example2.language} examples`
          );
        }
      }
    }

    return { violations, suggestions, comparisons };
  }

  /**
   * Checks functional consistency across languages
   */
  private checkFunctionalityConsistency(examples: CodeExample[]): {
    violations: string[];
    suggestions: string[];
    comparisons: LanguageComparison[];
  } {
    const violations: string[] = [];
    const suggestions: string[] = [];
    const comparisons: LanguageComparison[] = [];

    if (examples.length < 2) return { violations, suggestions, comparisons };

    // Compare functionality across languages (avoid duplicates)
    for (let i = 0; i < examples.length; i++) {
      for (let j = i + 1; j < examples.length; j++) {
        const example1 = examples[i];
        const example2 = examples[j];
        
        const functionalityComparison = this.compareFunctionality(example1, example2);
        comparisons.push(functionalityComparison);

        if (!functionalityComparison.isConsistent) {
          violations.push(
            `Functionality inconsistency between ${example1.language} and ${example2.language}: ${functionalityComparison.differences.join(', ')}`
          );
          
          suggestions.push(
            `Ensure ${example1.language} and ${example2.language} examples demonstrate the same functionality`
          );
        }
      }
    }

    return { violations, suggestions, comparisons };
  }

  /**
   * Extracts variables from code
   */
  private extractVariables(code: string, language: string): string[] {
    const variables: string[] = [];
    
    // Language-specific variable extraction patterns
    const patterns: Record<string, RegExp[]> = {
      javascript: [
        /(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
        /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g
      ],
      typescript: [
        /(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
        /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g
      ],
      python: [
        /([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g
      ],
      java: [
        /(?:int|String|boolean|double|float|long|char)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
        /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g
      ],
      csharp: [
        /(?:int|string|bool|double|float|long|char|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
        /([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g
      ]
    };

    const langPatterns = patterns[language] || patterns.javascript;
    
    for (const pattern of langPatterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(code)) !== null) {
        if (match[1] && !variables.includes(match[1])) {
          // Filter out common keywords and literals
          const variable = match[1];
          if (!['console', 'print', 'log', 'true', 'false', 'null', 'undefined'].includes(variable)) {
            variables.push(variable);
          }
        }
      }
    }

    return variables;
  }

  /**
   * Extracts functions from code
   */
  private extractFunctions(code: string, language: string): string[] {
    const functions: string[] = [];
    
    // Language-specific function extraction patterns
    const patterns: Record<string, RegExp[]> = {
      javascript: [
        /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
        /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:function|\([^)]*\)\s*=>)/g,
        /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:\([^)]*\)\s*=>|function)/g
      ],
      typescript: [
        /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
        /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:function|\([^)]*\)\s*=>)/g
      ],
      python: [
        /def\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
        /([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*lambda/g
      ],
      java: [
        /(?:public|private|protected)?\s*(?:static)?\s*\w+\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g
      ],
      csharp: [
        /(?:public|private|protected)?\s*(?:static)?\s*\w+\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g
      ]
    };

    const langPatterns = patterns[language] || patterns.javascript;
    
    for (const pattern of langPatterns) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        if (match[1] && !functions.includes(match[1])) {
          functions.push(match[1]);
        }
      }
    }

    return functions;
  }

  /**
   * Analyzes code structure
   */
  private analyzeCodeStructure(code: string, language: string): {
    hasClasses: boolean;
    hasFunctions: boolean;
    hasVariables: boolean;
    hasLoops: boolean;
    hasConditionals: boolean;
    lineCount: number;
  } {
    const lines = code.split('\n').filter(line => line.trim().length > 0);
    
    return {
      hasClasses: /class\s+\w+/i.test(code),
      hasFunctions: /(?:function|def|public|private)\s+\w+/i.test(code),
      hasVariables: /(?:var|let|const|int|string|=)/i.test(code),
      hasLoops: /(?:for|while|foreach)\s*\(/i.test(code),
      hasConditionals: /(?:if|switch|case)\s*\(/i.test(code),
      lineCount: lines.length
    };
  }

  /**
   * Compares structures between two code examples
   */
  private compareStructures(example1: CodeExample, example2: CodeExample): LanguageComparison {
    const differences: string[] = [];
    
    const struct1 = example1.structure;
    const struct2 = example2.structure;

    if (struct1.hasClasses !== struct2.hasClasses) {
      differences.push(`class usage differs (${example1.language}: ${struct1.hasClasses}, ${example2.language}: ${struct2.hasClasses})`);
    }

    if (struct1.hasFunctions !== struct2.hasFunctions) {
      differences.push(`function usage differs (${example1.language}: ${struct1.hasFunctions}, ${example2.language}: ${struct2.hasFunctions})`);
    }

    if (struct1.hasLoops !== struct2.hasLoops) {
      differences.push(`loop usage differs (${example1.language}: ${struct1.hasLoops}, ${example2.language}: ${struct2.hasLoops})`);
    }

    if (struct1.hasConditionals !== struct2.hasConditionals) {
      differences.push(`conditional usage differs (${example1.language}: ${struct1.hasConditionals}, ${example2.language}: ${struct2.hasConditionals})`);
    }

    // Check line count similarity (should be within 50% of each other)
    const lineCountRatio = Math.abs(struct1.lineCount - struct2.lineCount) / Math.max(struct1.lineCount, struct2.lineCount);
    if (lineCountRatio > 0.5) {
      differences.push(`significant line count difference (${example1.language}: ${struct1.lineCount}, ${example2.language}: ${struct2.lineCount})`);
    }

    return {
      language1: example1.language,
      language2: example2.language,
      isConsistent: differences.length === 0,
      differences,
      similarity: Math.max(0, 1 - (differences.length / 5)) // 5 possible differences
    };
  }

  /**
   * Compares naming between two code examples
   */
  private compareNaming(example1: CodeExample, example2: CodeExample): LanguageComparison {
    const differences: string[] = [];
    
    // Compare variable naming patterns
    const vars1 = example1.variables;
    const vars2 = example2.variables;
    
    if (vars1.length !== vars2.length) {
      differences.push(`different number of variables (${example1.language}: ${vars1.length}, ${example2.language}: ${vars2.length})`);
    }

    // Check for similar naming patterns (camelCase, snake_case, etc.)
    const namingStyle1 = this.detectNamingStyle(vars1);
    const namingStyle2 = this.detectNamingStyle(vars2);
    
    if (namingStyle1 !== namingStyle2 && vars1.length > 0 && vars2.length > 0) {
      differences.push(`different naming styles (${example1.language}: ${namingStyle1}, ${example2.language}: ${namingStyle2})`);
    }

    // Compare function naming
    const funcs1 = example1.functions;
    const funcs2 = example2.functions;
    
    if (funcs1.length !== funcs2.length) {
      differences.push(`different number of functions (${example1.language}: ${funcs1.length}, ${example2.language}: ${funcs2.length})`);
    }

    return {
      language1: example1.language,
      language2: example2.language,
      isConsistent: differences.length === 0,
      differences,
      similarity: Math.max(0, 1 - (differences.length / 4)) // 4 possible differences
    };
  }

  /**
   * Compares functionality between two code examples
   */
  private compareFunctionality(example1: CodeExample, example2: CodeExample): LanguageComparison {
    const differences: string[] = [];
    
    // This is a simplified functionality comparison
    // In a real implementation, this would involve more sophisticated analysis
    
    const struct1 = example1.structure;
    const struct2 = example2.structure;
    
    // Check if both examples have similar complexity
    const complexity1 = this.calculateComplexity(struct1);
    const complexity2 = this.calculateComplexity(struct2);
    
    if (Math.abs(complexity1 - complexity2) > 2) {
      differences.push(`significant complexity difference (${example1.language}: ${complexity1}, ${example2.language}: ${complexity2})`);
    }

    return {
      language1: example1.language,
      language2: example2.language,
      isConsistent: differences.length === 0,
      differences,
      similarity: Math.max(0, 1 - (differences.length / 1)) // 1 possible difference
    };
  }

  /**
   * Helper methods
   */
  private getLastParagraph(text: string): string {
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
    return paragraphs.length > 0 ? paragraphs[paragraphs.length - 1].trim() : '';
  }

  private getFirstParagraph(text: string): string {
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
    return paragraphs.length > 0 ? paragraphs[0].trim() : '';
  }

  private containsLanguageSpecificTerms(text: string, language: string): boolean {
    const languageTerms: Record<string, string[]> = {
      javascript: ['javascript', 'js', 'node', 'npm', 'react', 'vue', 'angular'],
      python: ['python', 'py', 'pip', 'django', 'flask', 'pandas'],
      java: ['java', 'jvm', 'spring', 'maven', 'gradle'],
      csharp: ['c#', 'csharp', '.net', 'dotnet', 'visual studio'],
      typescript: ['typescript', 'ts', 'angular', 'type']
    };

    const terms = languageTerms[language] || [];
    const lowerText = text.toLowerCase();
    
    return terms.some(term => lowerText.includes(term));
  }

  private hasLanguageTransition(text: string, fromLang: string, toLang: string): boolean {
    const lowerText = text.toLowerCase();
    const transitionPatterns = [
      `in ${toLang}`,
      `${toLang} equivalent`,
      `${toLang} version`,
      `using ${toLang}`,
      `${toLang}:`,
      'alternatively',
      'similarly',
      'in contrast'
    ];

    return transitionPatterns.some(pattern => lowerText.includes(pattern));
  }

  private detectNamingStyle(names: string[]): string {
    if (names.length === 0) return 'none';
    
    const camelCaseCount = names.filter(name => /^[a-z][a-zA-Z0-9]*$/.test(name)).length;
    const snakeCaseCount = names.filter(name => /^[a-z][a-z0-9_]*$/.test(name) && name.includes('_')).length;
    const pascalCaseCount = names.filter(name => /^[A-Z][a-zA-Z0-9]*$/.test(name)).length;
    
    if (camelCaseCount > snakeCaseCount && camelCaseCount > pascalCaseCount) return 'camelCase';
    if (snakeCaseCount > camelCaseCount && snakeCaseCount > pascalCaseCount) return 'snake_case';
    if (pascalCaseCount > camelCaseCount && pascalCaseCount > snakeCaseCount) return 'PascalCase';
    
    return 'mixed';
  }

  private calculateComplexity(structure: any): number {
    let complexity = 0;
    if (structure.hasClasses) complexity += 2;
    if (structure.hasFunctions) complexity += 2;
    if (structure.hasLoops) complexity += 1;
    if (structure.hasConditionals) complexity += 1;
    complexity += Math.floor(structure.lineCount / 5); // 1 point per 5 lines
    return complexity;
  }

  private calculateConsistencyScore(violationCount: number, exampleCount: number): number {
    if (violationCount === 0) return 100;
    
    // More lenient scoring - each violation reduces score by 15 points
    const penalty = violationCount * 15;
    
    return Math.max(0, 100 - penalty);
  }
}