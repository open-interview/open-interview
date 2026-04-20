import { exec } from "child_process";
import { promises as fs } from "fs";
import { promisify } from "util";

const execAsync = promisify(exec);
const BACKUPS_DIR = "backups";

function dbUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return url;
}

export async function backupDatabase(): Promise<string> {
  await fs.mkdir(BACKUPS_DIR, { recursive: true });
  const file = `${BACKUPS_DIR}/backup_${new Date().toISOString().replace(/[:.]/g, "-")}.sql`;
  await execAsync(`pg_dump "${dbUrl()}" -f "${file}"`);
  return file;
}

export async function restoreDatabase(file: string): Promise<void> {
  await execAsync(`psql "${dbUrl()}" -f "${file}"`);
}

export async function listBackups(): Promise<{ file: string; size: number; date: Date }[]> {
  await fs.mkdir(BACKUPS_DIR, { recursive: true });
  const entries = await fs.readdir(BACKUPS_DIR);
  const stats = await Promise.all(
    entries
      .filter((f) => f.endsWith(".sql"))
      .map(async (f) => {
        const full = `${BACKUPS_DIR}/${f}`;
        const s = await fs.stat(full);
        return { file: full, size: s.size, date: s.mtime };
      })
  );
  return stats;
}

// CLI entry point
const cmd = process.argv[2];
if (cmd) {
  (async () => {
    if (cmd === "backup") {
      console.log(await backupDatabase());
    } else if (cmd === "restore") {
      await restoreDatabase(process.argv[3]);
    } else if (cmd === "list") {
      console.log(await listBackups());
    } else {
      console.error(`Unknown command: ${cmd}. Use backup | restore <file> | list`);
      process.exit(1);
    }
  })().catch((e) => { console.error(e.message); process.exit(1); });
}
