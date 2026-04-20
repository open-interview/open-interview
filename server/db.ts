import "dotenv/config";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : undefined,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: true,
});

pool.on("error", (err) => {
  console.error("Unexpected pool error", err);
});

if (process.env.NODE_ENV === "development") {
  pool.on("connect", () => console.log("Pool: new client connected"));
}

export const db = drizzle(pool, { schema });

export async function closePool(): Promise<void> {
  await pool.end();
}

function convertPlaceholders(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

export const client = {
  execute: async (sqlOrObj: string | { sql: string; args?: any[] }) => {
    const { sql, args } = typeof sqlOrObj === "string"
      ? { sql: sqlOrObj, args: [] as any[] }
      : { sql: sqlOrObj.sql, args: (sqlOrObj as any).args ?? [] };

    if (sql.trim().toUpperCase().startsWith("PRAGMA")) {
      return { rows: [], lastInsertRowid: null };
    }

    let pgSql = convertPlaceholders(sql);

    const normalised = pgSql.trim().toUpperCase();
    const isInsert = normalised.startsWith("INSERT");
    const hasReturning = normalised.includes("RETURNING");
    if (isInsert && !hasReturning) {
      pgSql = pgSql.replace(/;\s*$/, "") + " RETURNING id";
    }

    const result = await pool.query(pgSql, args);
    return {
      rows: result.rows,
      lastInsertRowid: result.rows[0]?.id ?? null,
    };
  },
};
