import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { _db: ReturnType<typeof createDb> };

function createDb(): { db: LibSQLDatabase<typeof schema> } | { db: null } {
  const url = process.env.DATABASE_URL;
  if (!url) return { db: null };
  try {
    const authToken = process.env.TURSO_AUTH_TOKEN;
    const client = url.startsWith("libsql://")
      ? createClient({ url, authToken })
      : createClient({ url });
    client.execute("PRAGMA foreign_keys = ON").catch(() => {});
    return { db: drizzle(client, { schema }) };
  } catch {
    return { db: null };
  }
}

function getResolved() {
  if (process.env.NODE_ENV !== "production") return createDb();
  const resolved = globalForDb._db ?? createDb();
  globalForDb._db = resolved;
  return resolved;
}

export const { db } = getResolved();
export { schema };
