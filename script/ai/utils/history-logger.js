import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HISTORY_DIR = path.join(__dirname, '..', '..', '..', 'data', 'question-history');

function ensureDir() {
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
  }
}

function readHistory(questionId) {
  ensureDir();
  const filePath = path.join(HISTORY_DIR, `${questionId}.json`);
  if (fs.existsSync(filePath)) {
    try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { return []; }
  }
  return [];
}

function writeHistory(questionId, records) {
  ensureDir();
  fs.writeFileSync(path.join(HISTORY_DIR, `${questionId}.json`), JSON.stringify(records, null, 2));
}

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
    const records = readHistory(questionId);
    records.push({
      id: `${questionId}-${Date.now()}`,
      questionId,
      questionType,
      eventType,
      eventSource,
      sourceName,
      changesSummary,
      changedFields: changedFields || null,
      beforeSnapshot: beforeSnapshot || null,
      afterSnapshot: afterSnapshot || null,
      reason,
      metadata: metadata || null,
      createdAt: new Date().toISOString(),
    });
    writeHistory(questionId, records);
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
  const records = readHistory(questionId);
  return records
    .filter(r => r.questionType === questionType)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, limit);
}

export default { logHistory, logCreated, logUpdated, logImproved, logFlagged, logVerified, logEnriched, getHistory };
