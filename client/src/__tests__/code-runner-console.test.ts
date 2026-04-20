import { describe, it, expect } from 'vitest';

// Extracted from code-runner.worker.js for unit testing
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a as object), keysB = Object.keys(b as object);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(k => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}

function runJavaScript(code: string, testCases: Array<{ input: Record<string, unknown>; expected: unknown; functionName: string }>) {
  const logs: string[] = [];
  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const { input, expected, functionName } = testCases[i];
    try {
      const fakeConsole = { log: (...args: unknown[]) => logs.push(args.map(String).join(' ')) };
      const args = Object.values(input);
      const fn = new Function('console', ...Object.keys(input), `${code}\nreturn ${functionName}(${Object.keys(input).join(',')});`);
      const actual = fn(fakeConsole, ...args);
      results.push({ testIndex: i, passed: deepEqual(actual, expected), input, expected, actual });
    } catch (err) {
      results.push({ testIndex: i, passed: false, input, expected, actual: undefined, error: (err as Error).message });
    }
  }

  return { results, stdout: logs.join('\n') };
}

describe('code-runner.worker.js — JavaScript console.log capture', () => {
  it('captures a single console.log message in stdout', () => {
    const code = `function greet(name) { console.log('Hello, ' + name); return name; }`;
    const { stdout } = runJavaScript(code, [{ input: { name: 'World' }, expected: 'World', functionName: 'greet' }]);
    expect(stdout).toBe('Hello, World');
  });

  it('captures multiple console.log calls across test cases', () => {
    const code = `function double(n) { console.log('input: ' + n); return n * 2; }`;
    const { stdout } = runJavaScript(code, [
      { input: { n: 2 }, expected: 4, functionName: 'double' },
      { input: { n: 5 }, expected: 10, functionName: 'double' },
    ]);
    expect(stdout).toBe('input: 2\ninput: 5');
  });

  it('stdout is empty when no console.log is called', () => {
    const code = `function add(a, b) { return a + b; }`;
    const { stdout } = runJavaScript(code, [{ input: { a: 1, b: 2 }, expected: 3, functionName: 'add' }]);
    expect(stdout).toBe('');
  });

  it('captures console.log with multiple arguments joined by space', () => {
    const code = `function tag(a, b) { console.log(a, b); return a + b; }`;
    const { stdout } = runJavaScript(code, [{ input: { a: 'foo', b: 'bar' }, expected: 'foobar', functionName: 'tag' }]);
    expect(stdout).toBe('foo bar');
  });
});
