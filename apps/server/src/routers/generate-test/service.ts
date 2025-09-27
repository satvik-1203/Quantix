import { db } from "@workspace/drizzle";
import { eq } from "drizzle-orm";

export const generateTestService = async (testCaseId: number) => {
  // Get the test case
  try {
    const testCase = await db.query.testCases.findMany();

    if (!testCase) {
      throw new Error("Test case not found");
    }

    return testCase;
  } catch (error) {
    console.error("[DB] Failed to query test_cases:", error);
    throw error;
  }
};
