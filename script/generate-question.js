import {
  addUnifiedQuestion,
  generateUnifiedId,
  isDuplicateUnified,
  validateQuestion,
  writeGitHubOutput,
  logQuestionsAdded,
  normalizeCompanies,
  logBotActivity,
  getChannelQuestionCounts,
  getQuestionCount,
  postBotCommentToDiscussion,
  getAllChannelsFromDb,
  getQuestionsForChannel,
  getSubChannelQuestionCounts
} from './utils.js';
import { generateQuestion as generateQuestionGraph } from './ai/graphs/question-graph.js';
import { generateQuestionWithCertifications, hasRelatedCertifications } from './ai/graphs/enhanced-question-generator.js';
import { runQualityGate } from './ai/graphs/quality-gate-graph.js';
import { channelConfigs, topCompanies as TOP_TECH_COMPANIES, realScenarios as REAL_SCENARIOS } from './ai/prompts/templates/generate.js';
import { certificationDomains } from './ai/prompts/templates/certification-question.js';
import ragService from './ai/services/rag-enhanced-generation.js';
import jobTitleService from './ai/services/job-title-relevance.js';

// Channel configurations - imported from AI framework template (used for sub-channel info)

const difficulties = ['beginner', 'intermediate', 'advanced'];

// Certification channel IDs (channels that are certification prep)
const CERTIFICATION_CHANNELS = Object.keys(certificationDomains);

// Top 100 tech companies - imported from AI framework template

// Helper function to process a single channel - extracted from main loop
async function processChannel(channel, index, total, subChannelCounts, inputDifficulty, allChannels) {
  const subChannelConfig = Object.keys(subChannelCounts).length > 0
    ? await getPrioritizedSubChannel(channel, subChannelCounts)
    : getRandomSubChannel(channel);
  
  console.log(`[${index}/${total}] Processing: ${channel}`);
  
  const difficulty = inputDifficulty === 'random'
    ? difficulties[Math.floor(Math.random() * difficulties.length)]
    : inputDifficulty;

  const targetCompanies = getRandomTopCompanies(3);
  
  function getScenarioHint(chan) {
    const REAL_SCENARIOS_MAP = {
      'system-design': [
        { scenario: 'Design Twitter/X feed', scale: '500M users, 10K tweets/sec', focus: 'fan-out, caching, real-time' },
        { scenario: 'Design Uber ride matching', scale: '1M concurrent rides', focus: 'geospatial, real-time, matching' },
        { scenario: 'Design Netflix video streaming', scale: '200M subscribers', focus: 'CDN, encoding, recommendations' },
      ],
      'algorithms': [
        { problem: 'LRU Cache', pattern: 'HashMap + Doubly Linked List', complexity: 'O(1) get/put' },
        { problem: 'Merge K sorted lists', pattern: 'Min Heap', complexity: 'O(N log K)' },
      ],
    };
    const scenarios = REAL_SCENARIOS_MAP[chan];
    if (!scenarios || scenarios.length === 0) return '';
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    return JSON.stringify(scenario);
  }

  const scenarioHint = getScenarioHint(channel);

  let ragContext = null;
  try {
    ragContext = await ragService.getGenerationContext(
      `${channel} ${subChannelConfig.subChannel} ${difficulty}`,
      { channel, limit: 5, includeAnswers: false }
    );
  } catch (e) {
    // Silently fail - will retry
  }

  const hasCerts = hasRelatedCertifications(channel);
  
  let result;
  try {
    result = hasCerts 
      ? await generateQuestionWithCertifications({
          channel,
          subChannel: subChannelConfig.subChannel,
          difficulty,
          tags: subChannelConfig.tags,
          targetCompanies,
          scenarioHint,
          ragContext,
          includeCertifications: true,
          certQuestionsPerCert: 1
        })
      : await generateQuestionGraph({
          channel,
          subChannel: subChannelConfig.subChannel,
          difficulty,
          tags: subChannelConfig.tags,
          targetCompanies,
          scenarioHint,
          ragContext
        });
  } catch (error) {
    return { success: false, error: error.message, channel };
  }

  // Validation and dedup checks
  if (!result || !result.success) {
    return { success: false, error: result?.error || 'Unknown error', channel };
  }

  const data = result.question || result.regular?.question;
  if (!data || !validateQuestion(data)) {
    return { success: false, error: 'Invalid response format', channel };
  }

  if (await isDuplicateUnified(data.question)) {
    return { success: false, error: 'Duplicate detected', channel };
  }

  // Quality gate
  const existingQuestions = await getQuestionsForChannel(channel);
  const qualityResult = await runQualityGate(data, {
    channel,
    subChannel: subChannelConfig.subChannel,
    difficulty,
    existingQuestions,
    passThreshold: 70
  });

  if (!qualityResult.success) {
    return { success: false, error: `Quality gate failed (${qualityResult.score}/100)`, channel };
  }

  // Save question
  const id = await generateUnifiedId();
  const normalizedCompanies = normalizeCompanies(data.companies || []);
  
  try {
    await addUnifiedQuestion({
      id,
      channel,
      subChannel: subChannelConfig.subChannel,
      question: data.question,
      answer: data.answer,
      explanation: data.explanation,
      difficulty,
      tags: data.tags || subChannelConfig.tags,
      companies: normalizedCompanies,
      status: 'active'
    }, [{ channel, subChannel: subChannelConfig.subChannel }]);

    console.log(`  ✅ [${channel}] Saved: ${data.question.substring(0, 50)}...`);
    
    return { 
      success: true, 
      channel, 
      question: {
        id,
        question: data.question,
        difficulty,
        channel,
        subChannel: subChannelConfig.subChannel
      }
    };
  } catch (error) {
    return { success: false, error: `Failed to save: ${error.message}`, channel };
  }
}

// Process channels with concurrency limit
async function processChannelsWithConcurrency(channels, subChannelCounts, inputDifficulty, allChannels, concurrency = 3) {
  const results = [];
  const errors = [];
  
  for (let i = 0; i < channels.length; i += concurrency) {
    const batch = channels.slice(i, i + concurrency);
    console.log(`\n🔄 Processing batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(channels.length / concurrency)} (${batch.length} channels)`);
    
    const promises = batch.map((channel, batchIdx) =>
      processChannel(channel, i + batchIdx + 1, channels.length, subChannelCounts, inputDifficulty, allChannels)
        .catch(error => ({
          success: false,
          error: error.message,
          channel: 'unknown'
        }))
    );

    const batchResults = await Promise.all(promises);
    batchResults.forEach(res => {
      if (res.success) {
        results.push(res.question);
      } else {
        errors.push({ channel: res.channel, reason: res.error });
      }
    });

    // Progress update
    console.log(`   Batch complete: ${batchResults.filter(r => r.success).length}/${batch.length} successful`);
  }

  return { results, errors };
}

// Get all channels - fetches from database AND includes all configured channels (including certifications)
async function getAllChannels() {
  const dbChannels = await getAllChannelsFromDb();
  // Merge with hardcoded configs to ensure we have sub-channel info
  const hardcodedChannels = Object.keys(channelConfigs);
  // Include certification channels from certificationDomains
  const certificationChannels = CERTIFICATION_CHANNELS;
  
  // Also include fundamentals channels that might not be in channelConfigs
  const fundamentalsChannels = [
    'data-structures', 'complexity-analysis', 'dynamic-programming', 
    'bit-manipulation', 'design-patterns', 'concurrency', 'math-logic', 'low-level'
  ];
  
  // Return unique channels from all sources
  const allChannels = new Set([
    ...dbChannels, 
    ...hardcodedChannels, 
    ...certificationChannels,
    ...fundamentalsChannels
  ]);
  
  console.log(`Channel sources: DB=${dbChannels.length}, Config=${hardcodedChannels.length}, Certs=${certificationChannels.length}, Fundamentals=${fundamentalsChannels.length}`);
  console.log(`Total unique channels: ${allChannels.size}`);
  
  return Array.from(allChannels);
}

function getRandomSubChannel(channel) {
  const configs = channelConfigs[channel];
  if (!configs || configs.length === 0) {
    return { subChannel: 'general', tags: [channel] };
  }
  return configs[Math.floor(Math.random() * configs.length)];
}

/**
 * Get sub-channel with fewest questions for a given channel
 * Prioritizes sub-channels that have no questions or fewer questions
 */
async function getPrioritizedSubChannel(channel, subChannelCounts) {
  const configs = channelConfigs[channel];
  if (!configs || configs.length === 0) {
    return { subChannel: 'general', tags: [channel] };
  }
  
  // Get counts for this channel's sub-channels
  const channelSubCounts = subChannelCounts[channel] || {};
  
  // Sort sub-channels by question count (ascending)
  const sortedConfigs = [...configs].map(config => ({
    ...config,
    count: channelSubCounts[config.subChannel] || 0
  })).sort((a, b) => a.count - b.count);
  
  // Prioritize sub-channels with 0 questions first
  const emptySubChannels = sortedConfigs.filter(c => c.count === 0);
  if (emptySubChannels.length > 0) {
    // Random selection among empty sub-channels
    return emptySubChannels[Math.floor(Math.random() * emptySubChannels.length)];
  }
  
  // Otherwise, weighted selection favoring lower counts
  const minCount = sortedConfigs[0].count;
  const lowCountSubChannels = sortedConfigs.filter(c => c.count <= minCount * 1.5);
  return lowCountSubChannels[Math.floor(Math.random() * lowCountSubChannels.length)];
}

// Prioritize channels with fewer questions using weighted selection
// ALWAYS selects channels with 0 questions first before using weighted selection
function selectChannelsWeighted(channelCounts, allChannels, limit) {
  // Sort channels by question count
  const sortedByCount = [...allChannels].map(ch => ({
    channel: ch,
    count: channelCounts[ch] || 0,
    isCertification: CERTIFICATION_CHANNELS.includes(ch)
  })).sort((a, b) => a.count - b.count);
  
  // Calculate statistics
  const counts = sortedByCount.map(c => c.count);
  const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
  const medianCount = counts[Math.floor(counts.length / 2)];
  const maxCount = Math.max(...counts, 1);
  
  // PRIORITY 1: ALWAYS select ALL channels with 0 questions first (MANDATORY)
  const emptyChannels = sortedByCount.filter(c => c.count === 0).map(c => c.channel);
  if (emptyChannels.length > 0) {
    console.log(`\n🎯 CRITICAL PRIORITY: Found ${emptyChannels.length} channels with 0 questions - MUST ADD AT LEAST 1 EACH`);
    emptyChannels.forEach(ch => {
      const isCert = CERTIFICATION_CHANNELS.includes(ch);
      console.log(`   ${ch}${isCert ? ' (certification)' : ''} - NEEDS IMMEDIATE ATTENTION`);
    });
    
    // If we have empty channels, they take absolute priority
    // Allocate at least 1 question per empty channel
    const emptyChannelAllocation = Math.min(emptyChannels.length, limit);
    
    // Prioritize certifications among empty channels
    const emptyCerts = emptyChannels.filter(ch => CERTIFICATION_CHANNELS.includes(ch));
    const emptyNonCerts = emptyChannels.filter(ch => !CERTIFICATION_CHANNELS.includes(ch));
    const prioritizedEmpty = [...emptyCerts, ...emptyNonCerts];
    
    // If we have more empty channels than limit, select the most important ones
    if (emptyChannels.length >= limit) {
      console.log(`   ⚠️  ${emptyChannels.length} empty channels but only ${limit} slots available`);
      console.log(`   Selecting ${limit} highest priority empty channels (certifications first)`);
      return prioritizedEmpty.slice(0, limit);
    }
    
    // Otherwise, allocate 1 question to each empty channel, then fill remaining slots
    console.log(`   Allocating 1 question to each of ${emptyChannels.length} empty channels`);
    console.log(`   Remaining ${limit - emptyChannels.length} slots for weighted selection`);
    
    const selected = [...prioritizedEmpty];
    const remainingLimit = limit - selected.length;
    
    if (remainingLimit > 0) {
      // Fill remaining slots with weighted selection from non-empty channels
      const nonEmptyChannels = sortedByCount.filter(c => c.count > 0).map(c => c.channel);
      const additionalSelections = selectFromNonEmpty(channelCounts, nonEmptyChannels, remainingLimit, maxCount);
      selected.push(...additionalSelections);
    }
    
    return selected;
  }
  
  // No empty channels - proceed with normal weighted selection
  return selectFromNonEmpty(channelCounts, allChannels, limit, maxCount);
}

// Helper function for weighted selection from non-empty channels
function selectFromNonEmpty(channelCounts, channels, limit, maxCount) {
  // Exclude channels in top 25% (those with most questions)
  const sortedByCount = [...channels].map(ch => ({
    channel: ch,
    count: channelCounts[ch] || 0
  })).sort((a, b) => a.count - b.count);
  
  const counts = sortedByCount.map(c => c.count);
  const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
  const excludeThreshold = counts[Math.floor(counts.length * 0.75)];
  
  const eligibleChannels = sortedByCount
    .filter(c => c.count <= excludeThreshold)
    .map(c => c.channel);
  
  console.log(`\n📈 Weighted Selection Statistics:`);
  console.log(`   Average: ${avgCount.toFixed(1)} questions`);
  console.log(`   Exclude threshold (top 25%): >${excludeThreshold} questions`);
  console.log(`   Eligible channels: ${eligibleChannels.length}/${channels.length}`);
  
  // If all channels are excluded (unlikely), fall back to bottom half
  const channelsToUse = eligibleChannels.length > 0 
    ? eligibleChannels 
    : sortedByCount.slice(0, Math.ceil(sortedByCount.length / 2)).map(c => c.channel);
  
  // Calculate weights - exponential preference for channels with fewer questions
  // Weight formula: (maxCount - count + 1)^3 / maxCount^2
  const weights = channelsToUse.map(ch => {
    const count = channelCounts[ch] || 0;
    const deficit = maxCount - count + 1;
    // Cubic weight for strong preference toward low-count channels
    let weight = Math.pow(deficit, 3) / Math.pow(maxCount, 2);
    
    // Extra boost for certifications (they need more content)
    if (CERTIFICATION_CHANNELS.includes(ch)) {
      weight *= 2;
    }
    
    return weight;
  });
  
  const selected = [];
  const available = [...channelsToUse];
  const availableWeights = [...weights];
  
  while (selected.length < limit && available.length > 0) {
    // Weighted random selection
    const totalWeight = availableWeights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let idx = 0;
    
    for (let i = 0; i < availableWeights.length; i++) {
      random -= availableWeights[i];
      if (random <= 0) {
        idx = i;
        break;
      }
    }
    
    selected.push(available[idx]);
    available.splice(idx, 1);
    availableWeights.splice(idx, 1);
  }
  
  return selected;
}

// Get channels that are significantly below average (need the most help)
function getLaggingChannels(channelCounts, allChannels, targetPerChannel = 20) {
  const sortedByCount = [...allChannels].map(ch => ({
    channel: ch,
    count: channelCounts[ch] || 0,
    deficit: Math.max(0, targetPerChannel - (channelCounts[ch] || 0))
  })).sort((a, b) => b.deficit - a.deficit);
  
  // Return channels that are below target, sorted by how far below they are
  return sortedByCount.filter(c => c.deficit > 0);
}

async function main() {
  console.log('=== 🚀 Creator Bot - Crafting New Questions ===\n');

  const inputDifficulty = process.env.INPUT_DIFFICULTY || 'random';
  const inputLimit = parseInt(process.env.INPUT_LIMIT || '0', 10);
  const inputChannelRaw = process.env.INPUT_CHANNEL || null; // Specific channel(s) to generate for
  const balanceChannels = process.env.BALANCE_CHANNELS !== 'false'; // Default to true
  
  // Get all channels from database (not hardcoded list)
  const allChannels = await getAllChannels();
  console.log(`Found ${allChannels.length} channels in database`);
  
  // Parse input channels (can be comma-separated list)
  let inputChannels = null;
  if (inputChannelRaw) {
    inputChannels = inputChannelRaw.split(',').map(ch => ch.trim()).filter(Boolean);
    
    // Validate all input channels
    const invalidChannels = inputChannels.filter(ch => !allChannels.includes(ch));
    if (invalidChannels.length > 0) {
      console.error(`❌ Invalid channels: ${invalidChannels.join(', ')}`);
      console.log(`Available channels: ${allChannels.join(', ')}`);
      process.exit(1);
    }
    console.log(`Input channels: ${inputChannels.join(', ')}`);
  }
  
  // Get channel question counts efficiently (single query instead of fetching all questions)
  const channelCounts = await getChannelQuestionCounts();
  const totalQuestionCount = Object.values(channelCounts).reduce((a, b) => a + b, 0);
  console.log(`Database has ${totalQuestionCount} existing questions`);
  
  // Get sub-channel counts for prioritization
  let subChannelCounts = {};
  try {
    subChannelCounts = await getSubChannelQuestionCounts();
    console.log('Loaded sub-channel question counts for prioritization');
  } catch (e) {
    console.log('Sub-channel counts not available, using random selection');
  }
  
  // Show channel distribution
  console.log('\n📊 Channel Distribution:');
  const sortedChannels = [...allChannels].sort((a, b) => (channelCounts[a] || 0) - (channelCounts[b] || 0));
  sortedChannels.slice(0, 5).forEach(ch => {
    console.log(`   ${ch}: ${channelCounts[ch] || 0} questions (LOW)`);
  });
  console.log('   ...');
  sortedChannels.slice(-3).forEach(ch => {
    console.log(`   ${ch}: ${channelCounts[ch] || 0} questions`);
  });
  
  let channels;
  const limit = inputLimit > 0 ? inputLimit : allChannels.length;
  
  // Show lagging channels that need the most attention
  const laggingChannels = getLaggingChannels(channelCounts, allChannels, 20);
  if (laggingChannels.length > 0) {
    console.log(`\n⚠️  Channels below target (20 questions):`);
    laggingChannels.slice(0, 8).forEach(c => {
      console.log(`   ${c.channel}: ${c.count} questions (need ${c.deficit} more)`);
    });
    if (laggingChannels.length > 8) {
      console.log(`   ... and ${laggingChannels.length - 8} more`);
    }
  }
  
  // If specific channel(s) provided, use those channels
  if (inputChannels && inputChannels.length > 0) {
    if (inputChannels.length === 1) {
      // Single channel: repeat it for the limit
      channels = Array(limit).fill(inputChannels[0]);
      console.log(`\n🎯 Specific channel selected: ${inputChannels[0]} (generating ${limit} question(s))`);
      console.log(`   Current count: ${channelCounts[inputChannels[0]] || 0} questions`);
    } else {
      // Multiple channels: use weighted selection among them
      channels = selectChannelsWeighted(channelCounts, inputChannels, limit);
      console.log(`\n🎯 Target channels (${inputChannels.length} specified):`);
      channels.forEach(ch => {
        const count = channelCounts[ch] || 0;
        console.log(`   ${ch}: ${count} questions`);
      });
    }
  } else if (balanceChannels && inputLimit > 0) {
    // Use weighted selection to prioritize channels with fewer questions
    // This will EXCLUDE channels in the top 25% by question count
    channels = selectChannelsWeighted(channelCounts, allChannels, limit);
    console.log(`\n🎯 Weighted selection (excluding top 25%, prioritizing lagging channels):`);
    channels.forEach(ch => {
      const count = channelCounts[ch] || 0;
      const avgCount = Object.values(channelCounts).reduce((a, b) => a + b, 0) / allChannels.length;
      const status = count < avgCount * 0.5 ? '🔴 CRITICAL' : count < avgCount ? '🟡 LOW' : '🟢';
      console.log(`   ${ch}: ${count} questions ${status}`);
    });
  } else if (inputLimit > 0) {
    channels = allChannels.sort(() => Math.random() - 0.5).slice(0, limit);
    console.log(`\nRandom selection: ${channels.join(', ')}`);
  } else {
    channels = allChannels;
    console.log(`\nProcessing all ${channels.length} channels`);
  }

  // Use concurrent processing with limit of 3 simultaneous channels
  console.log(`\n🚀 Starting concurrent question generation (3 channels at a time)...`);
  const { results: addedQuestions, errors: failedAttempts } = await processChannelsWithConcurrency(
    channels,
    subChannelCounts,
    inputDifficulty,
    allChannels,
    3  // Concurrency limit
  );

  const totalQuestions = await getQuestionCount();
  console.log('\n\n=== SUMMARY ===');
  console.log(`Total Questions Added: ${addedQuestions.length}/${channels.length}`);
  
  if (addedQuestions.length > 0) {
    console.log('\n✅ Successfully Added Questions:');
    addedQuestions.forEach((q, idx) => {
      console.log(`  ${idx + 1}. [${q.id}] (${q.difficulty})`);
      console.log(`     Q: ${q.question.substring(0, 70)}...`);
    });
  }

  if (failedAttempts.length > 0) {
    console.log(`\n❌ Failed Attempts: ${failedAttempts.length}`);
    failedAttempts.forEach(f => console.log(`  - ${f.channel}: ${f.reason}`));
  }

  console.log(`\nTotal Questions in Database: ${totalQuestions}`);
  console.log('=== END SUMMARY ===\n');

  if (addedQuestions.length > 0) {
    const channelsAffected = addedQuestions.flatMap(q => q.mappedChannels.map(m => m.channel));
    logQuestionsAdded(addedQuestions.length, channelsAffected, addedQuestions.map(q => q.id));
  }

  writeGitHubOutput({
    added_count: addedQuestions.length,
    failed_count: failedAttempts.length,
    total_questions: totalQuestions,
    added_ids: addedQuestions.map(q => q.id).join(',')
  });
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
