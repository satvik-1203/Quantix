import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
export * from "drizzle-orm";

const FALLBACK_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/capstone_class";

const databaseUrl = process.env.DATABASE_URL || FALLBACK_DATABASE_URL;

if (!process.env.DATABASE_URL) {
  console.warn(
    "[DB] DATABASE_URL is not set. Using local fallback URL. Set DATABASE_URL in your app env to connect to your real database."
  );
}

try {
  const { host, pathname } = new URL(databaseUrl);
  console.log(
    `[DB] Connecting to host: ${host}, database: ${pathname.slice(1)}`
  );
} catch {
  // Silently ignore malformed URL logs; connection attempt will still surface errors
}

const shouldUseSsl =
  !databaseUrl.includes("localhost") && !databaseUrl.includes("127.0.0.1");

const sql = postgres(databaseUrl, {
  ssl: shouldUseSsl ? "require" : false,
});
export const db = drizzle(sql, {
  schema: schema,
});

export * from "./schema";
