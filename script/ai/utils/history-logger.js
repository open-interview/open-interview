/**
 * History Logger Utility
 * 
 * Provides functions for bots and scripts to log changes to questions.
 * This creates a complete audit trail accessible via the UI.
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:questions.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

/**
 * Log a history event for a question
 * 
 * @param {Object} params
 * @param {string} params.questionId - The question ID
 * @param {string} params.questionType - 'question', 'test', or 'coding'
 * @param {string} params.eventType - 'created', 'updated', 'improved', 'flagged', 'verified', 'enriched', 'deleted', 'restored'
 * @param {string} params.eventSource - 'bot', 'user', 'system', 'import'
 * @param {string} [params.sourceName] - Specific bot name or user identifier
 * @param {string} [params.changesSummary] - Human-readable summary of changes
 * @param {string[]} [params.changedFields] - Array of field names that changed
 * @param {Object} [params.beforeSnapshot] - State before the change
 * @param {Object} [params.afterSnapshot] - State after the change
 * @param {string} [params.reason] - Why this change was made
 * @param {Object} [params.metadata] - Additional context
 */
export async function logHistory({
  questionId,
  questionType = 'question',
  eventType,
  eventSource,
  sourceName = null,
  changesSummary = null,
  changedFields = null,
  beforeSnapshot = null,
  afterSnapshot = null,
  reason = null,
  metadata = null,
}) {
  if (!questionId || !eventType || !eventSource) {
    throw new Error('Missing required fields: questionId, eventType, eventSource');
  }

  try {
    await client.execute({
      sql: `INSERT INTO question_history 
            (question_id, question_type, event_type, event_source, source_name, 
             changes_summary, changed_fields, before_snapshot, after_snapshot, 
             reason, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        questionId,
        questionType,
        eventType,
        eventSource,
        sourceName,
        changesSummary,
        changedFields ? JSON.stringify(changedFields) : null,
        beforeSnapshot ? JSON.stringify(beforeSnapshot) : null,
        afterSnapshot ? JSON.stringify(afterSnapshot) : null,
        reason,
        metadata ? JSON.stringify(metadata) : null,
      ],
    });
    
    return true;
  } catch (error) {
    console.error('Failed to log history:', error);
    return false;
  }
}

/**
 * Log a question creation event
 */
export async function logCreated(questionId, questionType, sourceName, reason = null, metadata = null) {
  return logHistory({
    questionId,
    questionType,
    eventType: 'created',
    eventSource: 'bot',
    sourceName,
    changesSummary: `Question created by ${sourceName}`,
    reason,
    metadata,
  });
}

/**
 * Log a question update event with before/after comparison
 */
export async function logUpdated(questionId, questionType, sourceName, beforeState, afterState, reason = null) {
  // Detect which fields changed
  const changedFields = [];
  const relevantFields = ['question', 'answer', 'explanation', 'difficulty', 'tags', 'companies', 'hints'];
  
  for (const field of relevantFields) {
    const before = JSON.stringify(beforeState[field]);
    const after = JSON.stringify(afterState[field]);
    if (before !== after) {
      changedFields.push(field);
    }
  }

  return logHistory({
    questionId,
    questionType,
    eventType: 'updated',
    eventSource: 'bot',
    sourceName,
    changesSummary: `Updated ${changedFields.length} field(s): ${changedFields.join(', ')}`,
    changedFields,
    beforeSnapshot: beforeState,
    afterSnapshot: afterState,
    reason,
  });
}

/**
 * Log a question improvement event (AI-enhanced)
 */
export async function logImproved(questionId, questionType, sourceName, improvements, beforeState, afterState, metadata = null) {
  return logHistory({
    questionId,
    questionType,
    eventType: 'improved',
    eventSource: 'bot',
    sourceName,
    changesSummary: improvements,
    beforeSnapshot: beforeState,
    afterSnapshot: afterState,
    metadata,
  });
}

/**
 * Log a question flagged event
 */
export async function logFlagged(questionId, questionType, sourceName, reason, metadata = null) {
  return logHistory({
    questionId,
    questionType,
    eventType: 'flagged',
    eventSource: 'bot',
    sourceName,
    changesSummary: `Question flagged: ${reason}`,
    reason,
    metadata,
  });
}

/**
 * Log a question verification event
 */
export async function logVerified(questionId, questionType, sourceName, result, metadata = null) {
  return logHistory({
    questionId,
    questionType,
    eventType: 'verified',
    eventSource: 'bot',
    sourceName,
    changesSummary: `Verification ${result ? 'passed' : 'failed'}`,
    metadata: { ...metadata, verificationResult: result },
  });
}

/**
 * Log a question enrichment event (added videos, companies, etc.)
 */
export async function logEnriched(questionId, questionType, sourceName, enrichments, metadata = null) {
  return logHistory({
    questionId,
    questionType,
    eventType: 'enriched',
    eventSource: 'bot',
    sourceName,
    changesSummary: `Enriched with: ${enrichments.join(', ')}`,
    changedFields: enrichments,
    metadata,
  });
}

/**
 * Get history for a question
 */
export async function getHistory(questionId, questionType = 'question', limit = 50) {
  const result = await client.execute({
    sql: `SELECT * FROM question_history 
          WHERE question_id = ? AND question_type = ? 
          ORDER BY created_at DESC 
          LIMIT ?`,
    args: [questionId, questionType, limit],
  });

  return result.rows.map(row => ({
    id: row.id,
    questionId: row.question_id,
    questionType: row.question_type,
    eventType: row.event_type,
    eventSource: row.event_source,
    sourceName: row.source_name,
    changesSummary: row.changes_summary,
    changedFields: row.changed_fields ? JSON.parse(row.changed_fields) : [],
    beforeSnapshot: row.before_snapshot ? JSON.parse(row.before_snapshot) : null,
    afterSnapshot: row.after_snapshot ? JSON.parse(row.after_snapshot) : null,
    reason: row.reason,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    createdAt: row.created_at,
  }));
}

export default {
  logHistory,
  logCreated,
  logUpdated,
  logImproved,
  logFlagged,
  logVerified,
  logEnriched,
  getHistory,
};
