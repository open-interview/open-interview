import { db } from '../db';
import { questions } from '@shared/schema';
import { eq, and, ne, like, sql, count, asc, desc } from 'drizzle-orm';

export async function getChannels() {
  return db
    .select({ channel: questions.channel, count: count() })
    .from(questions)
    .where(ne(questions.status, 'deleted'))
    .groupBy(questions.channel);
}

export async function getQuestionsByChannel(channelId: string, subChannel?: string, difficulty?: string) {
  const conditions = [
    eq(questions.channel, channelId),
    ne(questions.status, 'deleted'),
    ...(subChannel ? [eq(questions.subChannel, subChannel)] : []),
    ...(difficulty ? [eq(questions.difficulty, difficulty)] : []),
  ];
  return db.select().from(questions).where(and(...conditions));
}

export async function getRandomQuestion(channel?: string, difficulty?: string) {
  const conditions = [
    ne(questions.status, 'deleted'),
    ...(channel ? [eq(questions.channel, channel)] : []),
    ...(difficulty ? [eq(questions.difficulty, difficulty)] : []),
  ];
  const rows = await db
    .select()
    .from(questions)
    .where(and(...conditions))
    .orderBy(sql`RANDOM()`)
    .limit(1);
  return rows[0] ?? null;
}

export async function getQuestionById(id: string) {
  const rows = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getStats() {
  return db
    .select({ channel: questions.channel, difficulty: questions.difficulty, count: count() })
    .from(questions)
    .where(ne(questions.status, 'deleted'))
    .groupBy(questions.channel, questions.difficulty);
}

export async function getSubchannels(channelId: string) {
  return db
    .selectDistinct({ sub_channel: questions.subChannel })
    .from(questions)
    .where(and(eq(questions.channel, channelId), ne(questions.status, 'deleted')));
}

export async function getCompaniesByChannel(channelId: string) {
  return db
    .select({ companies: questions.companies })
    .from(questions)
    .where(and(eq(questions.channel, channelId), ne(questions.status, 'deleted')));
}
