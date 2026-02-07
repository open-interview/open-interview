/**
 * Question Selection Engine with RAG (Retrieval-Augmented Generation)
 * Intelligently selects questions based on user profile, performance, and goals
 */

import type {
  Question,
  QuestionFilter,
  UserProfile,
  Progress,
  RAGContext,
} from "@/types";

/**
 * Question repository - in a real app, this would be loaded from a database
 * or fetched from an API with caching
 */
class QuestionRepository {
  private questions: Map<string, Question> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // In a real app, this would load from IndexedDB or fetch from API
    // For now, we'll initialize with a minimal set for testing
    this.loadSampleQuestions();
    this.initialized = true;
  }

  private loadSampleQuestions(): void {
    const sampleQuestions: Question[] = [
      {
        id: "q1",
        question: "Explain how event delegation works in JavaScript.",
        answer:
          "Event delegation is a technique where you attach a single event listener to a parent element instead of individual listeners to multiple child elements. It works by leveraging event bubbling, where events triggered on child elements bubble up to parent elements. Benefits include: better performance with many elements, memory efficiency, and handling dynamically added elements.",
        explanation:
          "Event delegation is commonly used in modern JavaScript frameworks and is an important concept for frontend interviews.",
        difficulty: "intermediate",
        tags: ["javascript", "events", "dom", "performance"],
        channel: "frontend",
        companies: ["Google", "Meta", "Amazon", "Microsoft"],
        relevanceScore: 0.95,
        experienceLevelTags: ["mid", "senior"],
        voiceKeywords: [
          "event bubbling",
          "event capturing",
          "target",
          "currentTarget",
        ],
        voiceSuitable: true,
        status: "active",
        isNew: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: "q2",
        question: "What is the difference between == and === in JavaScript?",
        answer:
          "== performs type coercion before comparison (loose equality), while === checks both value and type (strict equality). Always use === to avoid unexpected type coercion bugs.",
        explanation:
          "This is a fundamental JavaScript question that tests understanding of the language.",
        difficulty: "beginner",
        tags: ["javascript", "basics", "operators"],
        channel: "frontend",
        companies: ["All companies"],
        relevanceScore: 0.9,
        experienceLevelTags: ["entry", "mid"],
        voiceKeywords: ["type coercion", "strict equality", "loose equality"],
        voiceSuitable: true,
        status: "active",
        isNew: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: "q3",
        question: "Explain the concept of closures in JavaScript.",
        answer:
          "A closure is the combination of a function bundled together with references to its surrounding state (lexical environment). Closures give you access to an outer function's scope from an inner function. Common use cases include data privacy, factory functions, and maintaining state in async operations.",
        explanation:
          "Closures are a fundamental concept in JavaScript and frequently asked in interviews.",
        difficulty: "intermediate",
        tags: ["javascript", "functions", "scope", "closure"],
        channel: "frontend",
        companies: ["Google", "Meta", "Netflix", "Uber"],
        relevanceScore: 0.98,
        experienceLevelTags: ["mid", "senior", "staff"],
        voiceKeywords: [
          "lexical scope",
          "outer function",
          "inner function",
          "data privacy",
        ],
        voiceSuitable: true,
        status: "active",
        isNew: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: "q4",
        question: "What is the event loop in JavaScript?",
        answer:
          "The event loop is a mechanism that allows JavaScript to perform non-blocking operations despite being single-threaded. It continuously checks the call stack and task queue, pushing callbacks from the queue to the stack when the stack is empty. This enables asynchronous operations like setTimeout, promises, and I/O operations.",
        explanation:
          "Understanding the event loop is crucial for understanding JavaScript's asynchronous behavior.",
        difficulty: "advanced",
        tags: ["javascript", "async", "event-loop", "concurrency"],
        channel: "frontend",
        companies: ["Google", "Meta", "Amazon", "Netflix"],
        relevanceScore: 0.97,
        experienceLevelTags: ["senior", "staff", "principal"],
        voiceKeywords: [
          "call stack",
          "task queue",
          "microtasks",
          "macrotasks",
          "asynchronous",
        ],
        voiceSuitable: true,
        status: "active",
        isNew: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: "q5",
        question: "Explain CSS specificity and how it works.",
        answer:
          "CSS specificity determines which styles are applied when multiple rules target the same element. Specificity is calculated based on: inline styles (1000), IDs (100), classes/attributes/pseudo-classes (10), and elements/pseudo-elements (1). The selector with the highest specificity wins. The !important declaration overrides all specificity.",
        explanation:
          "CSS specificity is important for debugging styling issues and writing maintainable CSS.",
        difficulty: "intermediate",
        tags: ["css", "specificity", "styling", "frontend"],
        channel: "frontend",
        companies: ["All companies"],
        relevanceScore: 0.85,
        experienceLevelTags: ["entry", "mid", "senior"],
        voiceKeywords: [
          "inline styles",
          "id selector",
          "class selector",
          "important",
        ],
        voiceSuitable: true,
        status: "active",
        isNew: false,
        createdAt: new Date().toISOString(),
      },
    ];

    sampleQuestions.forEach((q) => this.questions.set(q.id, q));
  }

  getById(id: string): Question | undefined {
    return this.questions.get(id);
  }

  getAll(): Question[] {
    return Array.from(this.questions.values());
  }

  searchByTag(tag: string): Question[] {
    return this.getAll().filter((q) => q.tags.includes(tag));
  }

  searchByCompany(company: string): Question[] {
    return this.getAll().filter((q) => q.companies.includes(company));
  }

  searchByDifficulty(difficulty: string): Question[] {
    return this.getAll().filter((q) => q.difficulty === difficulty);
  }

  addQuestion(question: Question): void {
    this.questions.set(question.id, question);
  }
}

// Singleton instance
const questionRepository = new QuestionRepository();

/**
 * Calculate relevance score for a question based on user profile
 */
function calculateRelevanceScore(
  question: Question,
  profile: UserProfile,
  userProgress: Progress[],
): number {
  let score = question.relevanceScore || 0.5;

  // Company match boost
  if (profile.targetCompanies.length > 0) {
    const companyMatch = profile.targetCompanies.some((c) =>
      question.companies.includes(c),
    );
    if (companyMatch) score += 0.2;
  }

  // Experience level match
  const levelMatch = question.experienceLevelTags.includes(
    profile.experienceLevel,
  );
  if (levelMatch) score += 0.15;

  // Role relevance (based on tags matching target role keywords)
  const roleKeywords = profile.targetRole.toLowerCase().split(/\s+/);
  const tagMatch = question.tags.some((tag) =>
    roleKeywords.some((keyword) => tag.toLowerCase().includes(keyword)),
  );
  if (tagMatch) score += 0.1;

  // Difficulty adaptation based on performance
  const progress = userProgress.find((p) => p.id === question.id);
  if (progress) {
    if (progress.mastered) {
      score -= 0.3; // Deprioritize mastered questions
    } else if (progress.status === "learning") {
      score += 0.1; // Prioritize questions being learned
    }

    // Boost weak questions for review
    if (progress.weakKeyPoints.length > 0) {
      score += 0.15;
    }
  } else {
    // New questions get a slight boost
    score += 0.05;
  }

  // Voice preference
  if (profile.voiceEnabled && question.voiceSuitable) {
    score += 0.05;
  }

  return Math.min(1, Math.max(0, score));
}

/**
 * Apply filters to question list
 */
function applyFilters(
  questions: Question[],
  filter: QuestionFilter,
): Question[] {
  return questions.filter((q) => {
    // Exclude specific IDs
    if (filter.excludeIds?.includes(q.id)) return false;

    // Difficulty filter - map between difficulty systems
    if (filter.difficulty && filter.difficulty !== "adaptive") {
      const difficultyMap: Record<string, string> = {
        easy: "beginner",
        medium: "intermediate",
        hard: "advanced",
      };
      const targetDifficulty = difficultyMap[filter.difficulty];
      if (targetDifficulty && q.difficulty !== targetDifficulty) return false;
    }

    // Experience level filter
    if (filter.experienceLevel) {
      if (!q.experienceLevelTags.includes(filter.experienceLevel)) {
        return false;
      }
    }

    // Tags filter
    if (filter.tags && filter.tags.length > 0) {
      const hasTag = filter.tags.some((tag) => q.tags.includes(tag));
      if (!hasTag) return false;
    }

    // Voice suitable filter
    if (filter.requireVoiceSuitable && !q.voiceSuitable) {
      return false;
    }

    return true;
  });
}

/**
 * Question Selection Engine
 */
export class QuestionSelectionEngine {
  private repository: QuestionRepository;

  constructor() {
    this.repository = questionRepository;
  }

  async initialize(): Promise<void> {
    await this.repository.initialize();
  }

  /**
   * Select questions using RAG (Retrieval-Augmented Generation) approach
   * This method retrieves relevant questions and ranks them intelligently
   */
  async selectQuestions(
    userProfile: UserProfile,
    userProgress: Progress[],
    options: {
      count?: number;
      filter?: QuestionFilter;
      includeReview?: boolean;
      prioritizeWeakPoints?: boolean;
    } = {},
  ): Promise<Question[]> {
    const {
      count = 5,
      filter = {},
      includeReview = true,
      prioritizeWeakPoints: _prioritizeWeakPoints = true,
    } = options;

    // Initialize repository if needed
    await this.initialize();

    // Get all questions
    let candidates = this.repository.getAll();

    // Apply filters
    candidates = applyFilters(candidates, filter);

    // Calculate relevance scores
    const scoredQuestions = candidates.map((question) => ({
      question,
      score: calculateRelevanceScore(question, userProfile, userProgress),
      progress: userProgress.find((p) => p.id === question.id),
    }));

    // Sort by relevance score
    scoredQuestions.sort((a, b) => b.score - a.score);

    // Apply diversification (avoid too many similar questions)
    const diversified = this.diversifySelection(scoredQuestions, count);

    // If including review, mix in due questions
    if (includeReview) {
      const dueQuestions = this.getDueForReview(
        scoredQuestions,
        userProgress,
        userProfile,
      );
      return this.mergeWithReviewQuestions(diversified, dueQuestions, count);
    }

    return diversified.map((sq) => sq.question);
  }

  /**
   * Diversify question selection to cover different topics
   */
  private diversifySelection(
    scoredQuestions: Array<{ question: Question; score: number }>,
    targetCount: number,
  ): Array<{ question: Question; score: number }> {
    const selected: Array<{ question: Question; score: number }> = [];
    const usedTags = new Set<string>();

    // First pass: pick high-scoring questions with different tags
    for (const sq of scoredQuestions) {
      if (selected.length >= targetCount) break;

      const hasNewTag = sq.question.tags.some((tag) => !usedTags.has(tag));
      if (hasNewTag || selected.length < targetCount / 2) {
        selected.push(sq);
        sq.question.tags.forEach((tag) => usedTags.add(tag));
      }
    }

    // Second pass: fill remaining slots with highest remaining scores
    for (const sq of scoredQuestions) {
      if (selected.length >= targetCount) break;
      if (!selected.find((s) => s.question.id === sq.question.id)) {
        selected.push(sq);
      }
    }

    return selected.slice(0, targetCount);
  }

  /**
   * Get questions that are due for review based on SRS
   */
  private getDueForReview(
    scoredQuestions: Array<{
      question: Question;
      score: number;
      progress?: Progress;
    }>,
    userProgress: Progress[],
    _userProfile: UserProfile,
  ): Question[] {
    const now = new Date();
    const dueProgress = userProgress.filter(
      (p) => p.nextReview <= now && !p.mastered,
    );

    return dueProgress
      .map(
        (p) => scoredQuestions.find((sq) => sq.question.id === p.id)?.question,
      )
      .filter((q): q is Question => q !== undefined);
  }

  /**
   * Merge new questions with review questions
   */
  private mergeWithReviewQuestions(
    newQuestions: Array<{ question: Question; score: number }>,
    reviewQuestions: Question[],
    targetCount: number,
  ): Question[] {
    const reviewCount = Math.min(
      reviewQuestions.length,
      Math.ceil(targetCount * 0.4),
    );
    const newCount = targetCount - reviewCount;

    const selectedReview = reviewQuestions.slice(0, reviewCount);
    const selectedNew = newQuestions
      .filter((sq) => !selectedReview.find((r) => r.id === sq.question.id))
      .slice(0, newCount);

    // Interleave review and new questions
    const result: Question[] = [];
    for (
      let i = 0;
      i < Math.max(selectedReview.length, selectedNew.length);
      i++
    ) {
      if (i < selectedReview.length) result.push(selectedReview[i]);
      if (i < selectedNew.length) result.push(selectedNew[i].question);
    }

    return result.slice(0, targetCount);
  }

  /**
   * Get a single next question for the user
   */
  async getNextQuestion(
    userProfile: UserProfile,
    userProgress: Progress[],
    filter?: QuestionFilter,
  ): Promise<Question | null> {
    const questions = await this.selectQuestions(userProfile, userProgress, {
      count: 1,
      filter,
    });
    return questions[0] || null;
  }

  /**
   * Get questions similar to a given question
   */
  async getSimilarQuestions(
    questionId: string,
    count: number = 3,
  ): Promise<Question[]> {
    const baseQuestion = this.repository.getById(questionId);
    if (!baseQuestion) return [];

    const allQuestions = this.repository
      .getAll()
      .filter((q) => q.id !== questionId);

    // Score by tag overlap
    const scored = allQuestions.map((q) => {
      const tagOverlap = q.tags.filter((tag) =>
        baseQuestion.tags.includes(tag),
      ).length;
      const difficultyMatch = q.difficulty === baseQuestion.difficulty ? 1 : 0;
      const score =
        tagOverlap / Math.max(q.tags.length, baseQuestion.tags.length) +
        difficultyMatch * 0.5;
      return { question: q, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, count).map((s) => s.question);
  }

  /**
   * Get question by ID
   */
  async getQuestionById(id: string): Promise<Question | null> {
    await this.initialize();
    return this.repository.getById(id) || null;
  }

  /**
   * Search questions by query string
   */
  async searchQuestions(query: string): Promise<Question[]> {
    await this.initialize();
    const allQuestions = this.repository.getAll();
    const lowerQuery = query.toLowerCase();

    return allQuestions.filter(
      (q) =>
        q.question.toLowerCase().includes(lowerQuery) ||
        q.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
        q.answer.toLowerCase().includes(lowerQuery),
    );
  }

  /**
   * Get RAG context for a question
   */
  async getRAGContext(questionId: string): Promise<RAGContext | null> {
    const question = await this.getQuestionById(questionId);
    if (!question) return null;

    return {
      questionId: question.id,
      relevanceScore: question.relevanceScore,
      context: question.explanation || question.answer.substring(0, 500),
      source: question.sourceUrl || "Interview Buddy Database",
    };
  }
}

// Export singleton instance
export const questionEngine = new QuestionSelectionEngine();

// Export utility functions
export { questionRepository, calculateRelevanceScore };
