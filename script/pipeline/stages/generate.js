import { generateQuestion as generateQuestionGraph } from '../../ai/graphs/question-graph.js';
import { generateQuestionWithCertifications, hasRelatedCertifications } from '../../ai/graphs/enhanced-question-generator.js';
import { runQualityGate } from '../../ai/graphs/quality-gate-graph.js';
import { channelConfigs, topCompanies as TOP_TECH_COMPANIES } from '../../ai/prompts/templates/generate.js';
import { certificationDomains } from '../../ai/prompts/templates/certification-question.js';
import ragService from '../../ai/services/rag-enhanced-generation.js';
import { embedAndSave } from '../vector-rag.js';
import fs from 'fs';
import path from 'path';
import { getChannelQuestionCounts, getSubChannelQuestionCounts, getAllChannelsFromDb, addUnifiedQuestion, generateUnifiedId, isDuplicateUnified, validateQuestion } from '../../utils.js';

export const meta = {
  name: 'generate',
  description: 'Generate new interview questions per channel',
  difficulties: ['beginner', 'intermediate', 'advanced'],
};

const CERTIFICATION_CHANNELS = Object.keys(certificationDomains);

export async function run(channelId, options, stats) {
  const { concurrency = 3 } = options;
  const difficulty = options.difficulty || 'random';
  const channels = [channelId];
  const allChannels = await getAllChannelsFromDb();
  const channelCounts = await getChannelQuestionCounts();

  let subChannelCounts = {};
  try { subChannelCounts = await getSubChannelQuestionCounts(); } catch {}

  stats.startChannel(channelId);

  const results = [];
  const errors = [];

  const targetChannels = selectChannelsWeighted(channelCounts, channels, concurrency, CERTIFICATION_CHANNELS);

  for (const ch of targetChannels) {
    const result = await processSingleChannel(ch, difficulty, allChannels, channelCounts, subChannelCounts, stats);
    if (result.success) {
      results.push(result.question);
    } else {
      errors.push({ channel: ch, reason: result.error });
    }
  }

  stats.endChannel(channelId);
  return { processed: results.length, errors: errors.length, results, errorDetails: errors };
}

export async function runBatch(channelIds, options, stats) {
  const { concurrency = 3 } = options;
  const difficulty = options.difficulty || 'random';
  const allChannels = await getAllChannelsFromDb();
  const channelCounts = await getChannelQuestionCounts();

  let subChannelCounts = {};
  try { subChannelCounts = await getSubChannelQuestionCounts(); } catch {}

  const channels = options.balanceChannels !== false
    ? selectChannelsWeighted(channelCounts, channelIds, channelIds.length, CERTIFICATION_CHANNELS)
    : channelIds;

  const allResults = [];
  const allErrors = [];

  for (let i = 0; i < channels.length; i += concurrency) {
    const batch = channels.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(ch => processSingleChannel(ch, difficulty, allChannels, channelCounts, subChannelCounts, stats)));
    for (const r of batchResults) {
      if (r.success) { allResults.push(r.question); stats.recordAttempt(ch, { ok: true, durationMs: 0 }); }
      else { allErrors.push({ channel: r.channel, reason: r.error }); stats.recordAttempt(ch, { ok: false, error: r.error, durationMs: 0 }); }
    }
  }

  return { processed: allResults.length, errors: allErrors.length, results: allResults, errorDetails: allErrors };
}

async function processSingleChannel(channel, inputDifficulty, allChannels, channelCounts, subChannelCounts, stats) {
  const subChannelConfig = Object.keys(subChannelCounts).length > 0
    ? await getPrioritizedSubChannel(channel, subChannelCounts)
    : getRandomSubChannel(channel);

  const difficulty = inputDifficulty === 'random'
    ? meta.difficulties[Math.floor(Math.random() * meta.difficulties.length)]
    : inputDifficulty;

  const targetCompanies = TOP_TECH_COMPANIES.sort(() => Math.random() - 0.5).slice(0, 3);
  const scenarioHint = getScenarioHint(channel);

  let ragContext = null;
  try {
    ragContext = await ragService.getGenerationContext(
      `${channel} ${subChannelConfig.subChannel} ${difficulty}`,
      { channel, limit: 5, includeAnswers: false }
    );
  } catch {}

  const hasCerts = hasRelatedCertifications(channel);
  let result;
  try {
    result = hasCerts
      ? await generateQuestionWithCertifications({
          channel, subChannel: subChannelConfig.subChannel, difficulty,
          tags: subChannelConfig.tags, targetCompanies, scenarioHint, ragContext,
          includeCertifications: true, certQuestionsPerCert: 1,
        })
      : await generateQuestionGraph({
          channel, subChannel: subChannelConfig.subChannel, difficulty,
          tags: subChannelConfig.tags, targetCompanies, scenarioHint, ragContext,
        });
  } catch (error) {
    return { success: false, error: error.message, channel };
  }

  if (!result?.success) return { success: false, error: result?.error || 'Unknown error', channel };

  const data = result.question || result.regular?.question;
  if (!data || !validateQuestion(data)) return { success: false, error: 'Invalid response format', channel };

  if (await isDuplicateUnified(data.question)) return { success: false, error: 'Duplicate detected', channel };

  const existingQuestions = readChannelFileSimple(channel);
  const qualityResult = await runQualityGate(data, {
    channel, subChannel: subChannelConfig.subChannel, difficulty,
    existingQuestions, passThreshold: 70,
  });

  if (!qualityResult.success) return { success: false, error: `Quality gate failed (${qualityResult.score}/100)`, channel };

  const id = await generateUnifiedId();
  const { normalizeCompanies } = await import('../../utils.js');
  const normalizedCompanies = normalizeCompanies(data.companies || []);

  try {
    await addUnifiedQuestion({
      id, channel, subChannel: subChannelConfig.subChannel,
      question: data.question, answer: data.answer, explanation: data.explanation,
      difficulty, tags: data.tags || subChannelConfig.tags,
      companies: normalizedCompanies, status: 'active',
    }, [{ channel, subChannel: subChannelConfig.subChannel }]);

    embedAndSave({
      id,
      question: data.question,
      answer: data.answer,
      eli5: data.eli5,
      tldr: data.tldr,
    }, channel).catch(() => {});

    return { success: true, channel, question: { id, question: data.question, difficulty, channel, subChannel: subChannelConfig.subChannel } };
  } catch (error) {
    return { success: false, error: `Failed to save: ${error.message}`, channel };
  }
}

function readChannelFileSimple(channel) {
  try {
    const p = path.join(process.cwd(), 'data', 'questions', `${channel}.json`);
    if (!fs.existsSync(p)) return [];
    return JSON.parse(fs.readFileSync(p, 'utf8')) || [];
  } catch { return []; }
}

function getRandomSubChannel(channel) {
  const configs = channelConfigs[channel];
  if (!configs?.length) return { subChannel: 'general', tags: [channel] };
  return configs[Math.floor(Math.random() * configs.length)];
}

async function getPrioritizedSubChannel(channel, subChannelCounts) {
  const configs = channelConfigs[channel];
  if (!configs?.length) return { subChannel: 'general', tags: [channel] };
  const channelSubCounts = subChannelCounts[channel] || {};
  const sorted = [...configs].map(c => ({ ...c, count: channelSubCounts[c.subChannel] || 0 })).sort((a, b) => a.count - b.count);
  const empty = sorted.filter(c => c.count === 0);
  if (empty.length > 0) return empty[Math.floor(Math.random() * empty.length)];
  return sorted[Math.floor(Math.random() * sorted.length)];
}

function selectChannelsWeighted(channelCounts, channels, limit, certChannels) {
  const sorted = [...channels].map(ch => ({ channel: ch, count: channelCounts[ch] || 0, isCert: certChannels.includes(ch) }))
    .sort((a, b) => a.count - b.count);
  const empty = sorted.filter(c => c.count === 0);
  if (empty.length > 0) return empty.map(c => c.channel).slice(0, limit);
  return sorted.slice(0, limit).map(c => c.channel);
}

function getScenarioHint(channel) {
  const map = {
    'system-design': [
      { scenario: 'Design Twitter/X feed', scale: '500M users, 10K tweets/sec', focus: 'fan-out, caching, real-time' },
      { scenario: 'Design Uber ride matching', scale: '1M concurrent rides', focus: 'geospatial, real-time, matching' },
    ],
    'algorithms': [
      { problem: 'LRU Cache', pattern: 'HashMap + Doubly Linked List', complexity: 'O(1) get/put' },
      { problem: 'Merge K sorted lists', pattern: 'Min Heap', complexity: 'O(N log K)' },
    ],
  };
  const scenarios = map[channel];
  if (!scenarios?.length) return '';
  return JSON.stringify(scenarios[Math.floor(Math.random() * scenarios.length)]);
}

export default { meta, run, runBatch };
