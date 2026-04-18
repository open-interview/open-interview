/**
 * Voice Keywords Bot
 * Exports processQuestionForVoice for use by add-random-question.js
 */

import { runWithRetries, parseJson } from './utils.js';
import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.SQLITE_URL || 'file:local.db',
});

/**
 * Generate voice interview keywords for a question and persist them.
 * @returns {{ suitable: boolean, keywords: string[] } | null}
 */
export async function processQuestionForVoice(id, question, explanation, channel) {
  const prompt = `You are a JSON generator. Output ONLY valid JSON, no explanations, no markdown.

Analyze this interview question for voice interview practice.

Question: "${question}"
Channel: ${channel}
Explanation: "${(explanation || '').substring(0, 1000)}"

Determine if this question is suitable for VOICE interview practice (can be answered verbally without writing code).
If suitable, extract 8-15 mandatory keywords/concepts a good answer MUST include.

Return ONLY valid JSON:
{"suitable":true,"keywords":["keyword1","keyword2","keyword3"]}
or
{"suitable":false,"keywords":[]}`;

  const response = await runWithRetries(prompt);
  if (!response) return null;

  const data = parseJson(response);
  if (!data || typeof data.suitable !== 'boolean') return null;

  // Persist to DB
  try {
    if (data.suitable && data.keywords?.length > 0) {
      await db.execute({
        sql: `UPDATE questions SET voice_keywords = ?, voice_suitable = 1, last_updated = ? WHERE id = ?`,
        args: [JSON.stringify(data.keywords), new Date().toISOString(), id],
      });
    } else {
      await db.execute({
        sql: `UPDATE questions SET voice_suitable = 0, last_updated = ? WHERE id = ?`,
        args: [new Date().toISOString(), id],
      });
    }
  } catch {
    // Non-fatal: DB update failure doesn't block question creation
  }

  return data;
}
