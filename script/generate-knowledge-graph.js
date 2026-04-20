#!/usr/bin/env node
/**
 * Generate Knowledge Graph
 * 
 * Pre-computes knowledge connections for static site:
 * - Cross-channel links between related questions
 * - Topic clusters
 * - Coverage gaps per channel
 * - Hub questions (highly connected)
 * 
 * Output: client/public/data/knowledge-graph.json
 */

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import ragService from './ai/services/rag-enhanced-generation.js';
import vectorDB from './ai/services/vector-db.js';

const OUTPUT_DIR = 'client/public/data';
const CHANNELS = ['system-design', 'algorithms', 'frontend', 'backend', 'devops', 'database', 'security', 'sre'];

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('🕸️  KNOWLEDGE GRAPH GENERATOR');
  console.log('═'.repeat(60));
  
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  // Initialize vector DB
  console.log('\n📦 Initializing Vector DB...');
  await vectorDB.init();
  
  const stats = await vectorDB.getStats();
  console.log(`   ${stats.pointsCount || 0} questions indexed`);
  
  if (!stats.pointsCount || stats.pointsCount === 0) {
    console.log('⚠️  No questions in vector DB. Run pnpm vector:sync first.');
    return;
  }

  // 1. Find coverage gaps per channel
  console.log('\n🔍 Analyzing coverage gaps...');
  const coverageGaps = {};
  
  for (const channel of CHANNELS) {
    try {
      const gaps = await ragService.findCoverageGaps(channel);
      coverageGaps[channel] = gaps;
      console.log(`   ${channel}: ${gaps.gaps?.length || 0} gaps found`);
    } catch (e) {
      console.log(`   ${channel}: error - ${e.message}`);
      coverageGaps[channel] = { gaps: [], error: e.message };
    }
  }

  // 2. Build cross-channel links for sample questions
  console.log('\n🔗 Building cross-channel links...');
  const crossLinks = {};
  
  for (const channel of CHANNELS.slice(0, 3)) { // Sample from first 3 channels
    const questions = await vectorDB.semanticSearch(channel, {
      limit: 10,
      threshold: 0.05,
      channel
    });
    
    for (const q of questions.slice(0, 5)) {
      try {
        const links = await ragService.findCrossChannelLinks(q.id, q.question, channel);
        if (links.totalLinkedChannels > 0) {
          crossLinks[q.id] = links;
        }
      } catch (e) {
        // Skip on error
      }
    }
    console.log(`   ${channel}: ${Object.keys(crossLinks).length} questions linked`);
  }

  // 3. Find hub questions (highly connected)
  console.log('\n⭐ Identifying hub questions...');
  const hubs = [];
  
  for (const channel of CHANNELS) {
    const questions = await vectorDB.semanticSearch(channel, {
      limit: 20,
      threshold: 0.05,
      channel
    });
    
    for (const q of questions) {
      const similar = await vectorDB.findSimilar(q.question, {
        limit: 10,
        threshold: 0.2
      });
      
      if (similar.length >= 5) {
        hubs.push({
          id: q.id,
          question: q.question.substring(0, 100),
          channel: q.channel,
          connections: similar.length
        });
      }
    }
  }
  
  // Sort by connections
  hubs.sort((a, b) => b.connections - a.connections);
  console.log(`   Found ${hubs.length} hub questions`);

  // 4. Save knowledge graph
  const knowledgeGraph = {
    generated: new Date().toISOString(),
    stats: {
      totalQuestions: stats.pointsCount,
      channelsAnalyzed: CHANNELS.length,
      hubsFound: hubs.length,
      crossLinksGenerated: Object.keys(crossLinks).length
    },
    coverageGaps,
    hubs: hubs.slice(0, 50), // Top 50 hubs
    crossLinks,
    channels: CHANNELS
  };

  await fs.writeFile(
    path.join(OUTPUT_DIR, 'knowledge-graph.json'),
    JSON.stringify(knowledgeGraph, null, 2)
  );

  console.log('\n✅ Knowledge graph saved to client/public/data/knowledge-graph.json');
  console.log(`   - ${Object.keys(coverageGaps).length} channels analyzed`);
  console.log(`   - ${hubs.length} hub questions identified`);
  console.log(`   - ${Object.keys(crossLinks).length} cross-channel links`);
}

main().catch(console.error);
