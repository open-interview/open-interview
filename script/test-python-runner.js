#!/usr/bin/env node
/**
 * Tests the Python execution logic from code-runner.worker.js
 * using the FirstIndexOfTargetInUnsortedArray challenge.
 *
 * Replicates the worker's runPython() logic: test case input is a parsed
 * object (Record<string,any>), and the worker calls solve(*Object.values(input)).
 * We run the same wrapped Python code via subprocess instead of Pyodide.
 */

import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';

// Load raw challenge data
const challenges = JSON.parse(readFileSync('/home/runner/workspace/data/coding-challenges.json', 'utf8'));
const raw = challenges.find(c => c.title === 'FirstIndexOfTargetInUnsortedArray');
if (!raw) throw new Error('Challenge not found');

// Convert raw test cases to the format the worker receives:
// input: parsed object, expected: parsed value
const testCases = raw.testCases.map(tc => ({
  input: JSON.parse(tc.input),       // { array: [...], target: N }
  expected: JSON.parse(tc.expectedOutput),
  description: tc.description,
}));

// Replicate worker's runPython wrapping: solve(*Object.values(input))
function buildWrappedPython(code, input) {
  const inputJson = JSON.stringify(Object.values(input));
  return `
import json, sys
from io import StringIO
from collections.abc import Iterator, Iterable

_stdout_capture = StringIO()
sys.stdout = _stdout_capture

${code}

_args = json.loads('${inputJson.replace(/'/g, "\\'")}')
_result = solve(*_args)

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

print(json.dumps([_to_json(_result), _captured]))
`;
}

const tmpFile = join(tmpdir(), 'test-python-runner.py');

function runPython(code, input) {
  writeFileSync(tmpFile, buildWrappedPython(code, input));
  try {
    const out = execSync(`python3 ${tmpFile}`).toString().trim();
    const [actual] = JSON.parse(out);
    return { actual, error: null };
  } catch (e) {
    return { actual: undefined, error: e.stderr?.toString().trim() || String(e) };
  }
}

// The Python solution uses solve(param) with a dict — but the worker calls solve(*args).
// We need a solution that accepts positional args matching Object.values(input) order.
// Adapt the solution to match the worker's calling convention.
const solutionAdapted = `
def solve(array, target):
    for i, v in enumerate(array):
        if v == target:
            return i
    return -1
`;

const starterAdapted = `
def solve(array, target):
    # Your code here
    pass
`;

let passed = 0, failed = 0;

for (const [label, code] of [['starter (returns None)', starterAdapted], ['solution', solutionAdapted]]) {
  console.log(`\n--- ${label} ---`);
  for (const tc of testCases) {
    const { actual, error } = runPython(code, tc.input);
    const ok = actual === tc.expected;
    if (error) {
      console.log(`  [ERROR] ${tc.description}: ${error.split('\n').slice(-2).join(' ')}`);
      failed++;
    } else {
      console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${tc.description}: expected=${tc.expected}, got=${actual}`);
      ok ? passed++ : failed++;
    }
  }
}

unlinkSync(tmpFile);

console.log(`\nResults: ${passed} passed, ${failed} failed`);

// Verify solution passes all 4 test cases
const allPassed = testCases.every(tc => {
  const { actual } = runPython(solutionAdapted, tc.input);
  return actual === tc.expected;
});
unlinkSync(tmpFile);

if (!allPassed) { console.error('FAIL: solution did not pass all test cases'); process.exit(1); }
console.log('OK: Python execution verified — solution passes all test cases');
