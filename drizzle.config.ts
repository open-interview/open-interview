import { defineConfig } from "drizzle-kit";

const url = process.env.SQLITE_URL ?? "file:local.db";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url,
  },
});
