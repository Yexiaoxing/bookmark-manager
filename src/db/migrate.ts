import path from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { AppDb } from "./index.js";

export function runMigrations(db: AppDb) {
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  migrate(db, { migrationsFolder });
}
