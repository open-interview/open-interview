import { EOL } from 'os';

let bannerPrinted = false;

export function printBanner(config) {
  if (bannerPrinted) return;
  bannerPrinted = true;

  const lines = [
    '╔══════════════════════════════════════════════════════════╗',
    `║  ${config.title.padEnd(56)}║`,
    '╠══════════════════════════════════════════════════════════╣',
    ...(config.lines || []).map(l => `║  ${(l).padEnd(56)}║`),
    '╚══════════════════════════════════════════════════════════╝',
  ];
  console.log('\n' + lines.join('\n') + '\n');
  bannerPrinted = true;
}

export function printStageHeader(channelId, candidatesTotal, questionsTotal, dataPath) {
  console.log(`  📝 ${channelId}: ${candidatesTotal}/${questionsTotal} candidates → ${dataPath}`);
  console.log(`  [0/${candidatesTotal}] ${channelId}`);
}

export function printProgress(serial, total, tag, suffix) {
  const pct = Math.floor(serial / total * 100);
  console.log(`  [${serial}/${total}] (${pct}%) ${tag}${suffix}`);
}

export class StatsCollector {
  constructor() {
    this.global = { startTime: null, endTime: null, totalChannels: 0, totalCandidates: 0, totalSkipped: 0 };
    this.perChannel = {};
  }

  startGlobal() {
    this.global.startTime = Date.now();
  }

  endGlobal() {
    this.global.endTime = Date.now();
  }

  startChannel(channelId) {
    if (!this.perChannel[channelId]) {
      this.perChannel[channelId] = {
        attempts: [],
        candidates: 0,
        skipped: 0,
        startTime: Date.now(),
        endTime: null,
        fieldCounts: {},
      };
    }
    this.perChannel[channelId].startTime = Date.now();
  }

  endChannel(channelId) {
    if (this.perChannel[channelId]) {
      this.perChannel[channelId].endTime = Date.now();
    }
  }

  recordAttempt(channelId, { ok, error, durationMs, fields }) {
    if (!this.perChannel[channelId]) return;
    const ch = this.perChannel[channelId];
    ch.attempts.push({ ok, error, durationMs });
    if (ok && fields) {
      for (const key of Object.keys(fields)) {
        ch.fieldCounts[key] = (ch.fieldCounts[key] || 0) + 1;
      }
    }
  }

  channelStats(channelId) {
    const ch = this.perChannel[channelId];
    if (!ch) return { success: 0, total: 0, successRate: '0%', avgLatency: '0s', p50Ms: 0, p95Ms: 0, throughput: '0', duration: '0s', errors: 0, fieldCounts: {} };

    const attempts = ch.attempts;
    const success = attempts.filter(a => a.ok).length;
    const errors = attempts.filter(a => !a.ok).length;
    const total = attempts.length;
    const successRate = total > 0 ? ((success / total) * 100).toFixed(1) + '%' : '0%';

    const latencies = attempts.filter(a => a.ok).map(a => a.durationMs).sort((a, b) => a - b);
    const avgLatency = latencies.length > 0 ? formatMs(latencies.reduce((a, b) => a + b, 0) / latencies.length) : '0s';
    const p50Ms = latencies.length > 0 ? percentile(latencies, 0.5) : 0;
    const p95Ms = latencies.length > 0 ? percentile(latencies, 0.95) : 0;

    const elapsed = Math.max(1, (ch.endTime || Date.now()) - ch.startTime);
    const throughput = (success / (elapsed / 1000)).toFixed(1);
    const duration = formatDuration(elapsed);

    return { success, total, successRate, avgLatency, p50Ms, p95Ms, throughput, duration, errors, fieldCounts: ch.fieldCounts };
  }

  printChannelSummary(channelId, dataPath) {
    const ch = this.channelStats(channelId);
    const bar = progressBar(ch.success, ch.total);
    console.log(`  ┌─ ${channelId}`);
    console.log(`  │ ${bar}  ${ch.success}/${ch.total} rewrites  (${ch.successRate})`);
    console.log(`  │ Latency : ${ch.avgLatency} avg  │  p50: ${formatMs(ch.p50Ms)}  │  p95: ${formatMs(ch.p95Ms)}`);
    console.log(`  │ Throughput: ${ch.throughput}/s  │  Duration: ${ch.duration}  │  Errors: ${ch.errors}`);
    console.log(`  │ File: ${dataPath}`);
    if (ch.total > 0) {
      const fieldsLine = Object.entries(ch.fieldCounts)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => `${k}: ${v} (${pct(v, ch.total)})`)
        .join('  │  ');
      console.log(`  │ Fields:  ${fieldsLine}`);
    }
    console.log(`  └${'─'.repeat(50)}`);
  }

  printGlobalSummary() {
    const elapsed = Math.max(1, (this.global.endTime || Date.now()) - this.global.startTime);
    const allAttempts = Object.values(this.perChannel).flatMap(c => c.attempts);
    const totalOk = allAttempts.filter(a => a.ok).length;
    const totalErr = allAttempts.filter(a => !a.ok).length;

    console.log('\n  ╔══════════════════════════════════════════════════════════╗');
    console.log(`  ║  📊  GLOBAL SUMMARY${' '.repeat(43)}║`);
    console.log('  ╠══════════════════════════════════════════════════════════╣');
    console.log(`  ║  Total channels  : ${String(this.global.totalChannels).padEnd(42)}║`);
    console.log(`  ║  Total candidates: ${String(this.global.totalCandidates).padEnd(42)}║`);
    console.log(`  ║  Rewrite attempts: ${String(allAttempts.length).padEnd(42)}║`);
    console.log(`  ║  Successful      : ${String(totalOk).padEnd(42)}║`);
    console.log(`  ║  Errors          : ${String(totalErr).padEnd(42)}║`);
    console.log(`  ║  Duration        : ${formatDuration(elapsed).padEnd(42)}║`);

    const fieldTotals = {};
    for (const ch of Object.values(this.perChannel)) {
      for (const [k, v] of Object.entries(ch.fieldCounts)) {
        fieldTotals[k] = (fieldTotals[k] || 0) + v;
      }
    }
    if (Object.keys(fieldTotals).length > 0) {
      console.log('  ╠══════════════════════════════════════════════════════════╣');
      console.log('  ║  Per-field totals:');
      for (const [k, v] of Object.entries(fieldTotals).sort((a, b) => b[1] - a[1])) {
        console.log(`  ║    ${(k + ': ' + v).padEnd(54)}║`);
      }
    }

    console.log('  ╚══════════════════════════════════════════════════════════╝\n');
  }
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const i = Math.floor(p * (sorted.length - 1));
  return sorted[i] || 0;
}

function formatMs(ms) {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatDuration(ms) {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function progressBar(success, total) {
  if (total === 0) return '█'.repeat(16) + '░░';
  const ratio = success / total;
  const filled = Math.floor(ratio * 16);
  return '█'.repeat(filled) + '░'.repeat(16 - filled);
}

function pct(v, total) {
  return total > 0 ? ((v / total) * 100).toFixed(1) + '%' : '0%';
}
