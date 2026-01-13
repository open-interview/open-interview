/**
 * Strict Validation Module for Bot System
 * 
 * Ensures all bots create only valid, well-formed questions
 * Prevents malformed data from entering the database
 */

/**
 * Validation rules for questions
 */
export const VALIDATION_RULES = {
  question: {
    minLength: 30,
    maxLength: 2000,
    required: true
  },
  answer: {
    minLength: 50,
    maxLength: 10000,
    required: true,
    // CRITICAL: Answer must be plain text, NOT JSON
    forbiddenPatterns: [
      /^\s*\[{/,  // Starts with JSON array
      /^\s*{/,    // Starts with JSON object
    ]
  },
  explanation: {
    minLength: 100,
    maxLength: 15000,
    required: true
  },
  channel: {
    required: true,
    pattern: /^[a-z0-9-]+$/
  },
  subChannel: {
    required: true,
    pattern: /^[a-z0-9-]+$/
  },
  difficulty: {
    required: true,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  tags: {
    required: true,
    minItems: 1,
    maxItems: 10
  }
};

/**
 * Forbidden content patterns
 */
const FORBIDDEN_PATTERNS = {
  placeholders: [
    /\bTODO\b/i,
    /\bFIXME\b/i,
    /\bTBD\b/i,
    /\bplaceholder\b/i,
    /lorem ipsum/i,
    /\[insert\s+/i,
    /\[add\s+/i,
    /example here/i,
    /needs work/i
  ],
  multipleChoiceInAnswer: [
    /^\s*\[{.*"id".*"text".*"isCorrect"/s,  // JSON array with options
    /^\s*\[{.*isCorrect.*}/s,                // JSON with isCorrect field
  ],
  irrelevant: [
    /how did the candidate/i,
    /tell me about yourself/i,
    /what are your strengths/i,
    /where do you see yourself/i,
    /why should we hire you/i
  ]
};

/**
 * Validate a question object
 * 
 * @param {Object} question - Question object to validate
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function validateQuestion(question) {
  const errors = [];
  
  // Check required fields
  if (!question) {
    return { isValid: false, errors: ['Question object is null or undefined'] };
  }
  
  // Validate question text
  if (!question.question || typeof question.question !== 'string') {
    errors.push('Question text is required and must be a string');
  } else {
    if (question.question.length < VALIDATION_RULES.question.minLength) {
      errors.push(`Question text too short (min ${VALIDATION_RULES.question.minLength} chars)`);
    }
    if (question.question.length > VALIDATION_RULES.question.maxLength) {
      errors.push(`Question text too long (max ${VALIDATION_RULES.question.maxLength} chars)`);
    }
  }
  
  // Validate answer - CRITICAL CHECK
  if (!question.answer || typeof question.answer !== 'string') {
    errors.push('Answer is required and must be a string');
  } else {
    if (question.answer.length < VALIDATION_RULES.answer.minLength) {
      errors.push(`Answer too short (min ${VALIDATION_RULES.answer.minLength} chars)`);
    }
    if (question.answer.length > VALIDATION_RULES.answer.maxLength) {
      errors.push(`Answer too long (max ${VALIDATION_RULES.answer.maxLength} chars)`);
    }
    
    // CRITICAL: Check for multiple-choice JSON in answer field
    for (const pattern of VALIDATION_RULES.answer.forbiddenPatterns) {
      if (pattern.test(question.answer)) {
        errors.push('CRITICAL: Answer contains JSON/multiple-choice format. Use plain text for answers. Multiple-choice questions belong in tests.json');
      }
    }
    
    // Check for multiple-choice patterns
    for (const pattern of FORBIDDEN_PATTERNS.multipleChoiceInAnswer) {
      if (pattern.test(question.answer)) {
        errors.push('CRITICAL: Answer contains multiple-choice options. This is WRONG FORMAT. Use plain text answers only.');
      }
    }
  }
  
  // Validate explanation
  if (!question.explanation || typeof question.explanation !== 'string') {
    errors.push('Explanation is required and must be a string');
  } else {
    if (question.explanation.length < VALIDATION_RULES.explanation.minLength) {
      errors.push(`Explanation too short (min ${VALIDATION_RULES.explanation.minLength} chars)`);
    }
  }
  
  // Validate channel
  if (!question.channel) {
    errors.push('Channel is required');
  } else if (!VALIDATION_RULES.channel.pattern.test(question.channel)) {
    errors.push('Channel must be lowercase alphanumeric with hyphens');
  }
  
  // Validate subChannel
  if (!question.subChannel) {
    errors.push('SubChannel is required');
  } else if (!VALIDATION_RULES.subChannel.pattern.test(question.subChannel)) {
    errors.push('SubChannel must be lowercase alphanumeric with hyphens');
  }
  
  // Validate difficulty
  if (!question.difficulty) {
    errors.push('Difficulty is required');
  } else if (!VALIDATION_RULES.difficulty.enum.includes(question.difficulty)) {
    errors.push(`Difficulty must be one of: ${VALIDATION_RULES.difficulty.enum.join(', ')}`);
  }
  
  // Validate tags
  if (!question.tags || !Array.isArray(question.tags)) {
    errors.push('Tags are required and must be an array');
  } else {
    if (question.tags.length < VALIDATION_RULES.tags.minItems) {
      errors.push(`At least ${VALIDATION_RULES.tags.minItems} tag required`);
    }
    if (question.tags.length > VALIDATION_RULES.tags.maxItems) {
      errors.push(`Maximum ${VALIDATION_RULES.tags.maxItems} tags allowed`);
    }
  }
  
  // Check for placeholder content
  const allText = `${question.question} ${question.answer} ${question.explanation}`;
  for (const pattern of FORBIDDEN_PATTERNS.placeholders) {
    if (pattern.test(allText)) {
      errors.push(`Contains placeholder content: ${pattern.source}`);
    }
  }
  
  // Check for irrelevant content
  for (const pattern of FORBIDDEN_PATTERNS.irrelevant) {
    if (pattern.test(question.question)) {
      errors.push(`Contains irrelevant behavioral question pattern: ${pattern.source}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate before database insert
 * Throws error if validation fails
 * 
 * @param {Object} question - Question to validate
 * @param {string} botName - Name of bot attempting insert
 * @throws {Error} If validation fails
 */
export function validateBeforeInsert(question, botName) {
  const validation = validateQuestion(question);
  
  if (!validation.isValid) {
    const errorMsg = `[${botName}] VALIDATION FAILED - Question rejected:\n` +
      validation.errors.map(e => `  ❌ ${e}`).join('\n') +
      `\n\nQuestion ID: ${question.id || 'unknown'}\n` +
      `Question: ${question.question?.substring(0, 100)}...`;
    
    throw new Error(errorMsg);
  }
  
  return true;
}

/**
 * Sanitize question data
 * Removes any JSON structures from answer field
 * 
 * @param {Object} question - Question to sanitize
 * @returns {Object} Sanitized question
 */
export function sanitizeQuestion(question) {
  const sanitized = { ...question };
  
  // If answer starts with JSON, extract first correct answer text
  if (sanitized.answer && (sanitized.answer.startsWith('[{') || sanitized.answer.startsWith('{'))) {
    try {
      const parsed = JSON.parse(sanitized.answer);
      if (Array.isArray(parsed)) {
        // Find correct answer
        const correctOption = parsed.find(opt => opt.isCorrect);
        if (correctOption && correctOption.text) {
          sanitized.answer = correctOption.text;
          sanitized._sanitized = true;
          sanitized._originalFormat = 'multiple-choice-json';
        }
      }
    } catch (e) {
      // If parsing fails, leave as is but mark for review
      sanitized._needsReview = true;
    }
  }
  
  return sanitized;
}

/**
 * Get validation summary for reporting
 */
export function getValidationSummary() {
  return {
    rules: VALIDATION_RULES,
    forbiddenPatterns: Object.keys(FORBIDDEN_PATTERNS),
    criticalChecks: [
      'No JSON in answer field',
      'No multiple-choice options in answer',
      'No placeholder content',
      'Minimum content length requirements',
      'Required fields present'
    ]
  };
}

export default {
  validateQuestion,
  validateBeforeInsert,
  sanitizeQuestion,
  getValidationSummary,
  VALIDATION_RULES,
  FORBIDDEN_PATTERNS
};
