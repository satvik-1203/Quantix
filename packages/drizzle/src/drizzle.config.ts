import { defineConfig } from "drizzle-kit";

console.log(process.env.DATABASE_URL);

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://postgres.reallfgutstgjjtaqjfx:L94EHWcEiNwJedZH@aws-1-us-east-1.pooler.supabase.com:6543/postgres",
  },
});
