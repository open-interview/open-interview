const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/';

const timeout = setTimeout(() => {
  self.postMessage({ type: 'result', results: [], stdout: '', error: 'Execution timed out (10s)' });
  self.close();
}, 10000);

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

async function runPython(code, testCases) {
  const logs = [];
  const results = [];

  let pyodide;
  try {
    importScripts(`${PYODIDE_CDN}pyodide.js`);
    pyodide = await loadPyodide({ indexURL: PYODIDE_CDN });
  } catch (err) {
    return { results: [], stdout: '', error: `Failed to load Python runtime: ${err.message}` };
  }

  for (let i = 0; i < testCases.length; i++) {
    const { input, expected, functionName } = testCases[i];
    try {
      // Serialize input values as JSON for Python to parse
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

self.onmessage = async function (e) {
  const { type, code, testCases, language } = e.data;
  if (type !== 'run') return;

  let out;
  if (language === 'python') {
    out = await runPython(code, testCases);
  } else {
    out = runJavaScript(code, testCases);
  }

  clearTimeout(timeout);
  self.postMessage({ type: 'result', ...out });
};
