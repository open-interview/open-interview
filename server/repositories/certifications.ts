import fs from 'fs';
import path from 'path';

const FILE = path.join(process.cwd(), 'data', 'certifications.json');

function load(): any[] {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return []; }
}

export function getCertifications(filters: { category?: string; difficulty?: string } = {}) {
  let certs = load().filter((c: any) => c.status !== 'deleted');
  if (filters.category) certs = certs.filter((c: any) => c.category === filters.category);
  if (filters.difficulty) certs = certs.filter((c: any) => c.difficulty === filters.difficulty);
  return certs;
}

export function getCertificationById(id: string) {
  return load().find((c: any) => c.id === id) ?? null;
}
