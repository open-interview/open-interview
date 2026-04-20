/**
 * Edge case tests for code-runner.worker.js
 * Run with: node client/public/code-runner.worker.test.js
 */

// ── Extract functions under test (worker uses self/importScripts, not module exports) ──

function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a), keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(k => deepEqual(a[k], b[k]));
}

function runJavaScript(code, testCases) {
  const logs = [];
  const results = [];
  for (let i = 0; i < testCases.length; i++) {
    const { input, expected, functionName } = testCases[i];
    try {
      const fakeConsole = { log: (...args) => logs.push(args.map(String).join(' ')) };
      const args = Object.values(input);
      const fn = new Function('console', ...Object.keys(input), `${code}\nreturn ${functionName}(${Object.keys(input).join(',')});`);
      const actual = fn(fakeConsole, ...args);
      results.push({ testIndex: i, passed: deepEqual(actual, expected), input, expected, actual });
    } catch (err) {
      results.push({ testIndex: i, passed: false, input, expected, actual: undefined, error: err.message });
    }
  }
  return { results, stdout: logs.join('\n') };
}

// ── Minimal test harness ──

let passed = 0, failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

function describe(name, fn) {
  console.log(`\n${name}`);
  fn();
}

// ── deepEqual edge cases ──

describe('deepEqual – primitives & null', () => {
  assert(deepEqual(null, null),           'null === null');
  assert(!deepEqual(null, undefined),     'null !== undefined');
  assert(!deepEqual(null, 0),             'null !== 0');
  assert(deepEqual(0, 0),                 '0 === 0');
  assert(deepEqual('', ''),               '"" === ""');
  assert(!deepEqual('a', 'b'),            '"a" !== "b"');
  // NaN !== NaN in JS — deepEqual inherits this: NaN === NaN is false, then
  // typeof NaN is 'number' (not 'object'), so the object branch is skipped and
  // the function returns false. Document the actual behaviour.
  assert(!deepEqual(NaN, NaN),            'NaN !== NaN (JS identity; deepEqual does not special-case NaN)');
});

describe('deepEqual – arrays', () => {
  assert(deepEqual([], []),               'empty arrays');
  assert(deepEqual([1, 2, 3], [1, 2, 3]), 'equal arrays');
  assert(!deepEqual([1], [1, 2]),         'different lengths');
  assert(!deepEqual([1, null], [1, 0]),   'null vs 0 inside array');
  assert(deepEqual([[1], [2]], [[1], [2]]), 'nested arrays');
  assert(!deepEqual([], {}),              'array !== object');
});

describe('deepEqual – objects', () => {
  assert(deepEqual({}, {}),                         'empty objects');
  assert(deepEqual({ a: 1 }, { a: 1 }),             'simple equal');
  assert(!deepEqual({ a: 1 }, { a: 2 }),            'different values');
  assert(!deepEqual({ a: 1 }, { b: 1 }),            'different keys');
  assert(deepEqual({ a: { b: null } }, { a: { b: null } }), 'nested null value');
  assert(!deepEqual({ a: 1, b: 2 }, { a: 1 }),      'extra key');
});

describe('deepEqual – complex nested', () => {
  const x = { users: [{ id: 1, tags: ['a', null] }, { id: 2, tags: [] }] };
  const y = { users: [{ id: 1, tags: ['a', null] }, { id: 2, tags: [] }] };
  const z = { users: [{ id: 1, tags: ['a', null] }, { id: 2, tags: [0] }] };
  assert(deepEqual(x, y),  'deep nested match');
  assert(!deepEqual(x, z), 'deep nested mismatch');
});

// ── runJavaScript edge cases ──

describe('runJavaScript – empty array input/output', () => {
  const code = 'function identity(arr) { return arr; }';
  const { results } = runJavaScript(code, [
    { functionName: 'identity', input: { arr: [] }, expected: [] },
  ]);
  assert(results[0].passed, 'empty array round-trips correctly');
});

describe('runJavaScript – null input and output', () => {
  const code = 'function returnNull(x) { return x === null ? null : x; }';
  const { results } = runJavaScript(code, [
    { functionName: 'returnNull', input: { x: null }, expected: null },
    { functionName: 'returnNull', input: { x: 1 },    expected: 1 },
  ]);
  assert(results[0].passed, 'null input → null output');
  assert(results[1].passed, 'non-null input passes through');
});

describe('runJavaScript – complex nested object', () => {
  const code = `
function transform(obj) {
  return { ...obj, extra: obj.items.length };
}`;
  const input = { items: [1, null, { a: 2 }], meta: { active: true } };
  const expected = { items: [1, null, { a: 2 }], meta: { active: true }, extra: 3 };
  const { results } = runJavaScript(code, [
    { functionName: 'transform', input: { obj: input }, expected },
  ]);
  assert(results[0].passed, 'nested object with null element transforms correctly');
});

describe('runJavaScript – multiple test cases, mixed pass/fail', () => {
  const code = 'function add(a, b) { return a + b; }';
  const { results } = runJavaScript(code, [
    { functionName: 'add', input: { a: 1, b: 2 }, expected: 3 },
    { functionName: 'add', input: { a: 0, b: 0 }, expected: 0 },
    { functionName: 'add', input: { a: -1, b: 1 }, expected: 0 },
    { functionName: 'add', input: { a: 1, b: 2 }, expected: 99 }, // intentional fail
  ]);
  assert(results[0].passed,  'positive numbers');
  assert(results[1].passed,  'zeros');
  assert(results[2].passed,  'negatives cancel');
  assert(!results[3].passed, 'wrong expected correctly fails');
});

describe('runJavaScript – runtime error captured per test case', () => {
  const code = 'function boom(x) { throw new Error("oops"); }';
  const { results } = runJavaScript(code, [
    { functionName: 'boom', input: { x: 1 }, expected: null },
  ]);
  assert(!results[0].passed,          'thrown error marks test as failed');
  assert(results[0].error === 'oops', 'error message captured');
});

describe('runJavaScript – console.log captured in stdout', () => {
  const code = 'function greet(name) { console.log("hello", name); return name; }';
  const { results, stdout } = runJavaScript(code, [
    { functionName: 'greet', input: { name: 'world' }, expected: 'world' },
  ]);
  assert(results[0].passed,          'return value still checked');
  assert(stdout === 'hello world',   'stdout captured correctly');
});

describe('runJavaScript – empty testCases array', () => {
  const { results, stdout } = runJavaScript('function f() {}', []);
  assert(results.length === 0, 'no results for empty test cases');
  assert(stdout === '',        'empty stdout');
});

describe('runJavaScript – array of nulls', () => {
  const code = 'function countNulls(arr) { return arr.filter(x => x === null).length; }';
  const { results } = runJavaScript(code, [
    { functionName: 'countNulls', input: { arr: [null, null, 1, null] }, expected: 3 },
    { functionName: 'countNulls', input: { arr: [] },                    expected: 0 },
  ]);
  assert(results[0].passed, 'counts nulls in array');
  assert(results[1].passed, 'empty array has 0 nulls');
});

// ── Summary ──

console.log(`\n${'─'.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
