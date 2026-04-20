/**
 * Unit tests for code-runner.worker.js — Python stdout capture
 *
 * Verifies that print() output from Python code is captured and returned
 * in the `stdout` field of the result.
 *
 * Strategy: extract runPython by evaluating the worker source with mocked
 * globals (importScripts, loadPyodide, self) so no browser/Pyodide runtime
 * is needed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal Pyodide mock that executes the wrapped Python-like template literally
 *  by simulating what the real Pyodide would return for the stdout capture block.
 */
function makePyodideMock(capturedOutput: string, returnValue: unknown) {
  return {
    runPythonAsync: vi.fn(async (_code: string) => {
      // The worker calls JSON.parse(String(raw)) expecting [result, captured]
      return JSON.stringify([returnValue, capturedOutput]);
    }),
  };
}

/** Load and evaluate the worker source, injecting mock globals, and return
 *  the `runPython` function extracted from the module scope.
 */
function loadWorkerRunPython(pyodideMock: ReturnType<typeof makePyodideMock>) {
  const workerSrc = readFileSync(
    join(process.cwd(), 'client/public/code-runner.worker.js'),
    'utf8',
  );

  // Patch out the timeout and self.postMessage/onmessage — we only need runPython
  const patchedSrc = workerSrc
    .replace(/const timeout = setTimeout[\s\S]*?\}, 10000\);/, '')
    .replace(/self\.onmessage[\s\S]*$/, '');

  // Build a sandboxed function that exposes runPython via a returned object
  const factory = new Function(
    'importScripts',
    'loadPyodide',
    'self',
    `${patchedSrc}\nreturn { runPython };`,
  );

  const importScripts = vi.fn(); // no-op; loadPyodide is injected directly
  const loadPyodide = vi.fn(async () => pyodideMock);
  const self = { postMessage: vi.fn(), close: vi.fn() };

  return factory(importScripts, loadPyodide, self) as {
    runPython: (code: string, testCases: unknown[]) => Promise<{ results: unknown[]; stdout: string; error?: string }>;
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('code-runner.worker.js — Python stdout capture', () => {
  const testCase = {
    input: { n: 5 },
    expected: 5,
    functionName: 'identity',
  };

  it('captures a single print() call in stdout', async () => {
    const mock = makePyodideMock('hello from python\n', 5);
    const { runPython } = loadWorkerRunPython(mock);

    const code = `def identity(n):\n    print("hello from python")\n    return n`;
    const { stdout, results } = await runPython(code, [testCase]);

    expect(stdout).toBe('hello from python');
    expect(results).toHaveLength(1);
    expect((results[0] as { passed: boolean }).passed).toBe(true);
  });

  it('captures multiple print() calls joined by newline', async () => {
    const mock = makePyodideMock('line1\nline2\nline3\n', 5);
    const { runPython } = loadWorkerRunPython(mock);

    const code = `def identity(n):\n    print("line1")\n    print("line2")\n    print("line3")\n    return n`;
    const { stdout } = await runPython(code, [testCase]);

    expect(stdout).toBe('line1\nline2\nline3');
  });

  it('returns empty stdout when there are no print() calls', async () => {
    const mock = makePyodideMock('', 5);
    const { runPython } = loadWorkerRunPython(mock);

    const code = `def identity(n):\n    return n`;
    const { stdout } = await runPython(code, [testCase]);

    expect(stdout).toBe('');
  });

  it('accumulates stdout across multiple test cases', async () => {
    // Two test cases, each producing one line of output
    const pyodideMock = {
      runPythonAsync: vi.fn()
        .mockResolvedValueOnce(JSON.stringify([1, 'case 0\n']))
        .mockResolvedValueOnce(JSON.stringify([2, 'case 1\n'])),
    };

    const workerSrc = readFileSync(
      join(process.cwd(), 'client/public/code-runner.worker.js'),
      'utf8',
    );
    const patchedSrc = workerSrc
      .replace(/const timeout = setTimeout[\s\S]*?\}, 10000\);/, '')
      .replace(/self\.onmessage[\s\S]*$/, '');

    const factory = new Function('importScripts', 'loadPyodide', 'self', `${patchedSrc}\nreturn { runPython };`);
    const { runPython } = factory(vi.fn(), vi.fn(async () => pyodideMock), { postMessage: vi.fn(), close: vi.fn() }) as {
      runPython: (code: string, testCases: unknown[]) => Promise<{ stdout: string; results: unknown[] }>;
    };

    const { stdout } = await runPython('def f(n): return n', [
      { input: { n: 1 }, expected: 1, functionName: 'f' },
      { input: { n: 2 }, expected: 2, functionName: 'f' },
    ]);

    expect(stdout).toBe('case 0\ncase 1');
  });

  it('returns error when Pyodide fails to load', async () => {
    const workerSrc = readFileSync(
      join(process.cwd(), 'client/public/code-runner.worker.js'),
      'utf8',
    );
    const patchedSrc = workerSrc
      .replace(/const timeout = setTimeout[\s\S]*?\}, 10000\);/, '')
      .replace(/self\.onmessage[\s\S]*$/, '');

    const factory = new Function('importScripts', 'loadPyodide', 'self', `${patchedSrc}\nreturn { runPython };`);
    const loadPyodide = vi.fn(async () => { throw new Error('network error'); });
    const { runPython } = factory(vi.fn(), loadPyodide, { postMessage: vi.fn(), close: vi.fn() }) as {
      runPython: (code: string, testCases: unknown[]) => Promise<{ stdout: string; results: unknown[]; error?: string }>;
    };

    const result = await runPython('def f(n): return n', [testCase]);

    expect(result.error).toMatch(/Failed to load Python runtime/);
    expect(result.stdout).toBe('');
    expect(result.results).toHaveLength(0);
  });
});
