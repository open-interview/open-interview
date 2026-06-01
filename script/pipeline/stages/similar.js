import { computeAllSimilarities } from '../vector-rag.js';

export const meta = {
  name: 'similar',
  description: 'Compute similar questions using JSON vector embeddings',
  defaultTopK: 5,
  defaultThreshold: 0.15,
};

export async function run(channelId, options, stats) {
  const topK = options.topK || meta.defaultTopK;
  const threshold = options.threshold || meta.defaultThreshold;

  stats.startChannel(channelId);
  const result = await computeAllSimilarities({ topK, threshold, channel: channelId });
  stats.endChannel(channelId);

  return {
    processed: result.questionsWithSimilar,
    errors: 0,
    info: `threshold=${threshold}, topK=${topK}`,
  };
}

export async function runBatch(allChannelIds, options, stats) {
  const topK = options.topK || meta.defaultTopK;
  const threshold = options.threshold || meta.defaultThreshold;

  stats.startChannel('all');
  const result = await computeAllSimilarities({ topK, threshold, channel: null });
  stats.endChannel('all');

  return {
    processed: result.questionsWithSimilar,
    errors: 0,
    info: `total=${result.totalQuestions}, withSimilar=${result.questionsWithSimilar}`,
  };
}

export default { meta, run, runBatch };
