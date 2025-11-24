import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  index,
  jsonb,
  boolean,
  unique,
  primaryKey,
} from "drizzle-orm/pg-core";
import type { LlmJudgeEmailTestSchemaType } from "@workspace/common";

// ============================================
// User Management Tables
// ============================================

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }),
    passwordHash: text("password_hash").notNull(),
    role: varchar("role", { length: 50 })
      .default("user")
      .notNull()
      .$type<"admin" | "user" | "viewer">(),
    emailVerified: boolean("email_verified").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    unique("users_email_unique").on(table.email),
    index("users_email_index").on(table.email),
    index("users_deleted_at_index").on(table.deletedAt),
  ]
);

export const organizations = pgTable(
  "organizations",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [index("organizations_deleted_at_index").on(table.deletedAt)]
);

export const userOrganizations = pgTable(
  "user_organizations",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 })
      .default("member")
      .notNull()
      .$type<"owner" | "admin" | "member">(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.organizationId] }),
    index("user_orgs_user_index").on(table.userId),
    index("user_orgs_org_index").on(table.organizationId),
  ]
);

// ============================================
// Test Cases Tables (Updated with multi-tenancy)
// ============================================

export const testCases = pgTable(
  "test_cases",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }),
    description: text("description"),
    kindOfTestCases: text("kind_of_test_cases"),
    email: text("email"),
    testPhoneNumber: varchar("test_phone_number", { length: 20 }),
    userId: integer("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    organizationId: integer("organization_id").references(
      () => organizations.id,
      { onDelete: "cascade" }
    ),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("test_cases_user_index").on(table.userId),
    index("test_cases_org_index").on(table.organizationId),
    index("test_cases_created_at_index").on(table.createdAt),
    index("test_cases_deleted_at_index").on(table.deletedAt),
  ]
);

export const subTests = pgTable(
  "sub_tests",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }),
    description: text("description"),
    testCaseId: integer("test_case_id").references(() => testCases.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    expected: text("expected"),
    deletedAt: timestamp("deleted_at"),
  },
  (table: any) => [
    index("test_case_id_index").on(table.testCaseId),
    index("sub_tests_deleted_at_index").on(table.deletedAt),
  ]
);
export const subTextActivity = pgTable(
  "sub_text_activity",
  {
    id: serial("id").primaryKey(),
    subTestId: integer("sub_test_id").references(() => subTests.id),
    type: text().$type<"EMAIL" | "PHONE">(),
    status: text().$type<"PENDING" | "SUCCESS" | "FAILED">(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
    metadata: jsonb("metadata").$type<
      | {
          threadId: string;
          messageData: LlmJudgeEmailTestSchemaType | {};
        }
      | {
          callId: string;
          messageData: Record<string, any>;
        }
    >(),
    misc_id: text("misc_id"),
  },
  (table: any) => [index("sub_test_id_index").on(table.subTestId)]
);
// Type exports
export type UserRecord = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
export type OrganizationRecord = typeof organizations.$inferSelect;
export type OrganizationInsert = typeof organizations.$inferInsert;
export type UserOrganizationRecord = typeof userOrganizations.$inferSelect;
export type UserOrganizationInsert = typeof userOrganizations.$inferInsert;

export type SubTextActivityRecord = typeof subTextActivity.$inferSelect;
export type TestCaseRecord = typeof testCases.$inferSelect;
export type SubTestRecord = typeof subTests.$inferSelect;
