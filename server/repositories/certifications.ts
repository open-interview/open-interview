import { db } from '../db';
import { certifications, codingChallenges, questions } from '@shared/schema';
import { eq, and, like, sql, ne, count, asc } from 'drizzle-orm';

// Certifications

export async function getCertifications(filters: { category?: string; difficulty?: string; provider?: string; status?: string }) {
  const conditions = [];
  if (filters.category) conditions.push(eq(certifications.category, filters.category));
  if (filters.difficulty) conditions.push(eq(certifications.difficulty, filters.difficulty));
  if (filters.provider) conditions.push(eq(certifications.provider, filters.provider));
  if (filters.status) conditions.push(eq(certifications.status, filters.status));
  return db.select().from(certifications).where(conditions.length ? and(...conditions) : undefined).orderBy(asc(certifications.name));
}

export async function getCertificationById(id: string) {
  const [row] = await db.select().from(certifications).where(eq(certifications.id, id));
  return row ?? null;
}

export async function getCertificationStats() {
  return db
    .select({ category: certifications.category, difficulty: certifications.difficulty, count: count(), questions: sql<number>`0` })
    .from(certifications)
    .groupBy(certifications.category, certifications.difficulty);
}

export async function getCertificationQuestions(id: string, domain?: string, difficulty?: string, limit?: number) {
  const conditions = [eq(questions.channel, id)];
  if (domain) conditions.push(eq(questions.subChannel, domain));
  if (difficulty) conditions.push(eq(questions.difficulty, difficulty));
  const query = db.select().from(questions).where(and(...conditions));
  if (limit) query.limit(limit);
  return query;
}

export async function updateCertificationQuestionCount(id: string) {
  const [{ total }] = await db
    .select({ total: count() })
    .from(questions)
    .where(and(eq(questions.channel, id), ne(questions.status, 'deleted')));
  await db.update(certifications).set({ questionCount: total }).where(eq(certifications.id, id));
  return { questionCount: total };
}

// Coding Challenges

export async function getCodingChallenges(filters: { difficulty?: string; category?: string }) {
  const conditions = [];
  if (filters.difficulty) conditions.push(eq(codingChallenges.difficulty, filters.difficulty));
  if (filters.category) conditions.push(eq(codingChallenges.category, filters.category));
  return db.select().from(codingChallenges).where(conditions.length ? and(...conditions) : undefined);
}

export async function getCodingChallengeById(id: string) {
  const [row] = await db.select().from(codingChallenges).where(eq(codingChallenges.id, id));
  return row ?? null;
}

export async function getRandomCodingChallenge(difficulty?: string) {
  const conditions = difficulty ? [eq(codingChallenges.difficulty, difficulty)] : [];
  const [row] = await db
    .select()
    .from(codingChallenges)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(sql`RANDOM()`)
    .limit(1);
  return row ?? null;
}

export async function getCodingStats() {
  return db
    .select({ difficulty: codingChallenges.difficulty, category: codingChallenges.category, count: count() })
    .from(codingChallenges)
    .groupBy(codingChallenges.difficulty, codingChallenges.category);
}
