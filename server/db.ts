import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";

const url = process.env.SQLITE_URL ?? "file:local.db";

export const client = createClient({ url });

export const db = drizzle(client, { schema });
