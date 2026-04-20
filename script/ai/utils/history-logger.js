/**
 * History Logger Utility
 *
 * Provides functions for bots and scripts to log changes to questions.
 * This creates a complete audit trail accessible via the UI.
 */

import { dbClient } from '../../db/pg-client.js';

/**
 * Log a history event for a question
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
    await dbClient.execute({
      sql: `INSERT INTO question_history
            (question_id, question_type, event_type, event_source, source_name,
             changes_summary, changed_fields, before_snapshot, after_snapshot,
             reason, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        new Date().toISOString(),
      ],
    });

    return true;
  } catch (error) {
    console.error('Failed to log history:', error);
    return false;
  }
}

export async function logCreated(questionId, questionType, sourceName, reason = null, metadata = null) {
  return logHistory({ questionId, questionType, eventType: 'created', eventSource: 'bot', sourceName, changesSummary: `Question created by ${sourceName}`, reason, metadata });
}

export async function logUpdated(questionId, questionType, sourceName, beforeState, afterState, reason = null) {
  const changedFields = [];
  const relevantFields = ['question', 'answer', 'explanation', 'difficulty', 'tags', 'companies', 'hints'];
  for (const field of relevantFields) {
    if (JSON.stringify(beforeState[field]) !== JSON.stringify(afterState[field])) {
      changedFields.push(field);
    }
  }
  return logHistory({ questionId, questionType, eventType: 'updated', eventSource: 'bot', sourceName, changesSummary: `Updated ${changedFields.length} field(s): ${changedFields.join(', ')}`, changedFields, beforeSnapshot: beforeState, afterSnapshot: afterState, reason });
}

export async function logImproved(questionId, questionType, sourceName, improvements, beforeState, afterState, metadata = null) {
  return logHistory({ questionId, questionType, eventType: 'improved', eventSource: 'bot', sourceName, changesSummary: improvements, beforeSnapshot: beforeState, afterSnapshot: afterState, metadata });
}

export async function logFlagged(questionId, questionType, sourceName, reason, metadata = null) {
  return logHistory({ questionId, questionType, eventType: 'flagged', eventSource: 'bot', sourceName, changesSummary: `Question flagged: ${reason}`, reason, metadata });
}

export async function logVerified(questionId, questionType, sourceName, result, metadata = null) {
  return logHistory({ questionId, questionType, eventType: 'verified', eventSource: 'bot', sourceName, changesSummary: `Verification ${result ? 'passed' : 'failed'}`, metadata: { ...metadata, verificationResult: result } });
}

export async function logEnriched(questionId, questionType, sourceName, enrichments, metadata = null) {
  return logHistory({ questionId, questionType, eventType: 'enriched', eventSource: 'bot', sourceName, changesSummary: `Enriched with: ${enrichments.join(', ')}`, changedFields: enrichments, metadata });
}

export async function getHistory(questionId, questionType = 'question', limit = 50) {
  const result = await dbClient.execute({
    sql: `SELECT * FROM question_history WHERE question_id = ? AND question_type = ? ORDER BY created_at DESC LIMIT ?`,
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

export default { logHistory, logCreated, logUpdated, logImproved, logFlagged, logVerified, logEnriched, getHistory };
