import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { logger } from "../logger.js";

const databaseUrl =
  process.env.DATABASE_URL ?? path.join(process.cwd(), "data", "bookmarks.db");
const dir = path.dirname(path.resolve(databaseUrl));
fs.mkdirSync(dir, { recursive: true });
const sqlite = new Database(databaseUrl);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite);
const migrationsFolder = path.join(process.cwd(), "drizzle");

migrate(db, { migrationsFolder });

logger.info({ databaseUrl }, "migrations applied");
sqlite.close();
