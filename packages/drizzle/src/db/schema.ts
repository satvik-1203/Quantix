import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";

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

export type TestCaseRecord = typeof testCases.$inferSelect;
export type SubTestRecord = typeof subTests.$inferSelect;
