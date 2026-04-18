export type Difficulty = 'easy' | 'medium' | 'hard';
export type Language = 'javascript' | 'python';
export type ChallengeStatus = 'unsolved' | 'attempted' | 'solved';

export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface TestCase {
  input: Record<string, any>;
  expected: any;
}

export interface StarterCode {
  javascript: string;
  python?: string;
}

export interface RexHints {
  level1: string;
  level2: string;
  level3: string;
}

export interface Challenge {
  id: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  estimatedMinutes: number;
  description: string;
  examples: Example[];
  starterCode: StarterCode;
  testCases: {
    visible: TestCase[];
    hidden: TestCase[];
  };
  editorial: string;
  rexHints: RexHints;
}

export interface ChallengeListItem {
  id: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  estimatedMinutes: number;
  status?: ChallengeStatus;
}

export interface TestResult {
  testIndex: number;
  passed: boolean;
  input: any;
  expected: any;
  actual: any;
  error?: string;
}

export interface RunResult {
  results: TestResult[];
  stdout: string;
  error?: string;
  executionTimeMs: number;
  allPassed: boolean;
  passCount: number;
  totalCount: number;
}
