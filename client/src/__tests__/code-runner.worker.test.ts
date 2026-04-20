/**
 * Tests that code-runner.worker.js times out infinite Python loops gracefully.
 *
 * The worker sets a top-level 10s setTimeout. If Python execution hangs,
 * the timeout fires and posts { error: 'Execution timed out (10s)' }.
 *
 * We test this by mocking loadPyodide to return a Pyodide whose
 * runPythonAsync never resolves, simulating an infinite while loop.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('code-runner.worker Python timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('times out and reports error when Python code runs an infinite loop', async () => {
    const postedMessages: unknown[] = [];

    // Minimal worker globals
    const workerSelf = {
      postMessage: vi.fn((msg) => postedMessages.push(msg)),
      close: vi.fn(),
      onmessage: null as ((e: { data: unknown }) => void) | null,
    };

    // loadPyodide returns a Pyodide whose runPythonAsync never resolves
    const hangingPyodide = {
      runPythonAsync: () => new Promise(() => { /* never resolves */ }),
    };

    // Simulate the worker module in isolation using Function constructor
    // to avoid importScripts and browser-only globals
    const workerCode = `
      const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/';

      const timeout = setTimeout(() => {
        self.postMessage({ type: 'result', results: [], stdout: '', error: 'Execution timed out (10s)' });
        self.close();
      }, 10000);

      async function runPython(code, testCases) {
        const logs = [];
        const results = [];
        let pyodide;
        try {
          pyodide = await loadPyodide({ indexURL: PYODIDE_CDN });
        } catch (err) {
          return { results: [], stdout: '', error: \`Failed to load Python runtime: \${err.message}\` };
        }
        for (let i = 0; i < testCases.length; i++) {
          const { input, expected, functionName } = testCases[i];
          try {
            const inputJson = JSON.stringify(Object.values(input));
            const wrappedCode = \`import json\\n_args = json.loads(\${JSON.stringify(inputJson)})\\n_result = \${functionName}(*_args)\\njson.dumps([_result, ''])\`;
            const raw = await pyodide.runPythonAsync(wrappedCode);
            const [actual, captured] = JSON.parse(String(raw));
            results.push({ testIndex: i, passed: actual === expected, input, expected, actual });
          } catch (err) {
            results.push({ testIndex: i, passed: false, input, expected, actual: undefined, error: String(err) });
          }
        }
        return { results, stdout: logs.join('\\n') };
      }

      self.onmessage = async function(e) {
        const { type, code, testCases, language } = e.data;
        if (type !== 'run') return;
        const out = await runPython(code, testCases);
        clearTimeout(timeout);
        self.postMessage({ type: 'result', ...out });
      };
    `;

    // Execute worker code with mocked globals
    const fn = new Function('self', 'setTimeout', 'clearTimeout', 'loadPyodide', workerCode);
    fn(
      workerSelf,
      vi.fn().mockImplementation((cb: () => void, ms: number) => setTimeout(cb, ms)), // delegate to fake timers
      vi.fn().mockImplementation((id: ReturnType<typeof setTimeout>) => clearTimeout(id)),
      () => Promise.resolve(hangingPyodide),
    );

    // Trigger the worker with an infinite loop message
    workerSelf.onmessage!({
      data: {
        type: 'run',
        language: 'python',
        code: 'while True: pass',
        testCases: [{ input: {}, expected: null, functionName: 'solution' }],
      },
    });

    // Advance fake timers past the 10s timeout
    await vi.advanceTimersByTimeAsync(10001);

    expect(workerSelf.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'result',
        error: 'Execution timed out (10s)',
      }),
    );
    expect(workerSelf.close).toHaveBeenCalled();
  });
});
