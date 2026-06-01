import { detectOptimalWorkers, machineSpecs } from './workers.js';
import { StatsCollector, printBanner } from './progress.js';
import { rebuildAggregatedFile } from './vector-rag.js';

const STAGE_REGISTRY = {};

export function registerStage(name, stage) {
  STAGE_REGISTRY[name] = stage;
}

export function getStage(name) {
  return STAGE_REGISTRY[name];
}

export function listStages() {
  return Object.entries(STAGE_REGISTRY).map(([name, stage]) => ({
    name,
    description: stage.meta?.description || '',
  }));
}

export async function runStages(config) {
  const { stages, channelIds, options = {} } = config;
  const stats = new StatsCollector();
  stats.startGlobal();
  stats.global.totalChannels = channelIds.length;

  const workers = options.workers || detectOptimalWorkers();

  printBanner({
    title: options.title || '🧠  CONTENT PIPELINE',
    lines: [
      `Stages   : ${stages.join(', ')}`,
      `Channels : ${channelIds.length === 93 ? 'ALL (93)' : channelIds.length}`,
      `Limit    : ${options.limit || 'unlimited'}        per channel`,
      `Workers  : ${workers}          (auto: ${machineSpecs()})`,
      options.minScore ? `Score    : rewrite if score < ${options.minScore}` : null,
      options.fields   ? `Fields   : ${options.fields.join(', ')}` : null,
      `Dry Run  : ${options.dryRun || false}`,
      `Provider : opencode`,
    ].filter(Boolean),
  });

  const overall = { processed: 0, errors: 0 };
  const stageResults = {};

  for (const stageName of stages) {
    const stage = STAGE_REGISTRY[stageName];
    if (!stage) {
      console.error(`  ❌ Unknown stage: ${stageName}`);
      continue;
    }

    console.log(`\n  ═══════════════════════════════════════════════════════════`);
    console.log(`  ▶  STAGE: ${stageName} — ${stage.meta?.description || ''}`);
    console.log(`  ═══════════════════════════════════════════════════════════\n`);

    const hasBatch = typeof stage.runBatch === 'function';
    const hasWorkerPool = typeof stage.runWorkerPool === 'function';

    let result;
    const stageOpts = { ...options, workers };

    if (hasWorkerPool && channelIds.length > 1) {
      result = await stage.runWorkerPool(channelIds, stageOpts, stats);
    } else if (hasBatch && channelIds.length > 1) {
      result = await stage.runBatch(channelIds, stageOpts, stats);
    } else {
      for (const ch of channelIds) {
        const chResult = await stage.run(ch, stageOpts, stats);
        const dataPath = options.dataDir
          ? `${options.dataDir}/${ch}.json`
          : `client/public/data/${ch}.json`;
        stats.printChannelSummary(ch, dataPath);
        overall.processed += (chResult.processed || 0);
        overall.errors += (chResult.errors || 0);
      }
      result = overall;
    }

    stageResults[stageName] = result || overall;
    console.log(`\n  ✅ Stage "${stageName}" complete\n`);

    if (stageName === 'embed') {
      rebuildAggregatedFile();
    }
  }

  stats.global.totalCandidates = overall.processed;
  stats.endGlobal();
  stats.printGlobalSummary();

  return stageResults;
}
