import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

export function createDb(databaseUrl: string) {
  const dir = path.dirname(path.resolve(databaseUrl));
  fs.mkdirSync(dir, { recursive: true });
  const sqlite = new Database(databaseUrl);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

export type AppDb = ReturnType<typeof createDb>;

export { schema };
