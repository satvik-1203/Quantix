"use server";
import { db, testCases } from "@workspace/drizzle";

export const createTestCase = async (formData: any) => {
  await db.insert(testCases).values({
    name: formData.name,
    description: formData.description,
    kindOfTestCases: formData.kindOfTestCases,
    testPhoneNumber: formData.testPhoneNumber,
  });
};
