import { db, testCases } from "@workspace/drizzle";
import { eq } from "drizzle-orm";
import { generateTestCases } from "../ai/generate-test";

const main = async () => {
  const testCase = await db.query.testCases.findFirst({
    where: eq(testCases.id, 2),
  });

  if (!testCase) {
    throw new Error("Test case not found");
  }

  const subTests = await generateTestCases(testCase);

  console.log(subTests);
};

main();
