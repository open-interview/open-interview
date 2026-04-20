import 'dotenv/config';
import { getDb, initBotTables } from './shared/db.js';
import { logAction } from './shared/ledger.js';
import { addToQueue, getQueueStats } from './shared/queue.js';
import { startRun, completeRun, failRun } from './shared/runs.js';
import { auditAnswer, ISSUE_SEVERITY } from '../ai/prompts/templates/answer-standard.js';

const BOT_NAME = 'answer-auditor';

const SEVERITY_RANK = { critical: 4, high: 3, medium: 2, low: 1 };

function parseArgs() {
  const args = process.argv.slice(2);
  const mode = args.includes('--reprocess') ? 'reprocess'
    : args.includes('--status') ? 'status'
    : 'scan';
  const severity = args.find(a => a.startsWith('--severity='))?.split('=')[1] || 'high';
  const id = args.find(a => a.startsWith('--id='))?.split('=')[1] || null;
  const all = args.includes('--all');
  const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '0', 10);
  const channel = args.find(a => a.startsWith('--channel='))?.split('=')[1] || null;
  return { mode, severity, id, all, limit, channel };
}

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err.message);
  process.exitCode = 1;
});

async function scanAllQuestions(db, { limit = 0, channel = null } = {}) {
  let sql = `SELECT id, question, answer, explanation FROM questions WHERE status != 'deleted'`;
  const args = [];
  if (channel) { sql += ` AND channel = ?`; args.push(channel); }
  if (limit > 0) { sql += ` LIMIT ?`; args.push(limit); }
  const result = await db.execute({ sql, args });
  const questions = result.rows;

  const bySeverity = { critical: [], high: [], medium: [], low: [] };
  const byIssue = {};
  const worstOffenders = [];
  let passing = 0;

  for (const row of questions) {
    const issues = auditAnswer(row.answer || '', row.explanation || '');
    if (issues.length === 0) { passing++; continue; }

    let worstRank = 0;
    let worstSev = null;
    for (const issue of issues) {
      const sev = ISSUE_SEVERITY[issue];
      const rank = SEVERITY_RANK[sev] || 0;
      if (rank > worstRank) { worstRank = rank; worstSev = sev; }
      if (!byIssue[issue]) byIssue[issue] = [];
      byIssue[issue].push(row.id);
    }

    if (worstSev) bySeverity[worstSev].push(row.id);
    if (worstRank >= 1) {
      worstOffenders.push({ id: row.id, question: row.question, worstRank, issues });
    }
  }

  const failing = questions.length - passing;
  return { total: questions.length, passing, failing, bySeverity, byIssue, worstOffenders };
}

function printReport(result) {
  const { total, passing, failing, bySeverity, byIssue, worstOffenders } = result;
  const passRate = total > 0 ? ((passing / total) * 100).toFixed(1) : '0.0';
  console.log('╔══════════════════════════════════════╗');
  console.log('║       Answer Audit Report            ║');
  console.log('╚══════════════════════════════════════╝');
  console.log(`  Total:   ${total}`);
  console.log(`  ✅ Pass: ${passing}  ❌ Fail: ${failing}  (${passRate}% pass rate)`);
  console.log('');
  console.log('Severity Breakdown:');
  console.log(`  🔴 Critical: ${bySeverity.critical.length}`);
  console.log(`  🟠 High:     ${bySeverity.high.length}`);
  console.log(`  🟡 Medium:   ${bySeverity.medium.length}`);
  console.log(`  🟢 Low:      ${bySeverity.low.length}`);
  console.log('');
  console.log('Issues by Frequency:');
  Object.entries(byIssue)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([issue, ids]) => console.log(`  ${issue}: ${ids.length}`));
  console.log('');
  console.log(`Top Offenders (showing up to 10 by severity):`);
  [...worstOffenders].sort((a, b) => b.worstRank - a.worstRank).slice(0, 10).forEach(o =>
    console.log(`  [${o.id}] ${o.issues.join(', ')} — "${String(o.question).slice(0, 60)}..."`)
  );
}

async function reprocessQuestions(scanResult, opts, db) {
  const { severity = 'high', id = null, all = false } = opts;
  const minRank = SEVERITY_RANK[severity] || 3;

  let candidates = scanResult.worstOffenders.filter(o =>
    o.issues.some(i => (SEVERITY_RANK[ISSUE_SEVERITY[i]] || 0) >= minRank)
  );
  if (id) candidates = candidates.filter(o => String(o.id) === String(id));
  if (!all) candidates = candidates.slice(0, 50);

  for (const candidate of candidates) {
    const topRank = Math.max(...candidate.issues.map(i => SEVERITY_RANK[ISSUE_SEVERITY[i]] || 0));
    const action = topRank >= 3 ? 'complete_content' : topRank === 2 ? 'fix_formatting' : 'add_details';
    const priority = action === 'complete_content' ? 1 : action === 'fix_formatting' ? 3 : 5;

    await addToQueue({
      itemType: 'question',
      itemId: candidate.id,
      action,
      priority,
      reason: candidate.issues.join(', '),
      createdBy: BOT_NAME
    });

    await logAction({
      botName: BOT_NAME,
      action: 'queued',
      itemType: 'question',
      itemId: candidate.id,
      reason: candidate.issues.join(', ')
    });
  }

  return candidates.length;
}

async function main() {
  const opts = parseArgs();
  await initBotTables();
  const db = await getDb();

  if (opts.mode === 'status') {
    const stats = await getQueueStats();
    console.log('Queue stats:', JSON.stringify(stats, null, 2));
    return;
  }

  const run = await startRun(BOT_NAME);
  const runId = run.id;

  try {
    const scanResult = await scanAllQuestions(db, { limit: opts.limit, channel: opts.channel });
    printReport(scanResult);

    let queued = 0;
    if (opts.mode === 'reprocess') {
      queued = await reprocessQuestions(scanResult, opts, db);
      console.log(`\nQueued ${queued} question(s) for reprocessing.`);
    }

    await completeRun(runId,
      { processed: scanResult.total, created: queued, updated: 0, deleted: 0 },
      { total: scanResult.total, passing: scanResult.passing, failing: scanResult.failing, queued }
    );
  } catch (e) {
    await failRun(runId, e.message);
    console.error('Run failed:', e.message);
    process.exit(1);
  }
}

main();
