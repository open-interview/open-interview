import { generateCertificationsParallel } from '../../ai/graphs/certification-question-graph.js';
import { certificationDomains } from '../../ai/prompts/templates/certification-question.js';
import { saveQuestion, getQuestionsForChannel } from '../../utils.js';

export const meta = {
  name: 'certify',
  description: 'Generate certification MCQ questions',
  defaultCertsPerRun: 5,
  defaultQuestionsPerCert: 3,
};

export async function run(channelId, options, stats) {
  stats.startChannel(channelId);
  const perCert = options.questionsPerCert || meta.defaultQuestionsPerCert;

  const qs = await getQuestionsForChannel(channelId);
  const count = qs.filter(q => q.status !== 'deleted').length;
  console.log(`  📊 ${channelId}: ${count} existing questions`);

  const domain = await getPrioritizedDomain(channelId);
  if (!domain) {
    stats.endChannel(channelId);
    return { processed: 0, errors: 0, results: [] };
  }

  const result = await generateCertificationsParallel([
    { certificationId: channelId, domain, difficulty: 'intermediate', count: perCert },
  ]);

  let saved = 0;
  for (const task of result.completed) {
    const r = task.result;
    if (r?.success && r.questions?.length > 0) {
      for (const question of r.questions) {
        const ok = await saveCertQuestion(channelId, question);
        if (ok) saved++;
      }
    }
  }

  stats.endChannel(channelId);
  return { processed: saved, errors: result.completed.filter(r => !r.result?.success).length };
}

export async function runBatch(certIds, options, stats) {
  const maxCerts = options.maxCerts || meta.defaultCertsPerRun;
  const perCert = options.questionsPerCert || meta.defaultQuestionsPerCert;

  const counts = [];
  for (const certId of certIds) {
    if (!certificationDomains[certId]) continue;
    try {
      const qs = await getQuestionsForChannel(certId);
      counts.push({ certId, count: qs.filter(q => q.status !== 'deleted').length });
    } catch {
      counts.push({ certId, count: 0 });
    }
  }

  counts.sort((a, b) => {
    if (a.count === 0 && b.count === 0) return 0;
    if (a.count === 0) return -1;
    if (b.count === 0) return 1;
    return a.count - b.count;
  });

  const targetCerts = counts.slice(0, maxCerts).map(c => c.certId);
  console.log(`\n  🎯 Certifications to process: ${targetCerts.join(', ')}`);

  const certs = (await Promise.all(targetCerts.map(async certId => {
    const domains = certificationDomains[certId];
    if (!domains?.length) return null;
    const domain = await getPrioritizedDomain(certId);
    return domain ? { certificationId: certId, domain, difficulty: 'intermediate', count: perCert } : null;
  }))).filter(Boolean);

  const poolResults = await generateCertificationsParallel(certs);
  let totalSaved = 0;

  for (const task of poolResults.completed) {
    const r = task.result;
    if (r?.success && r.questions?.length > 0) {
      for (const question of r.questions) {
        const ok = await saveCertQuestion(question.certificationId || certs.find(c => c.certificationId), question);
        if (ok) totalSaved++;
      }
    }
  }

  return { processed: totalSaved, results: poolResults };
}

async function getPrioritizedDomain(certId) {
  const domains = certificationDomains[certId];
  if (!domains?.length) return null;

  const qs = await getQuestionsForChannel(certId);
  const domainCounts = {};
  for (const q of qs) {
    if (q.status === 'deleted') continue;
    const sub = q.subChannel || q.sub_channel;
    domainCounts[sub] = (domainCounts[sub] || 0) + 1;
  }

  const sorted = [...domains].map(d => ({ ...d, count: domainCounts[d.id] || 0 }))
    .sort((a, b) => {
      if (a.count === 0 && b.count === 0) return b.weight - a.weight;
      if (a.count === 0) return -1;
      if (b.count === 0) return 1;
      return a.count - b.count;
    });

  console.log(`  📌 Prioritized domain: ${sorted[0].name} (${sorted[0].count} questions)`);
  return sorted[0].id;
}

async function saveCertQuestion(channelId, question) {
  const id = question.id || `cert-${question.certificationId || channelId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  try {
    const tags = [...(question.tags || []), 'certification-mcq', `domain-weight-${question.domainWeight || 0}`];
    await saveQuestion({
      id,
      channel: question.certificationId || channelId,
      subChannel: question.domain,
      question: question.question,
      answer: JSON.stringify(question.options),
      explanation: question.explanation,
      difficulty: question.difficulty,
      tags,
      status: 'active',
      lastUpdated: new Date().toISOString(),
    });
    return true;
  } catch {
    return false;
  }
}

export default { meta, run, runBatch };
