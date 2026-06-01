import fs from 'fs/promises';

export async function mkdirp(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}
