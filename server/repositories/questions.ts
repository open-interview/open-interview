import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

function readChannel(channelId: string): any[] {
  const file = path.join(DATA_DIR, 'questions', `${channelId}.json`);
  if (!fs.existsSync(file)) return [];
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
}

function allChannelIds(): string[] {
  const dir = path.join(DATA_DIR, 'questions');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
}

export function getChannels() {
  try {
    const meta = path.join(DATA_DIR, 'meta', 'channels.json');
    if (fs.existsSync(meta)) return JSON.parse(fs.readFileSync(meta, 'utf8'));
  } catch {}
  return allChannelIds().map(id => ({ channel: id, count: readChannel(id).length }));
}

export function getQuestionsByChannel(channelId: string, subChannel?: string, difficulty?: string) {
  let qs = readChannel(channelId).filter((q: any) => q.status !== 'deleted');
  if (subChannel) qs = qs.filter((q: any) => q.subChannel === subChannel);
  if (difficulty) qs = qs.filter((q: any) => q.difficulty === difficulty);
  return qs;
}

export function getQuestionById(id: string) {
  for (const ch of allChannelIds()) {
    const q = readChannel(ch).find((q: any) => q.id === id);
    if (q) return q;
  }
  return null;
}

export function getRandomQuestion(channel?: string, difficulty?: string) {
  const channels = channel ? [channel] : allChannelIds();
  let pool: any[] = [];
  for (const ch of channels) {
    let qs = readChannel(ch).filter((q: any) => q.status !== 'deleted');
    if (difficulty) qs = qs.filter((q: any) => q.difficulty === difficulty);
    pool = pool.concat(qs);
  }
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getStats() {
  const stats: any[] = [];
  for (const ch of allChannelIds()) {
    const qs = readChannel(ch).filter((q: any) => q.status !== 'deleted');
    const byDiff: Record<string, number> = {};
    for (const q of qs) { byDiff[q.difficulty] = (byDiff[q.difficulty] || 0) + 1; }
    for (const [difficulty, count] of Object.entries(byDiff)) {
      stats.push({ channel: ch, difficulty, count });
    }
  }
  return stats;
}
