export interface TestCase {
  input: Record<string, any>;
  expected: any;
  functionName: string;
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

let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker('/code-runner.worker.js');
    worker.onerror = () => { worker = null; };
  }
  return worker;
}

export function runCode(code: string, testCases: TestCase[], language: string): Promise<RunResult> {
  return new Promise((resolve) => {
    const start = performance.now();

    // Terminate stale worker and create fresh one per run to avoid state leakage
    if (worker) { worker.terminate(); worker = null; }
    const w = getWorker();

    const timer = setTimeout(() => {
      w.terminate();
      worker = null;
      resolve({
        results: [], stdout: '', error: 'Execution timed out (5s)',
        executionTimeMs: 5000, allPassed: false, passCount: 0, totalCount: testCases.length,
      });
    }, 5500);

    w.onmessage = (e) => {
      clearTimeout(timer);
      const { results, stdout, error } = e.data;
      const executionTimeMs = Math.round(performance.now() - start);
      const passCount = results.filter((r: TestResult) => r.passed).length;
      resolve({
        results, stdout, error,
        executionTimeMs,
        allPassed: passCount === testCases.length,
        passCount,
        totalCount: testCases.length,
      });
    };

    w.postMessage({ type: 'run', code, testCases, language });
  });
}
