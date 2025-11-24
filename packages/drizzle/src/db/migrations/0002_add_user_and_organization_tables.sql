-- Add user and organization management tables

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "email" varchar(255) NOT NULL,
  "name" varchar(255),
  "password_hash" text NOT NULL,
  "role" varchar(50) DEFAULT 'user' NOT NULL,
  "email_verified" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- Create organizations table
CREATE TABLE IF NOT EXISTS "organizations" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL,
  "slug" varchar(100) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create user_organizations junction table
CREATE TABLE IF NOT EXISTS "user_organizations" (
  "user_id" integer NOT NULL,
  "organization_id" integer NOT NULL,
  "role" varchar(50) DEFAULT 'member' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "user_organizations_pkey" PRIMARY KEY("user_id", "organization_id")
);

-- Add foreign keys to test_cases table
ALTER TABLE "test_cases"
  ADD COLUMN IF NOT EXISTS "user_id" integer,
  ADD COLUMN IF NOT EXISTS "organization_id" integer;

-- Add foreign key constraints
ALTER TABLE "user_organizations"
  ADD CONSTRAINT "user_organizations_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;

ALTER TABLE "user_organizations"
  ADD CONSTRAINT "user_organizations_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade;

ALTER TABLE "test_cases"
  ADD CONSTRAINT "test_cases_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null;

ALTER TABLE "test_cases"
  ADD CONSTRAINT "test_cases_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade;

-- Create indexes
CREATE INDEX IF NOT EXISTS "users_email_index" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "user_orgs_user_index" ON "user_organizations" ("user_id");
CREATE INDEX IF NOT EXISTS "user_orgs_org_index" ON "user_organizations" ("organization_id");
CREATE INDEX IF NOT EXISTS "test_cases_user_index" ON "test_cases" ("user_id");
CREATE INDEX IF NOT EXISTS "test_cases_org_index" ON "test_cases" ("organization_id");
CREATE INDEX IF NOT EXISTS "test_cases_created_at_index" ON "test_cases" ("created_at");
