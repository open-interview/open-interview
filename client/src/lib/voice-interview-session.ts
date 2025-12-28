/**
 * Voice Interview Session System
 * 
 * Breaks down complex interview questions into focused micro-questions
 * with 1-2 sentence expected answers for precise evaluation.
 * 
 * Session Flow:
 * 1. Main topic question (context setter)
 * 2. Series of 4-6 follow-up micro-questions
 * 3. Each micro-question has specific expected keywords/phrases
 * 4. Session score is aggregate of all micro-question scores
 */

// ============================================
// TYPES
// ============================================

export interface MicroQuestion {
  id: string;
  question: string;
  expectedAnswer: string;        // 1-2 sentence ideal answer
  keywords: string[];            // Must-mention terms (2-4 keywords)
  acceptablePhrases: string[];   // Alternative ways to express the answer
  difficulty: 'easy' | 'medium' | 'hard';
  order: number;
}

export interface VoiceSession {
  id: string;
  topic: string;                 // Main topic being covered
  channel: string;
  difficulty: string;
  contextQuestion: string;       // Opening question to set context
  microQuestions: MicroQuestion[];
  totalQuestions: number;
  sourceQuestionId?: string;     // Original question ID if generated from existing
}

export interface MicroAnswer {
  questionId: string;
  userAnswer: string;
  score: number;                 // 0-100
  keywordsCovered: string[];
  keywordsMissed: string[];
  isCorrect: boolean;            // Score >= 60
  feedback: string;
}

export interface SessionResult {
  sessionId: string;
  topic: string;
  answers: MicroAnswer[];
  overallScore: number;
  verdict: 'excellent' | 'good' | 'needs-work' | 'review-topic';
  summary: string;
  strengths: string[];
  areasToImprove: string[];
  completedAt: string;
}

export interface SessionState {
  session: VoiceSession;
  currentQuestionIndex: number;
  answers: MicroAnswer[];
  startedAt: string;
  status: 'intro' | 'in-progress' | 'completed';
}

// ============================================
// MICRO-QUESTION EVALUATION
// ============================================

/**
 * Evaluate a single micro-question answer
 * Simpler than full evaluation - just checks for keywords and basic correctness
 */
export function evaluateMicroAnswer(
  userAnswer: string,
  microQuestion: MicroQuestion
): MicroAnswer {
  const normalizedAnswer = userAnswer.toLowerCase().trim();
  const { keywords, acceptablePhrases, expectedAnswer } = microQuestion;
  
  // Check which keywords were covered
  const keywordsCovered: string[] = [];
  const keywordsMissed: string[] = [];
  
  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    if (normalizedAnswer.includes(keywordLower)) {
      keywordsCovered.push(keyword);
    } else {
      // Check for acceptable phrases that might cover this keyword
      const phraseMatch = acceptablePhrases.some(phrase => 
        normalizedAnswer.includes(phrase.toLowerCase())
      );
      if (phraseMatch) {
        keywordsCovered.push(keyword);
      } else {
        keywordsMissed.push(keyword);
      }
    }
  }
  
  // Calculate score based on keyword coverage
  const keywordScore = keywords.length > 0 
    ? (keywordsCovered.length / keywords.length) * 100 
    : 0;
  
  // Bonus for mentioning acceptable phrases
  const phraseBonus = acceptablePhrases.filter(phrase => 
    normalizedAnswer.includes(phrase.toLowerCase())
  ).length * 5;
  
  // Penalty for very short answers
  const wordCount = normalizedAnswer.split(/\s+/).length;
  const lengthPenalty = wordCount < 5 ? 20 : wordCount < 10 ? 10 : 0;
  
  // Calculate final score
  let score = Math.min(100, Math.max(0, keywordScore + phraseBonus - lengthPenalty));
  
  // Generate feedback
  const feedback = generateMicroFeedback(score, keywordsCovered, keywordsMissed, expectedAnswer);
  
  return {
    questionId: microQuestion.id,
    userAnswer,
    score: Math.round(score),
    keywordsCovered,
    keywordsMissed,
    isCorrect: score >= 60,
    feedback
  };
}

function generateMicroFeedback(
  score: number,
  covered: string[],
  missed: string[],
  expectedAnswer: string
): string {
  if (score >= 80) {
    return "Excellent! You covered the key points well.";
  } else if (score >= 60) {
    if (missed.length > 0) {
      return `Good answer! Consider also mentioning: ${missed.slice(0, 2).join(', ')}.`;
    }
    return "Good answer with the main concepts covered.";
  } else if (score >= 40) {
    return `Partial answer. Key points to include: ${missed.slice(0, 2).join(', ')}.`;
  } else {
    return `The expected answer covers: ${expectedAnswer.substring(0, 100)}...`;
  }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Start a new voice interview session
 */
export function startSession(session: VoiceSession): SessionState {
  return {
    session,
    currentQuestionIndex: 0,
    answers: [],
    startedAt: new Date().toISOString(),
    status: 'intro'
  };
}

/**
 * Move to the next question in the session
 */
export function nextQuestion(state: SessionState): SessionState {
  if (state.currentQuestionIndex >= state.session.microQuestions.length - 1) {
    return { ...state, status: 'completed' };
  }
  
  return {
    ...state,
    currentQuestionIndex: state.currentQuestionIndex + 1,
    status: 'in-progress'
  };
}

/**
 * Submit an answer for the current question
 */
export function submitAnswer(state: SessionState, userAnswer: string): SessionState {
  const currentQuestion = state.session.microQuestions[state.currentQuestionIndex];
  const evaluation = evaluateMicroAnswer(userAnswer, currentQuestion);
  
  return {
    ...state,
    answers: [...state.answers, evaluation],
    status: state.currentQuestionIndex >= state.session.microQuestions.length - 1 
      ? 'completed' 
      : 'in-progress'
  };
}

/**
 * Get the current question
 */
export function getCurrentQuestion(state: SessionState): MicroQuestion | null {
  if (state.status === 'completed') return null;
  return state.session.microQuestions[state.currentQuestionIndex] || null;
}

/**
 * Calculate final session results
 */
export function completeSession(state: SessionState): SessionResult {
  const { session, answers } = state;
  
  // Calculate overall score
  const totalScore = answers.reduce((sum, a) => sum + a.score, 0);
  const overallScore = answers.length > 0 ? Math.round(totalScore / answers.length) : 0;
  
  // Determine verdict
  let verdict: SessionResult['verdict'];
  if (overallScore >= 80) verdict = 'excellent';
  else if (overallScore >= 60) verdict = 'good';
  else if (overallScore >= 40) verdict = 'needs-work';
  else verdict = 'review-topic';
  
  // Collect all missed keywords
  const allMissed = answers.flatMap(a => a.keywordsMissed);
  const uniqueMissed = [...new Set(allMissed)];
  
  // Collect all covered keywords
  const allCovered = answers.flatMap(a => a.keywordsCovered);
  const uniqueCovered = [...new Set(allCovered)];
  
  // Generate strengths
  const strengths: string[] = [];
  const correctCount = answers.filter(a => a.isCorrect).length;
  if (correctCount === answers.length) {
    strengths.push("Answered all questions correctly!");
  } else if (correctCount >= answers.length * 0.7) {
    strengths.push(`Strong performance on ${correctCount}/${answers.length} questions`);
  }
  if (uniqueCovered.length >= 5) {
    strengths.push(`Good coverage of key concepts: ${uniqueCovered.slice(0, 3).join(', ')}`);
  }
  
  // Generate areas to improve
  const areasToImprove: string[] = [];
  if (uniqueMissed.length > 0) {
    areasToImprove.push(`Review these concepts: ${uniqueMissed.slice(0, 4).join(', ')}`);
  }
  const lowScoreQuestions = answers.filter(a => a.score < 50);
  if (lowScoreQuestions.length > 0) {
    areasToImprove.push(`Practice more on ${lowScoreQuestions.length} challenging questions`);
  }
  
  // Generate summary
  const summary = generateSessionSummary(overallScore, correctCount, answers.length, session.topic);
  
  return {
    sessionId: session.id,
    topic: session.topic,
    answers,
    overallScore,
    verdict,
    summary,
    strengths,
    areasToImprove,
    completedAt: new Date().toISOString()
  };
}

function generateSessionSummary(
  score: number, 
  correct: number, 
  total: number, 
  topic: string
): string {
  if (score >= 80) {
    return `Excellent understanding of ${topic}! You answered ${correct}/${total} questions correctly with strong technical depth.`;
  } else if (score >= 60) {
    return `Good grasp of ${topic}. You got ${correct}/${total} correct. A bit more practice will solidify your knowledge.`;
  } else if (score >= 40) {
    return `You have a basic understanding of ${topic} (${correct}/${total} correct). Review the missed concepts and try again.`;
  } else {
    return `${topic} needs more study. You scored ${correct}/${total}. Review the fundamentals and practice with the detailed explanations.`;
  }
}

// ============================================
// SESSION GENERATION FROM QUESTIONS
// ============================================

/**
 * Generate a voice session from an existing question
 * This creates micro-questions from the question's voiceKeywords
 */
export function generateSessionFromQuestion(
  question: {
    id: string;
    question: string;
    answer: string;
    explanation: string;
    channel: string;
    difficulty: string;
    voiceKeywords?: string[];
  }
): VoiceSession | null {
  const keywords = question.voiceKeywords || [];
  
  // Need at least 4 keywords to create a meaningful session
  if (keywords.length < 4) {
    return null;
  }
  
  // Group keywords into micro-questions (2-3 keywords each)
  const microQuestions: MicroQuestion[] = [];
  const keywordGroups = chunkArray(keywords, 2);
  
  keywordGroups.forEach((group, index) => {
    const microQ = createMicroQuestion(
      question.id,
      index,
      group,
      question.answer,
      question.explanation,
      question.channel
    );
    if (microQ) {
      microQuestions.push(microQ);
    }
  });
  
  if (microQuestions.length < 3) {
    return null;
  }
  
  return {
    id: `session-${question.id}`,
    topic: extractTopic(question.question),
    channel: question.channel,
    difficulty: question.difficulty,
    contextQuestion: question.question,
    microQuestions: microQuestions.slice(0, 6), // Max 6 micro-questions
    totalQuestions: Math.min(microQuestions.length, 6),
    sourceQuestionId: question.id
  };
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function extractTopic(question: string): string {
  // Extract main topic from question
  const cleaned = question
    .replace(/^(what|how|why|when|explain|describe|tell me about)\s+/i, '')
    .replace(/\?$/, '')
    .trim();
  
  // Take first 50 chars or until first comma/period
  const endIndex = Math.min(
    cleaned.length,
    50,
    cleaned.indexOf(',') > 0 ? cleaned.indexOf(',') : cleaned.length,
    cleaned.indexOf('.') > 0 ? cleaned.indexOf('.') : cleaned.length
  );
  
  return cleaned.substring(0, endIndex).trim();
}

function createMicroQuestion(
  questionId: string,
  index: number,
  keywords: string[],
  answer: string,
  explanation: string,
  channel: string
): MicroQuestion | null {
  // Generate question based on keywords
  const questionTemplates = getQuestionTemplates(channel);
  const template = questionTemplates[index % questionTemplates.length];
  
  const microQuestion = template.replace('{keywords}', keywords.join(' and '));
  
  // Extract expected answer from the explanation that relates to these keywords
  const expectedAnswer = extractRelevantAnswer(keywords, answer, explanation);
  
  // Generate acceptable phrases
  const acceptablePhrases = generateAcceptablePhrases(keywords);
  
  return {
    id: `${questionId}-micro-${index + 1}`,
    question: microQuestion,
    expectedAnswer,
    keywords,
    acceptablePhrases,
    difficulty: index < 2 ? 'easy' : index < 4 ? 'medium' : 'hard',
    order: index + 1
  };
}

function getQuestionTemplates(channel: string): string[] {
  const templates: Record<string, string[]> = {
    'system-design': [
      "What is the purpose of {keywords} in system design?",
      "How does {keywords} help with scalability?",
      "When would you use {keywords}?",
      "What are the trade-offs of {keywords}?",
      "How do {keywords} work together?",
      "What problems does {keywords} solve?"
    ],
    'behavioral': [
      "Describe a situation involving {keywords}.",
      "How did you handle {keywords}?",
      "What was the outcome of {keywords}?",
      "What did you learn about {keywords}?",
      "How would you approach {keywords} differently?",
      "Give an example of {keywords}."
    ],
    'devops': [
      "What is {keywords} used for?",
      "How do you implement {keywords}?",
      "What are the benefits of {keywords}?",
      "How does {keywords} improve reliability?",
      "When should you use {keywords}?",
      "What tools support {keywords}?"
    ],
    'sre': [
      "How does {keywords} affect reliability?",
      "What metrics relate to {keywords}?",
      "How do you monitor {keywords}?",
      "What's the impact of {keywords} on SLOs?",
      "How do you troubleshoot {keywords}?",
      "What's the relationship between {keywords}?"
    ],
    'default': [
      "What is {keywords}?",
      "How does {keywords} work?",
      "Why is {keywords} important?",
      "When would you use {keywords}?",
      "What are the benefits of {keywords}?",
      "Explain {keywords} briefly."
    ]
  };
  
  return templates[channel] || templates['default'];
}

function extractRelevantAnswer(
  keywords: string[],
  answer: string,
  explanation: string
): string {
  const fullText = `${answer} ${explanation}`.toLowerCase();
  const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  // Find sentences that contain the keywords
  const relevantSentences = sentences.filter(sentence => 
    keywords.some(kw => sentence.includes(kw.toLowerCase()))
  );
  
  if (relevantSentences.length > 0) {
    // Return first 1-2 relevant sentences
    return relevantSentences.slice(0, 2).join('. ').trim() + '.';
  }
  
  // Fallback: return first sentence of answer
  return answer.split(/[.!?]+/)[0].trim() + '.';
}

function generateAcceptablePhrases(keywords: string[]): string[] {
  const phrases: string[] = [];
  
  // Add common variations
  for (const keyword of keywords) {
    const kw = keyword.toLowerCase();
    
    // Plural/singular variations
    if (kw.endsWith('s')) {
      phrases.push(kw.slice(0, -1));
    } else {
      phrases.push(kw + 's');
    }
    
    // Common abbreviations
    const abbreviations: Record<string, string[]> = {
      'kubernetes': ['k8s', 'kube'],
      'continuous integration': ['ci', 'ci/cd'],
      'continuous deployment': ['cd', 'ci/cd'],
      'load balancer': ['lb', 'load balancing'],
      'database': ['db', 'data store'],
      'availability': ['uptime', 'high availability', 'ha'],
      'latency': ['response time', 'delay'],
      'throughput': ['bandwidth', 'capacity'],
      'microservices': ['micro services', 'microservice'],
      'authentication': ['auth', 'authn'],
      'authorization': ['authz', 'permissions']
    };
    
    if (abbreviations[kw]) {
      phrases.push(...abbreviations[kw]);
    }
  }
  
  return [...new Set(phrases)];
}

// ============================================
// STORAGE HELPERS
// ============================================

const SESSION_STORAGE_KEY = 'voice-session-state';
const SESSION_HISTORY_KEY = 'voice-session-history';

/**
 * Save current session state to localStorage
 */
export function saveSessionState(state: SessionState): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save session state:', e);
  }
}

/**
 * Load session state from localStorage
 */
export function loadSessionState(): SessionState | null {
  try {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error('Failed to load session state:', e);
    return null;
  }
}

/**
 * Clear current session state
 */
export function clearSessionState(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear session state:', e);
  }
}

/**
 * Save completed session to history
 */
export function saveSessionToHistory(result: SessionResult): void {
  try {
    const history = getSessionHistory();
    history.unshift(result);
    // Keep only last 20 sessions
    const trimmed = history.slice(0, 20);
    localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save session to history:', e);
  }
}

/**
 * Get session history
 */
export function getSessionHistory(): SessionResult[] {
  try {
    const saved = localStorage.getItem(SESSION_HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Failed to load session history:', e);
    return [];
  }
}
