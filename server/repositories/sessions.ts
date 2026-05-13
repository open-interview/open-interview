import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// Voice sessions — read-only from file
export function getVoiceSessions() {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'voice-sessions.json'), 'utf8'));
    return Array.isArray(raw) ? raw : (raw.sessions ?? []);
  } catch { return []; }
}

// User sessions — in-memory store (client-side state, no persistence needed for static site)
const sessionStore = new Map<string, any>();

export async function getUserSessions(sessionKey: string) {
  return [...sessionStore.values()].filter(s => s.sessionKey === sessionKey);
}

export async function upsertUserSession(data: any) {
  const id = data.id || crypto.randomUUID();
  sessionStore.set(id, { ...data, id, lastAccessedAt: new Date().toISOString() });
  return [sessionStore.get(id)];
}

export async function deleteUserSession(id: string) {
  sessionStore.delete(id);
}

// Question history — read from file if exists
export function getQuestionHistory(questionId: string, type?: string, limit = 50) {
  try {
    const file = path.join(DATA_DIR, 'question-history.json');
    if (!fs.existsSync(file)) return [];
    let history = JSON.parse(fs.readFileSync(file, 'utf8'));
    history = history.filter((h: any) => h.questionId === questionId);
    if (type) history = history.filter((h: any) => h.questionType === type);
    return history.slice(0, limit);
  } catch { return []; }
}

export function getHistoryById(questionId: string, type?: string) {
  return getQuestionHistory(questionId, type, 1)[0] ?? null;
}

export function getLearningPaths(filters: any = {}) {
  try {
    let paths = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'learning-paths.json'), 'utf8'));
    if (!Array.isArray(paths)) paths = paths.paths ?? [];
    if (filters.difficulty) paths = paths.filter((p: any) => p.difficulty === filters.difficulty);
    return paths;
  } catch { return []; }
}
