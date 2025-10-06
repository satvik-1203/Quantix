import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
export * from "drizzle-orm";

const HARD_CODED_DATABASE_URL =
  "postgresql://postgres.reallfgutstgjjtaqjfx:L94EHWcEiNwJedZH@aws-1-us-east-1.pooler.supabase.com:6543/postgres";

const databaseUrl = HARD_CODED_DATABASE_URL;

if (!process.env.DATABASE_URL) {
  console.warn("[DB] DATABASE_URL is not set. Using hardcoded fallback URL.");
}

try {
  const { host, pathname } = new URL(databaseUrl);
  console.log(
    `[DB] Connecting to host: ${host}, database: ${pathname.slice(1)}`
  );
} catch {
  // Silently ignore malformed URL logs; connection attempt will still surface errors
}

const sql = postgres(databaseUrl, {
  ssl: "require",
});
export const db = drizzle(sql, {
  schema: schema,
});

export * from "./schema";
