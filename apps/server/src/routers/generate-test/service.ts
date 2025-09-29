import { db, testCases, subTests } from "@workspace/drizzle";
import { eq } from "drizzle-orm";
import { generateTestCases } from "./ai/generate-test";

export const generateTestService = async (testCaseId: number) => {
  // Get the test case
  try {
    const testCase = await db.query.testCases.findFirst({
      where: eq(testCases.id, testCaseId),
    });

    if (!testCase) {
      throw new Error("Test case not found");
    }

    const subTestsArray = await generateTestCases(testCase);

    await db.insert(subTests).values(
      subTestsArray.map((subTest) => ({
        name: subTest.name,
        description: subTest.prompt,
        testCaseId: testCase.id,
        expected: subTest.expected,
      }))
    );

    return testCase;
  } catch (error) {
    console.error("[DB] Failed to query test_cases:", error);
    throw error;
  }
};
