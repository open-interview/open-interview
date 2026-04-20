/**
 * Tests for code-runner.worker.js Python error handling.
 * Verifies that runtime exceptions raised in Python code are captured
 * and reported correctly in the result's `error` field.
 *
 * Because the worker file uses importScripts/self (Web Worker globals),
 * we test the runPython logic directly by re-implementing it here with
 * a mocked Pyodide instance.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Minimal deep-equal (mirrors worker implementation) ──────────────────────
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(k => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}

// ── Minimal runPython (mirrors worker implementation) ────────────────────────
type TestCase = { input: Record<string, unknown>; expected: unknown; functionName: string };
type RunResult = { results: unknown[]; stdout: string; error?: string };

async function runPython(
  pyodide: { runPythonAsync: (code: string) => Promise<unknown> },
  code: string,
  testCases: TestCase[],
): Promise<RunResult> {
  const logs: string[] = [];
  const results: unknown[] = [];

  for (let i = 0; i < testCases.length; i++) {
    const { input, expected, functionName } = testCases[i];
    try {
      const inputJson = JSON.stringify(Object.values(input));
      const wrappedCode = `
import json, sys
from io import StringIO
from collections.abc import Iterator, Iterable

_stdout_capture = StringIO()
sys.stdout = _stdout_capture

${code}

_args = json.loads(${JSON.stringify(inputJson)})
_result = ${functionName}(*_args)

sys.stdout = sys.__stdout__
_captured = _stdout_capture.getvalue()

def _to_json(obj):
    if obj is None: return None
    if isinstance(obj, bool): return obj
    if isinstance(obj, (int, float, str)): return obj
    if isinstance(obj, (list, tuple)): return [_to_json(x) for x in obj]
    if isinstance(obj, dict): return {str(k): _to_json(v) for k, v in obj.items()}
    if isinstance(obj, Iterator): return [_to_json(x) for x in obj]
    if isinstance(obj, Iterable) and not isinstance(obj, (str, bytes)): return [_to_json(x) for x in obj]
    return str(obj)

json.dumps([_to_json(_result), _captured])
`;
      const raw = await pyodide.runPythonAsync(wrappedCode);
      const [actual, captured] = JSON.parse(String(raw));
      if (captured) logs.push(captured.trimEnd());
      results.push({ testIndex: i, passed: deepEqual(actual, expected), input, expected, actual });
    } catch (err) {
      results.push({ testIndex: i, passed: false, input, expected, actual: undefined, error: String(err) });
    }
  }

  return { results, stdout: logs.join('\n') };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a mock pyodide that throws the given error string when runPythonAsync is called. */
function mockPyodideError(errorMessage: string) {
  return { runPythonAsync: vi.fn().mockRejectedValue(new Error(errorMessage)) };
}

/** Build a mock pyodide that returns a successful JSON result. */
function mockPyodideSuccess(result: unknown, stdout = '') {
  return {
    runPythonAsync: vi.fn().mockResolvedValue(JSON.stringify([result, stdout])),
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('code-runner.worker – Python error handling', () => {
  const testCase: TestCase = {
    input: { n: 5 },
    expected: 120,
    functionName: 'factorial',
  };

  describe('runtime exceptions are captured per test case', () => {
    it('captures a ZeroDivisionError', async () => {
      const pyodide = mockPyodideError('PythonError: ZeroDivisionError: division by zero');
      const { results } = await runPython(pyodide, 'def factorial(n): return 1/0', [testCase]);

      expect(results).toHaveLength(1);
      const r = results[0] as { passed: boolean; error: string };
      expect(r.passed).toBe(false);
      expect(r.error).toContain('ZeroDivisionError');
    });

    it('captures a NameError (undefined variable)', async () => {
      const pyodide = mockPyodideError('PythonError: NameError: name "undefined_var" is not defined');
      const { results } = await runPython(pyodide, 'def factorial(n): return undefined_var', [testCase]);

      const r = results[0] as { passed: boolean; error: string };
      expect(r.passed).toBe(false);
      expect(r.error).toContain('NameError');
    });

    it('captures a TypeError (wrong argument type)', async () => {
      const pyodide = mockPyodideError("PythonError: TypeError: unsupported operand type(s) for +: 'int' and 'str'");
      const { results } = await runPython(pyodide, 'def factorial(n): return n + "x"', [testCase]);

      const r = results[0] as { passed: boolean; error: string };
      expect(r.passed).toBe(false);
      expect(r.error).toContain('TypeError');
    });

    it('captures a ValueError', async () => {
      const pyodide = mockPyodideError('PythonError: ValueError: invalid literal for int()');
      const { results } = await runPython(pyodide, 'def factorial(n): return int("abc")', [testCase]);

      const r = results[0] as { passed: boolean; error: string };
      expect(r.passed).toBe(false);
      expect(r.error).toContain('ValueError');
    });

    it('captures a RecursionError (infinite recursion)', async () => {
      const pyodide = mockPyodideError('PythonError: RecursionError: maximum recursion depth exceeded');
      const { results } = await runPython(pyodide, 'def factorial(n): return factorial(n)', [testCase]);

      const r = results[0] as { passed: boolean; error: string };
      expect(r.passed).toBe(false);
      expect(r.error).toContain('RecursionError');
    });

    it('captures an explicit raise statement', async () => {
      const pyodide = mockPyodideError('PythonError: RuntimeError: something went wrong');
      const { results } = await runPython(
        pyodide,
        'def factorial(n): raise RuntimeError("something went wrong")',
        [testCase],
      );

      const r = results[0] as { passed: boolean; error: string };
      expect(r.passed).toBe(false);
      expect(r.error).toContain('RuntimeError');
      expect(r.error).toContain('something went wrong');
    });
  });

  describe('error isolation across multiple test cases', () => {
    it('marks only the failing test case; passing cases are unaffected', async () => {
      const cases: TestCase[] = [
        { input: { n: 1 }, expected: 1, functionName: 'factorial' },
        { input: { n: 2 }, expected: 2, functionName: 'factorial' },
      ];

      const pyodide = {
        runPythonAsync: vi
          .fn()
          .mockResolvedValueOnce(JSON.stringify([1, '']))   // case 0 passes
          .mockRejectedValueOnce(new Error('PythonError: ZeroDivisionError: division by zero')), // case 1 fails
      };

      const { results } = await runPython(pyodide, 'def factorial(n): ...', cases);

      expect(results).toHaveLength(2);
      const [pass, fail] = results as [
        { passed: boolean; error?: string },
        { passed: boolean; error?: string },
      ];
      expect(pass.passed).toBe(true);
      expect(pass.error).toBeUndefined();
      expect(fail.passed).toBe(false);
      expect(fail.error).toContain('ZeroDivisionError');
    });
  });

  describe('error field contains the full error string', () => {
    it('stores String(err) so non-Error throws are also captured', async () => {
      const pyodide = { runPythonAsync: vi.fn().mockRejectedValue('raw string error') };
      const { results } = await runPython(pyodide, 'def factorial(n): ...', [testCase]);

      const r = results[0] as { error: string };
      expect(r.error).toBe('raw string error');
    });
  });

  describe('successful execution is not affected', () => {
    it('returns passed=true and correct actual value when no error', async () => {
      const pyodide = mockPyodideSuccess(120);
      const { results } = await runPython(pyodide, 'def factorial(n): ...', [testCase]);

      const r = results[0] as { passed: boolean; actual: unknown; error?: string };
      expect(r.passed).toBe(true);
      expect(r.actual).toBe(120);
      expect(r.error).toBeUndefined();
    });
  });
});
