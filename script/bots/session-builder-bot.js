#!/usr/bin/env node
/**
 * Session Builder Bot - LangGraph Architecture
 * 
 * Builds question relationship graph and generates voice sessions:
 * 1. Analyzes questions to find related topics
 * 2. Creates relationship edges between questions
 * 3. Generates coherent voice sessions from related questions
 * 
 * LangGraph Pipeline:
 * Load Questions → Build Graph → Generate Sessions → Save
 */

import 'dotenv/config';
import { getDb, initBotTables } from './shared/db.js';
import { logAction } from './shared/ledger.js';
import { startRun, completeRun, failRun, updateRunStats } from './shared/runs.js';
import { runWithRetries, parseJson } from '../utils.js';

const BOT_NAME = 'session-builder';
const db = getDb();

// Parse CLI args
const args = process.argv.slice(2);
const getArg = (name) => { const a = args.find(a => a.startsWith(`--${name}=`)); return a ? a.split('=')[1] : null; };
const options = {
  dryRun: args.includes('--dry-run'),
  channel: getArg('channel'),
  limit: getArg('limit') ? parseInt(getArg('limit')) : null,
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err.message);
  process.exitCode = 1;
});

// ============================================
// LANGGRAPH NODE DEFINITIONS
// ============================================

/**
 * Node 1: Load Voice-Suitable Questions
 */
async function loadQuestionsNode(state) {
  console.log('\n📥 [Load] Fetching voice-suitable questions...');
  if (options.channel) console.log(`   Channel filter: ${options.channel}`);
  if (options.limit) console.log(`   Limit: ${options.limit}`);

  let sql = `SELECT id, question, answer, explanation, channel, sub_channel, difficulty, tags, voice_keywords
          FROM questions 
          WHERE voice_suitable = 1 
          AND status = 'active'
          AND voice_keywords IS NOT NULL`;
  const sqlArgs = [];
  if (options.channel) { sql += ' AND channel = ?'; sqlArgs.push(options.channel); }
  sql += ' ORDER BY channel, sub_channel';
  if (options.limit) { sql += ' LIMIT ?'; sqlArgs.push(options.limit); }

  const result = await db.execute({ sql, args: sqlArgs });
  
  const questions = result.rows.map(row => ({
    id: row.id,
    question: row.question,
    answer: row.answer,
    explanation: row.explanation,
    channel: row.channel,
    subChannel: row.sub_channel,
    difficulty: row.difficulty,
    tags: row.tags ? JSON.parse(row.tags) : [],
    voiceKeywords: row.voice_keywords ? JSON.parse(row.voice_keywords) : []
  }));
  
  console.log(`   Found ${questions.length} voice-suitable questions`);
  
  // Group by channel
  const byChannel = {};
  for (const q of questions) {
    if (!byChannel[q.channel]) byChannel[q.channel] = [];
    byChannel[q.channel].push(q);
  }
  
  console.log('   Channels:', Object.keys(byChannel).join(', '));
  
  return { ...state, questions, byChannel };
}

/**
 * Node 2: Build Relationship Graph
 * Uses LLM to find related questions within each channel
 */
async function buildGraphNode(state) {
  console.log('\n🔗 [Build Graph] Finding question relationships...');
  
  const { byChannel } = state;
  const relationships = [];
  
  for (const [channel, questions] of Object.entries(byChannel)) {
    if (questions.length < 3) continue;
    
    console.log(`\n   Processing ${channel} (${questions.length} questions)...`);
    
    // Process in batches to find relationships
    const batchSize = 10;
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      const batchRelations = await findRelationships(batch, questions);
      relationships.push(...batchRelations);
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  console.log(`\n   Total relationships found: ${relationships.length}`);
  return { ...state, relationships };
}

/**
 * Node 3: Generate Voice Sessions
 * Creates coherent sessions from related questions
 */
async function generateSessionsNode(state) {
  console.log('\n📦 [Generate Sessions] Creating voice sessions...');
  
  const { byChannel, relationships } = state;
  const sessions = [];
  
  // Build adjacency list from relationships
  const graph = buildAdjacencyList(relationships);
  
  for (const [channel, questions] of Object.entries(byChannel)) {
    if (questions.length < 4) continue;
    
    console.log(`\n   Generating sessions for ${channel}...`);
    
    // Find clusters of related questions
    const clusters = findClusters(questions, graph);
    
    for (const cluster of clusters) {
      if (cluster.length < 4) continue;
      
      // Generate session from cluster
      const session = await generateSession(cluster, channel);
      if (session) {
        sessions.push(session);
        console.log(`   ✓ Session: ${session.topic} (${session.totalQuestions} questions)`);
      }
    }
  }
  
  console.log(`\n   Total sessions generated: ${sessions.length}`);
  return { ...state, sessions };
}

/**
 * Node 4: Save to Database (or dry-run print)
 */
async function saveNode(state) {
  const { relationships, sessions } = state;

  if (options.dryRun) {
    console.log('\n🔍 [Dry Run] Would save the following sessions:');
    for (const session of sessions) {
      console.log(`\n  Session: ${session.topic}`);
      console.log(`    Channel: ${session.channel} | Difficulty: ${session.difficulty}`);
      console.log(`    Questions (${session.totalQuestions}): ${session.questionIds.join(', ')}`);
      console.log(`    Description: ${session.description}`);
    }
    console.log(`\n  Total relationships: ${relationships.length}`);
    console.log(`  Total sessions: ${sessions.length}`);
    return { ...state, savedRelationships: 0, savedSessions: 0 };
  }

  console.log('\n💾 [Save] Persisting to database...');
  let savedRelationships = 0;
  let savedSessions = 0;

  // Clear existing relationships and sessions (rebuild fresh)
  await db.execute('DELETE FROM question_relationships');
  await db.execute('DELETE FROM voice_sessions');

  // Save relationships
  for (const rel of relationships) {
    try {
      await db.execute({
        sql: `INSERT INTO question_relationships 
              (source_question_id, target_question_id, relationship_type, strength)
              VALUES (?, ?, ?, ?)`,
        args: [rel.sourceId, rel.targetId, rel.type, rel.strength]
      });
      savedRelationships++;
    } catch (e) {
      console.error(`   Failed to save relationship: ${e.message}`);
    }
  }

  // Save sessions with deduplication
  for (const session of sessions) {
    try {
      // Dedup: check if session with same sorted question_ids already exists
      const sortedIds = JSON.stringify([...session.questionIds].sort());
      const existing = await db.execute({
        sql: `SELECT id FROM voice_sessions WHERE json(question_ids) = json(?)`,
        args: [sortedIds]
      });
      // Fallback: manual check if json() not supported
      if (existing.rows.length === 0) {
        const allSessions = await db.execute({ sql: `SELECT id, question_ids FROM voice_sessions`, args: [] });
        const isDup = allSessions.rows.some(r => {
          try { return JSON.stringify(JSON.parse(r.question_ids).sort()) === sortedIds; } catch { return false; }
        });
        if (isDup) {
          console.log(`   ⚠️ Duplicate session skipped: ${session.topic}`);
          continue;
        }
      } else if (existing.rows.length > 0) {
        console.log(`   ⚠️ Duplicate session skipped: ${session.topic}`);
        continue;
      }

      await db.execute({
        sql: `INSERT INTO voice_sessions 
              (id, topic, description, channel, difficulty, question_ids, total_questions, estimated_minutes, last_updated)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          session.id,
          session.topic,
          session.description,
          session.channel,
          session.difficulty,
          JSON.stringify(session.questionIds),
          session.totalQuestions,
          session.estimatedMinutes,
          new Date().toISOString()
        ]
      });
      savedSessions++;

      await logAction({
        botName: BOT_NAME,
        action: 'create',
        itemType: 'voice_session',
        itemId: session.id,
        afterState: session,
        reason: 'Generated voice session from related questions'
      });
    } catch (e) {
      console.error(`   Failed to save session: ${e.message}`);
    }
  }

  console.log(`   Saved ${savedRelationships} relationships`);
  console.log(`   Saved ${savedSessions} sessions`);

  return { ...state, savedRelationships, savedSessions };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function findRelationships(batch, allQuestions) {
  const relationships = [];
  
  const questionSummaries = batch.map(q => ({
    id: q.id,
    question: q.question.substring(0, 100),
    keywords: q.voiceKeywords.slice(0, 5).join(', ')
  }));
  
  const prompt = `Analyze these interview questions and find which ones are closely related.

Questions:
${questionSummaries.map((q, i) => `${i + 1}. [${q.id}] ${q.question}... (keywords: ${q.keywords})`).join('\n')}

Find pairs of questions that:
1. Cover the same concept at different depths (prerequisite → follow_up)
2. Are about closely related topics (related)
3. One dives deeper into a subtopic of another (deeper_dive)

Return ONLY valid JSON array (no markdown):
[
  {"source": "q-xxx", "target": "q-yyy", "type": "prerequisite|follow_up|related|deeper_dive", "strength": 70}
]

Rules:
- Only include pairs with strength >= 60
- source/target must be actual question IDs from the list
- Max 10 relationships per batch
- Strength: 60-70 = somewhat related, 70-85 = closely related, 85-100 = very closely related`;

  try {
    const response = await runWithRetries(prompt);
    const result = parseJson(response);
    
    if (Array.isArray(result)) {
      for (const rel of result) {
        const sourceExists = batch.some(q => q.id === rel.source);
        const targetExists = batch.some(q => q.id === rel.target) || 
                            allQuestions.some(q => q.id === rel.target);
        
        if (sourceExists && targetExists && rel.source !== rel.target) {
          relationships.push({
            sourceId: rel.source,
            targetId: rel.target,
            type: rel.type || 'related',
            strength: Math.min(100, Math.max(0, rel.strength || 70))
          });
        }
      }
    }
  } catch (e) {
    if (e.isRefusal) {
      console.log(`   ⚠️ AI refused — falling back to keyword-overlap heuristic`);
    } else {
      console.error(`   Error finding relationships: ${e.message}, falling back to keyword-overlap heuristic`);
    }
    // Keyword-overlap fallback
    for (let i = 0; i < batch.length; i++) {
      for (let j = i + 1; j < batch.length; j++) {
        const a = batch[i], b = batch[j];
        const aKw = new Set(a.voiceKeywords.map(k => k.toLowerCase()));
        const bKw = new Set(b.voiceKeywords.map(k => k.toLowerCase()));
        const overlap = [...aKw].filter(k => bKw.has(k)).length;
        const union = new Set([...aKw, ...bKw]).size;
        if (union > 0 && overlap / union >= 0.3) {
          relationships.push({
            sourceId: a.id,
            targetId: b.id,
            type: 'related',
            strength: Math.round(60 + (overlap / union) * 40)
          });
        }
      }
    }
  }
  
  return relationships;
}

function buildAdjacencyList(relationships) {
  const graph = new Map();
  
  for (const rel of relationships) {
    if (!graph.has(rel.sourceId)) graph.set(rel.sourceId, []);
    if (!graph.has(rel.targetId)) graph.set(rel.targetId, []);
    
    graph.get(rel.sourceId).push({ id: rel.targetId, strength: rel.strength, type: rel.type });
    graph.get(rel.targetId).push({ id: rel.sourceId, strength: rel.strength, type: rel.type });
  }
  
  return graph;
}

function findClusters(questions, graph) {
  const clusters = [];
  const visited = new Set();
  
  // Sort questions by number of connections (most connected first)
  const questionIds = questions.map(q => q.id);
  const sortedIds = questionIds.sort((a, b) => {
    const aConns = graph.get(a)?.length || 0;
    const bConns = graph.get(b)?.length || 0;
    return bConns - aConns;
  });
  
  for (const startId of sortedIds) {
    if (visited.has(startId)) continue;
    
    // BFS to find connected cluster
    const cluster = [];
    const queue = [startId];
    const clusterVisited = new Set();
    
    while (queue.length > 0 && cluster.length < 8) {
      const currentId = queue.shift();
      if (clusterVisited.has(currentId)) continue;
      
      clusterVisited.add(currentId);
      const question = questions.find(q => q.id === currentId);
      if (question) {
        cluster.push(question);
        visited.add(currentId);
      }
      
      // Add connected questions to queue (sorted by strength)
      const connections = graph.get(currentId) || [];
      const sortedConns = connections
        .filter(c => !clusterVisited.has(c.id) && questionIds.includes(c.id))
        .sort((a, b) => b.strength - a.strength);
      
      for (const conn of sortedConns.slice(0, 3)) {
        queue.push(conn.id);
      }
    }
    
    if (cluster.length >= 4) {
      clusters.push(cluster);
    }
  }
  
  // Also create clusters from subChannels for questions without relationships
  const bySubChannel = {};
  for (const q of questions) {
    if (visited.has(q.id)) continue;
    if (!bySubChannel[q.subChannel]) bySubChannel[q.subChannel] = [];
    bySubChannel[q.subChannel].push(q);
  }
  
  for (const [subChannel, subQuestions] of Object.entries(bySubChannel)) {
    if (subQuestions.length >= 4) {
      // Sort by difficulty for natural progression
      const sorted = subQuestions.sort((a, b) => {
        const order = { beginner: 0, intermediate: 1, advanced: 2 };
        return (order[a.difficulty] || 1) - (order[b.difficulty] || 1);
      });
      clusters.push(sorted.slice(0, 6));
    }
  }
  
  return clusters;
}

async function generateSession(cluster, channel) {
  // Sort cluster by difficulty for natural progression
  const sorted = cluster.sort((a, b) => {
    const order = { beginner: 0, intermediate: 1, advanced: 2 };
    return (order[a.difficulty] || 1) - (order[b.difficulty] || 1);
  });
  
  // Take 4-6 questions
  const sessionQuestions = sorted.slice(0, 6);
  
  // Generate topic and description using LLM
  const questionTexts = sessionQuestions.map(q => q.question.substring(0, 80)).join('\n- ');
  
  const prompt = `Create a topic name and description for a voice interview session containing these questions:

Questions:
- ${questionTexts}

Channel: ${channel}

Return ONLY valid JSON (no markdown):
{
  "topic": "Short topic name (3-6 words)",
  "description": "One sentence describing what this session covers"
}`;

  try {
    const response = await runWithRetries(prompt);
    const result = parseJson(response);
    
    if (result?.topic) {
      // Determine overall difficulty
      const difficulties = sessionQuestions.map(q => q.difficulty);
      const difficulty = difficulties.includes('advanced') ? 'advanced' :
                        difficulties.includes('intermediate') ? 'intermediate' : 'beginner';
      
      return {
        id: `vs-${channel}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        topic: result.topic,
        description: result.description || `Practice session covering ${channel} concepts`,
        channel,
        difficulty,
        questionIds: sessionQuestions.map(q => q.id),
        totalQuestions: sessionQuestions.length,
        estimatedMinutes: sessionQuestions.length * 2
      };
    }
  } catch (e) {
    console.error(`   Error generating session: ${e.message}`);
  }
  
  // Fallback: use subChannel as topic
  const subChannel = sessionQuestions[0]?.subChannel || channel;
  return {
    id: `vs-${channel}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    topic: subChannel.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    description: `Practice session covering ${subChannel} concepts`,
    channel,
    difficulty: 'intermediate',
    questionIds: sessionQuestions.map(q => q.id),
    totalQuestions: sessionQuestions.length,
    estimatedMinutes: sessionQuestions.length * 2
  };
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('=== 🏗️ Session Builder Bot (LangGraph) ===\n');
  console.log('Options:', options);
  if (options.dryRun) console.log('🔍 DRY RUN — no DB writes\n');
  
  await initBotTables();
  
  const run = await startRun(BOT_NAME);
  const stats = { processed: 0, created: 0, updated: 0, deleted: 0 };
  
  try {
    let state = {};
    
    // Execute pipeline
    state = await loadQuestionsNode(state);
    state = await buildGraphNode(state);
    state = await generateSessionsNode(state);
    state = await saveNode(state);
    
    stats.processed = state.questions?.length || 0;
    stats.created = state.savedSessions || 0;
    
    await updateRunStats(run.id, stats);
    await completeRun(run.id, stats, {
      message: 'Session Builder completed',
      relationships: state.savedRelationships,
      sessions: state.savedSessions
    });
    
    console.log('\n=== Summary ===');
    console.log(`Questions processed: ${stats.processed}`);
    console.log(`Relationships created: ${state.savedRelationships}`);
    console.log(`Sessions created: ${state.savedSessions}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
    await failRun(run.id, error);
    process.exit(1);
  }
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch(console.error);
}

export { main as buildSessions };
export default { buildSessions: main };
