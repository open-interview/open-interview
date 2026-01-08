/**
 * Scene definitions for different technical contexts
 */

import type { ThemeColors, CodeLine, TerminalLine } from './types.js';
import { card, metric, status, arrow, codeSnippet, terminalBlock, titleBar } from './primitives.js';

type SceneRenderer = (title: string, colors: ThemeColors, width: number, height: number) => string;

/**
 * Architecture: 3 cards in a row with arrows
 */
const architecture: SceneRenderer = (title, c, w, h) => `
  ${card(80, 100, 120, 100, 'globe', 'Client', c, c.cyan)}
  ${card(290, 100, 120, 100, 'server', 'Server', c, c.blue)}
  ${card(500, 100, 120, 100, 'database', 'Database', c, c.purple)}
  ${arrow(200, 150, 290, 150, c.cyan, 'HTTP', false, c)}
  ${arrow(410, 150, 500, 150, c.purple, 'SQL', false, c)}
  ${metric(80, 250, 'Latency', '12', c, 'ms', c.green)}
  ${metric(210, 250, 'Uptime', '99.9', c, '%', c.green)}
  ${status(360, 280, 'ok', 'All systems operational', c)}
  ${titleBar(title, w, h, c)}
`;

/**
 * Scaling: Load balancer + multiple nodes
 */
const scaling: SceneRenderer = (title, c, w, h) => `
  ${card(290, 50, 120, 80, 'cloud', 'Load Balancer', c, c.cyan)}
  ${card(80, 180, 100, 80, 'server', 'Node 1', c, c.green)}
  ${card(220, 180, 100, 80, 'server', 'Node 2', c, c.green)}
  ${card(360, 180, 100, 80, 'server', 'Node 3', c, c.green)}
  ${card(500, 180, 100, 80, 'server', 'Node 4', c, c.orange)}
  ${arrow(350, 130, 130, 180, c.cyan, '', false, c)}
  ${arrow(350, 130, 270, 180, c.cyan, '', false, c)}
  ${arrow(350, 130, 410, 180, c.cyan, '', false, c)}
  ${arrow(350, 130, 550, 180, c.cyan, '', false, c)}
  ${metric(150, 290, 'RPS', '45K', c, '', c.blue)}
  ${metric(290, 290, 'Nodes', '4', c, '', c.green)}
  ${metric(430, 290, 'CPU', '72', c, '%', c.orange)}
  ${titleBar(title, w, h, c)}
`;

/**
 * Database: Primary + Replicas
 */
const database: SceneRenderer = (title, c, w, h) => `
  ${card(180, 80, 140, 100, 'database', 'Primary', c, c.purple)}
  ${card(380, 80, 140, 100, 'database', 'Replica', c, c.cyan)}
  ${arrow(320, 130, 380, 130, c.green, 'sync', false, c)}
  ${metric(80, 220, 'QPS', '2.3K', c, '', c.purple)}
  ${metric(210, 220, 'Latency', '4', c, 'ms', c.green)}
  ${metric(340, 220, 'Connections', '128', c, '', c.blue)}
  ${metric(470, 220, 'Cache Hit', '94', c, '%', c.green)}
  ${status(200, 320, 'ok', 'Replication healthy', c)}
  ${status(400, 320, 'ok', 'Replica in sync', c)}
  ${titleBar(title, w, h, c)}
`;

/**
 * Deployment: CI/CD Pipeline
 */
const deployment: SceneRenderer = (title, c, w, h) => `
  ${card(60, 120, 100, 80, 'code', 'Code', c, c.muted)}
  ${card(200, 120, 100, 80, 'git', 'Build', c, c.orange)}
  ${card(340, 120, 100, 80, 'target', 'Test', c, c.blue)}
  ${card(480, 120, 100, 80, 'rocket', 'Deploy', c, c.green)}
  ${arrow(160, 160, 200, 160, c.muted, '', false, c)}
  ${arrow(300, 160, 340, 160, c.orange, '', false, c)}
  ${arrow(440, 160, 480, 160, c.blue, '', false, c)}
  ${metric(140, 240, 'Build', '2.3', c, 'min', c.orange)}
  ${metric(290, 240, 'Tests', '141', c, '', c.green)}
  ${metric(440, 240, 'Coverage', '87', c, '%', c.blue)}
  ${status(280, 330, 'ok', 'Pipeline passed • Ready for production', c)}
  ${titleBar(title, w, h, c)}
`;

/**
 * Security: Firewall flow
 */
const security: SceneRenderer = (title, c, w, h) => `
  ${card(80, 120, 120, 90, 'globe', 'Internet', c, c.muted)}
  ${card(290, 120, 120, 90, 'shield', 'Firewall', c, c.green)}
  ${card(500, 120, 120, 90, 'lock', 'Auth', c, c.purple)}
  ${arrow(200, 165, 290, 165, c.muted, 'HTTPS', false, c)}
  ${arrow(410, 165, 500, 165, c.green, 'mTLS', false, c)}
  ${metric(100, 250, 'Blocked', '847', c, '', c.red)}
  ${metric(250, 250, 'Auth Rate', '99.2', c, '%', c.green)}
  ${metric(400, 250, 'Threats', '0', c, '', c.green)}
  ${status(280, 340, 'ok', 'Zero Trust • All traffic encrypted', c)}
  ${titleBar(title, w, h, c)}
`;

/**
 * Debugging: Code + Terminal side by side
 */
const debugging: SceneRenderer = (title, c, w, h) => {
  const codeLines: CodeLine[] = [
    { t: 'async function fetch() {' },
    { t: '  const res = await api.get();', hl: true },
    { t: '  return res.data;' },
    { t: '}' }
  ];
  const termLines: TerminalLine[] = [
    { t: 'node debug.ts' },
    { t: 'TypeError: Cannot read undefined', err: true },
    { t: '    at fetch (debug.ts:2)', err: true }
  ];
  return `
  ${codeSnippet(40, 50, 300, 130, codeLines, c, 'debug.ts')}
  ${terminalBlock(360, 50, 300, 130, termLines, c)}
  ${card(150, 220, 120, 80, 'alert', 'Bug Found', c, c.red)}
  ${card(430, 220, 120, 80, 'check', 'Fixed', c, c.green)}
  ${arrow(270, 260, 430, 260, c.orange, 'debug', false, c)}
  ${status(280, 340, 'ok', 'Issue resolved', c)}
  ${titleBar(title, w, h, c)}
`;
};

/**
 * Testing: Test results
 */
const testing: SceneRenderer = (title, c, w, h) => {
  const codeLines: CodeLine[] = [
    { t: 'describe("API", () => {' },
    { t: '  it("returns 200", async () => {', hl: true },
    { t: '    expect(res.status).toBe(200);' },
    { t: '  });' }
  ];
  return `
  ${codeSnippet(40, 50, 280, 120, codeLines, c, 'api.test.ts')}
  ${metric(360, 50, 'Passed', '141', c, '', c.green)}
  ${metric(490, 50, 'Failed', '1', c, '', c.red)}
  ${metric(360, 120, 'Coverage', '87', c, '%', c.blue)}
  ${metric(490, 120, 'Duration', '4.2', c, 's', c.muted)}
  ${card(150, 220, 120, 80, 'target', 'Unit', c, c.green)}
  ${card(310, 220, 120, 80, 'layers', 'Integration', c, c.blue)}
  ${card(470, 220, 120, 80, 'globe', 'E2E', c, c.purple)}
  ${status(280, 340, 'ok', 'All test suites passed', c)}
  ${titleBar(title, w, h, c)}
`;
};

/**
 * Performance: Metrics focused
 */
const performance: SceneRenderer = (title, c, w, h) => {
  const termLines: TerminalLine[] = [
    { t: '$ perf analyze --profile' },
    { t: 'Hotspot: db.query() - 45% CPU', err: true },
    { t: '✓ Optimized: -65% latency', ok: true }
  ];
  return `
  ${metric(80, 60, 'P99 Latency', '23', c, 'ms', c.green)}
  ${metric(210, 60, 'RPS', '45K', c, '', c.blue)}
  ${metric(340, 60, 'Error Rate', '0.1', c, '%', c.green)}
  ${metric(470, 60, 'CPU', '45', c, '%', c.orange)}
  ${terminalBlock(120, 150, 460, 100, termLines, c)}
  ${card(200, 280, 120, 70, 'zap', 'Optimized', c, c.green)}
  ${card(380, 280, 120, 70, 'activity', 'Monitoring', c, c.blue)}
  ${titleBar(title, w, h, c)}
`;
};

/**
 * API: Request/Response
 */
const api: SceneRenderer = (title, c, w, h) => {
  const reqLines: CodeLine[] = [
    { t: 'GET /api/v2/users HTTP/1.1' },
    { t: 'Authorization: Bearer ***', hl: true },
    { t: 'Accept: application/json' }
  ];
  const resLines: CodeLine[] = [
    { t: '200 OK (12ms)' },
    { t: '{ "users": [...] }', hl: true },
    { t: 'Content-Type: application/json' }
  ];
  return `
  ${codeSnippet(40, 50, 300, 120, reqLines, c, 'request.http')}
  ${codeSnippet(360, 50, 300, 120, resLines, c, 'response')}
  ${metric(80, 200, 'RPS', '8.4K', c, '', c.blue)}
  ${metric(210, 200, 'P99', '45', c, 'ms', c.green)}
  ${metric(340, 200, 'Errors', '0.01', c, '%', c.green)}
  ${metric(470, 200, 'Cache', '78', c, '%', c.cyan)}
  ${status(280, 300, 'ok', 'API healthy • Rate limit OK', c)}
  ${titleBar(title, w, h, c)}
`;
};

/**
 * Monitoring: Dashboard
 */
const monitoring: SceneRenderer = (title, c, w, h) => `
  ${metric(80, 50, 'Uptime', '99.99', c, '%', c.green)}
  ${metric(210, 50, 'Alerts', '0', c, '', c.green)}
  ${metric(340, 50, 'P95', '23', c, 'ms', c.blue)}
  ${metric(470, 50, 'Memory', '62', c, '%', c.orange)}
  ${card(120, 150, 120, 80, 'activity', 'Metrics', c, c.blue)}
  ${card(290, 150, 120, 80, 'eye', 'Traces', c, c.purple)}
  ${card(460, 150, 120, 80, 'terminal', 'Logs', c, c.cyan)}
  ${metric(80, 270, 'Events', '1.2M', c, '/day', c.muted)}
  ${metric(210, 270, 'Retention', '30', c, 'days', c.muted)}
  ${status(380, 300, 'ok', 'All systems healthy', c)}
  ${titleBar(title, w, h, c)}
`;

/**
 * Frontend: Web vitals
 */
const frontend: SceneRenderer = (title, c, w, h) => {
  const codeLines: CodeLine[] = [
    { t: 'const App = () => {' },
    { t: '  return <Suspense fallback={<Loader />}>', hl: true },
    { t: '    <MainContent />' },
    { t: '  </Suspense>;' }
  ];
  return `
  ${metric(80, 50, 'LCP', '1.2', c, 's', c.green)}
  ${metric(210, 50, 'FID', '45', c, 'ms', c.green)}
  ${metric(340, 50, 'CLS', '0.02', c, '', c.green)}
  ${metric(470, 50, 'TTI', '2.1', c, 's', c.orange)}
  ${codeSnippet(150, 140, 400, 100, codeLines, c, 'App.tsx')}
  ${card(200, 280, 120, 70, 'globe', 'Browser', c, c.cyan)}
  ${card(380, 280, 120, 70, 'zap', 'Optimized', c, c.green)}
  ${titleBar(title, w, h, c)}
`;
};

/**
 * Success: Celebration
 */
const success: SceneRenderer = (title, c, w, h) => `
  ${card(290, 60, 120, 100, 'check', 'Success!', c, c.green)}
  ${metric(80, 200, 'Uptime', '100', c, '%', c.green)}
  ${metric(210, 200, 'Users', '12.4K', c, '', c.blue)}
  ${metric(340, 200, 'Revenue', '+24', c, '%', c.green)}
  ${metric(470, 200, 'NPS', '72', c, '', c.purple)}
  ${status(200, 320, 'ok', 'Deployment successful', c)}
  ${status(400, 320, 'ok', 'Zero downtime', c)}
  ${titleBar(title, w, h, c)}
`;

/**
 * Error: Incident
 */
const error: SceneRenderer = (title, c, w, h) => {
  const termLines: TerminalLine[] = [
    { t: '$ kubectl logs pod/api-7d8f9' },
    { t: 'ERROR: OOMKilled - Exit code 137', err: true },
    { t: 'Memory limit exceeded: 512Mi', err: true }
  ];
  return `
  ${card(290, 50, 120, 90, 'alert', 'Incident', c, c.red)}
  ${terminalBlock(150, 160, 400, 100, termLines, c)}
  ${metric(100, 290, 'Status', '503', c, '', c.red)}
  ${metric(240, 290, 'Errors', '2.3K', c, '', c.red)}
  ${metric(380, 290, 'MTTR', '4.2', c, 'min', c.orange)}
  ${status(280, 370, 'error', 'Service degraded • Investigating', c)}
  ${titleBar(title, w, h, c)}
`;
};

/**
 * Default: Simple overview
 */
const defaultScene: SceneRenderer = (title, c, w, h) => `
  ${card(290, 80, 120, 100, 'layers', 'System', c, c.blue)}
  ${metric(80, 220, 'Requests', '8.2K', c, '/s', c.blue)}
  ${metric(220, 220, 'Latency', '12', c, 'ms', c.green)}
  ${metric(360, 220, 'Errors', '0.1', c, '%', c.green)}
  ${metric(500, 220, 'Uptime', '99.9', c, '%', c.green)}
  ${status(280, 340, 'ok', 'All systems operational', c)}
  ${titleBar(title, w, h, c)}
`;

/**
 * All available scenes
 */
export const SCENES: Record<string, SceneRenderer> = {
  architecture,
  scaling,
  database,
  deployment,
  security,
  debugging,
  testing,
  performance,
  api,
  monitoring,
  frontend,
  success,
  error,
  default: defaultScene,
};
