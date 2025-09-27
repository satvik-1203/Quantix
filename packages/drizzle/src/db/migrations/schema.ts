import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const testCases = pgTable("test_cases", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }),
	description: text(),
	kindOfTestCases: text("kind_of_test_cases"),
	testPhoneNumber: varchar("test_phone_number", { length: 20 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});
