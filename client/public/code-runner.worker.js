const timeout = setTimeout(() => {
  self.postMessage({ type: 'result', results: [], stdout: '', error: 'Execution timed out (5s)' });
  self.close();
}, 5000);

function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a), keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(k => deepEqual(a[k], b[k]));
}

self.onmessage = function (e) {
  const { type, code, testCases } = e.data;
  if (type !== 'run') return;

  const logs = [];
  const results = [];

  let userFn;
  try {
    const sandbox = new Function(
      'console',
      `${code}\nreturn (typeof module !== 'undefined' && module.exports) ? module.exports : undefined;`
    );
    const fakeConsole = { log: (...args) => logs.push(args.map(String).join(' ')) };
    sandbox(fakeConsole);
    // Functions are defined in the code string scope; re-run to extract them
  } catch (err) {
    clearTimeout(timeout);
    self.postMessage({ type: 'result', results: [], stdout: logs.join('\n'), error: err.message });
    return;
  }

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

  clearTimeout(timeout);
  self.postMessage({ type: 'result', results, stdout: logs.join('\n') });
};
