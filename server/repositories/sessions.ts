import { db } from '../db';
import { userSessions, questionHistory, learningPaths, voiceSessions } from '@shared/schema';
import { eq, and, like, sql, desc, asc, count, or } from 'drizzle-orm';

// User Sessions
export async function getUserSessions(sessionKey: string) {
  return db.select().from(userSessions).where(eq(userSessions.sessionKey, sessionKey));
}

export async function upsertUserSession(data: typeof userSessions.$inferInsert) {
  return db.insert(userSessions).values(data).onConflictDoUpdate({
    target: userSessions.id,
    set: { ...data, lastAccessedAt: new Date().toISOString() },
  }).returning();
}

export async function deleteUserSession(id: string) {
  return db.delete(userSessions).where(eq(userSessions.id, id));
}

// Question History
export async function getQuestionHistory(questionId: string, type?: string, limit = 50) {
  const conditions = [eq(questionHistory.questionId, questionId)];
  if (type) conditions.push(eq(questionHistory.questionType, type));
  return db.select().from(questionHistory).where(and(...conditions)).orderBy(desc(questionHistory.createdAt)).limit(limit);
}

export async function getHistoryById(questionId: string, type?: string) {
  const conditions = [eq(questionHistory.questionId, questionId)];
  if (type) conditions.push(eq(questionHistory.questionType, type));
  const [counts, latest] = await Promise.all([
    db.select({ event_type: questionHistory.eventType, count: count() })
      .from(questionHistory).where(and(...conditions)).groupBy(questionHistory.eventType),
    db.select().from(questionHistory).where(and(...conditions)).orderBy(desc(questionHistory.createdAt)).limit(1),
  ]);
  return { counts, latest: latest[0] ?? null };
}

export async function addHistoryRecord(data: typeof questionHistory.$inferInsert) {
  const rows = await db.insert(questionHistory).values(data).returning();
  return rows[0];
}

export async function getRecentHistory(filters: { type?: any; eventType?: any; source?: any; limit?: number }) {
  const conditions = [];
  if (filters.type && typeof filters.type === 'string') conditions.push(eq(questionHistory.questionType, filters.type));
  if (filters.eventType && typeof filters.eventType === 'string') conditions.push(eq(questionHistory.eventType, filters.eventType));
  if (filters.source && typeof filters.source === 'string') conditions.push(eq(questionHistory.eventSource, filters.source));
  const query = db.select().from(questionHistory).orderBy(desc(questionHistory.createdAt)).limit(filters.limit ?? 50);
  return conditions.length ? query.where(and(...conditions)) : query;
}

// Learning Paths
export async function getLearningPaths(filters: { pathType?: any; difficulty?: any; company?: any; jobTitle?: any; search?: any; limit?: number; offset?: number }) {
  const conditions = [];
  if (filters.pathType && typeof filters.pathType === 'string') conditions.push(eq(learningPaths.pathType, filters.pathType));
  if (filters.difficulty && typeof filters.difficulty === 'string') conditions.push(eq(learningPaths.difficulty, filters.difficulty));
  if (filters.company && typeof filters.company === 'string') conditions.push(eq(learningPaths.targetCompany, filters.company));
  if (filters.jobTitle && typeof filters.jobTitle === 'string') conditions.push(eq(learningPaths.targetJobTitle, filters.jobTitle));
  if (filters.search && typeof filters.search === 'string') conditions.push(or(like(learningPaths.title, `%${filters.search}%`), like(learningPaths.description, `%${filters.search}%`))!);
  const query = db.select().from(learningPaths).limit(filters.limit ?? 50).offset(filters.offset ?? 0);
  return conditions.length ? query.where(and(...conditions)) : query;
}

export async function getLearningPathById(id: string) {
  const [row] = await db.select().from(learningPaths).where(eq(learningPaths.id, id)).limit(1);
  return row ?? null;
}

export async function getLearningPathCompanies() {
  return db.selectDistinct({ target_company: learningPaths.targetCompany }).from(learningPaths)
    .where(sql`${learningPaths.targetCompany} is not null`);
}

export async function getLearningPathJobTitles() {
  return db.selectDistinct({ target_job_title: learningPaths.targetJobTitle }).from(learningPaths)
    .where(sql`${learningPaths.targetJobTitle} is not null`);
}

export async function getLearningPathStats() {
  return db
    .select({ path_type: learningPaths.pathType, difficulty: learningPaths.difficulty, count: count() })
    .from(learningPaths)
    .groupBy(learningPaths.pathType, learningPaths.difficulty);
}

// Voice Sessions
export async function getVoiceSessions() {
  return db.select().from(voiceSessions).orderBy(desc(voiceSessions.createdAt));
}

export async function getVoiceSessionById(id: string) {
  const [row] = await db.select().from(voiceSessions).where(eq(voiceSessions.id, id)).limit(1);
  return row ?? null;
}
