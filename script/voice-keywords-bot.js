import { runWithRetries, parseJson, saveQuestion, findQuestionById, getAllUnifiedQuestions } from './utils.js';

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

  try {
    if (data.suitable && data.keywords?.length > 0) {
      const existing = findQuestionById(id);
      if (existing) {
        const updated = { ...existing, voiceKeywords: data.keywords, voiceSuitable: true, lastUpdated: new Date().toISOString() };
        await saveQuestion(updated);
      }
    } else {
      const existing = findQuestionById(id);
      if (existing) {
        const updated = { ...existing, voiceSuitable: false, lastUpdated: new Date().toISOString() };
        await saveQuestion(updated);
      }
    }
  } catch {
  }

  return data;
}
