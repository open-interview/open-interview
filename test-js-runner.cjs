// Minimal test: verifies runJavaScript logic from code-runner.worker.js
// using the FirstIndexOfTargetInUnsortedArray challenge (cc3)

const challenges = require('./data/coding-challenges.json');
const challenge = challenges.find(c => c.id === 'cc3');

// Replicate runJavaScript from code-runner.worker.js
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
      const fn = new Function('console', ...Object.keys(input), `${code}\nreturn ${functionName}(${Object.keys(input).join(',')});`);
      const actual = fn(fakeConsole, ...Object.values(input));
      results.push({ testIndex: i, passed: deepEqual(actual, expected), input, expected, actual });
    } catch (err) {
      results.push({ testIndex: i, passed: false, input, expected, actual: undefined, error: err.message });
    }
  }
  return { results, stdout: logs.join('\n') };
}

// Build test cases: worker passes Object.values(input) as separate args → solve(array, target)
const testCases = challenge.testCases.map(tc => ({
  input: JSON.parse(tc.input),   // { array, target }
  expected: JSON.parse(tc.expectedOutput),
  functionName: 'solve',
}));

// Test 1: starter code (stub) — all should fail
const stubResult = runJavaScript(challenge.starterCode.javascript, testCases);
const stubPassed = stubResult.results.filter(r => r.passed).length;
console.assert(stubPassed === 0, `Stub should pass 0 tests, got ${stubPassed}`);
console.log(`Stub code: ${stubPassed}/${testCases.length} passed (expected 0) ✓`);

// Test 2: correct solution matching the worker's calling convention solve(array, target)
const correctSolution = `
function solve(array, target) {
  for (let i = 0; i < array.length; i++) {
    if (array[i] === target) return i;
  }
  return -1;
}`;

const solResult = runJavaScript(correctSolution, testCases);
const solPassed = solResult.results.filter(r => r.passed).length;
console.assert(solPassed === testCases.length, `Solution should pass all ${testCases.length} tests, got ${solPassed}`);
console.log(`Solution code: ${solPassed}/${testCases.length} passed (expected ${testCases.length}) ✓`);

solResult.results.forEach(r => {
  const status = r.passed ? '✓' : '✗';
  console.log(`  [${status}] input=${JSON.stringify(r.input)} expected=${r.expected} actual=${r.actual}`);
});

// NOTE: challenge.solution.javascript uses solve(param) with param.array/param.target
// but the worker calls solve(array, target) — those signatures are mismatched.
// The stored solution code needs to be updated to match the worker's calling convention.
console.log('\nBug: challenge solution uses solve(param) but worker calls solve(array, target)');
const bugCheck = runJavaScript(challenge.solution.javascript, testCases);
const bugPassed = bugCheck.results.filter(r => r.passed).length;
console.log(`Stored solution: ${bugPassed}/${testCases.length} passed (expected ${testCases.length}, got ${bugPassed}) — mismatch confirmed`);
