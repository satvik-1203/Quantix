import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "../../packages/drizzle/src/db/schema.ts",
  out: "../../packages/drizzle/src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres.reallfguustgjjtaqjfx:L94EHWcEiNwJedZH@aws-1-us-east-1.pooler.supabase.com:6543/postgres",
  },
});
