import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const testCases = pgTable("test_cases", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  description: text("description"),
  kindOfTestCases: text("kind_of_test_cases"),
  testPhoneNumber: varchar("test_phone_number", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});