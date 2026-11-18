import "server-only";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";
import * as schema from "./schema";

// Local development and tests use a SQLite file. Going live moves this to hosted Postgres.
type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as { vouchDb?: Db };

function createDb(): Db {
  const file = process.env.DATABASE_URL?.replace(/^file:/, "") || "vouch.db";
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000"); // wait instead of failing if another process is writing
  const db = drizzle(sqlite, { schema });
  // Apply any pending migrations from /drizzle so a fresh checkout just works.
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return db;
}

/**
 * Opened on first use, not when this file is imported. `next build` loads many pages
 * in parallel without querying anything, so connecting eagerly made them race to set up
 * a brand-new database file.
 */
export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    globalForDb.vouchDb ??= createDb();
    const value = Reflect.get(globalForDb.vouchDb, prop);
    return typeof value === "function" ? value.bind(globalForDb.vouchDb) : value;
  },
});
