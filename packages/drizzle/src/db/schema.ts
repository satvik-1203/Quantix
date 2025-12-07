import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import type { LlmJudgeEmailTestSchemaType } from "@workspace/common";

export const testCases = pgTable("test_cases", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  description: text("description"),
  kindOfTestCases: text("kind_of_test_cases"),
  email: text("email"),
  testPhoneNumber: varchar("test_phone_number", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
  },
  (table: any) => [index("test_case_id_index").on(table.testCaseId)]
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
    cost: integer("cost"), // Stored in cents
    tokens: integer("tokens"),
  },
  (table: any) => [index("sub_test_id_index").on(table.subTestId)]
);
export type SubTextActivityRecord = typeof subTextActivity.$inferSelect;
export type TestCaseRecord = typeof testCases.$inferSelect;
export type SubTestRecord = typeof subTests.$inferSelect;
