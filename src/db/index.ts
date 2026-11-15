import "server-only";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";
import * as schema from "./schema";

// Local development and tests use a SQLite file. Production will move to Postgres in step 3.
const file = process.env.DATABASE_URL?.replace(/^file:/, "") || "vouch.db";

const globalForDb = globalThis as unknown as { vouchDb?: ReturnType<typeof createDb> };

function createDb() {
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  // Apply any pending migrations from /drizzle so a fresh checkout just works.
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return db;
}

export const db = globalForDb.vouchDb ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.vouchDb = db;
