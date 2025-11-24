-- Add soft delete support to main tables

-- Add deleted_at column to users table
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;

-- Add deleted_at column to organizations table
ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;

-- Add deleted_at column to test_cases table
ALTER TABLE "test_cases"
  ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;

-- Add deleted_at column to sub_tests table
ALTER TABLE "sub_tests"
  ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;

-- Create indexes for soft delete queries
CREATE INDEX IF NOT EXISTS "users_deleted_at_index" ON "users" ("deleted_at");
CREATE INDEX IF NOT EXISTS "organizations_deleted_at_index" ON "organizations" ("deleted_at");
CREATE INDEX IF NOT EXISTS "test_cases_deleted_at_index" ON "test_cases" ("deleted_at");
CREATE INDEX IF NOT EXISTS "sub_tests_deleted_at_index" ON "sub_tests" ("deleted_at");
