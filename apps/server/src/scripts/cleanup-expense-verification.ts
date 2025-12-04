import { db } from "@workspace/drizzle";
import { testCases, subTests, subTextActivity } from "@workspace/drizzle/schema";
import { eq, inArray } from "drizzle-orm";

async function main() {
  console.log("Starting cleanup...");

  try {
    // Find test cases to delete
    const testsToDelete = await db
      .select({ id: testCases.id })
      .from(testCases)
      .where(eq(testCases.name, "Expense Verification Test"));

    if (testsToDelete.length === 0) {
      console.log("No test cases found to delete.");
      process.exit(0);
    }

    const testIds = testsToDelete.map((t) => t.id);
    console.log("Found test cases to delete:", testIds.length);

    // Find sub-tests associated with these test cases
    const subTestsToDelete = await db
      .select({ id: subTests.id })
      .from(subTests)
      .where(inArray(subTests.testCaseId, testIds));

    const subTestIds = subTestsToDelete.map((st) => st.id);
    console.log("Found sub-tests to delete:", subTestIds.length);

    // Delete sub-text activities first
    if (subTestIds.length > 0) {
      await db.delete(subTextActivity).where(inArray(subTextActivity.subTestId, subTestIds));
      console.log("Deleted sub-text activities.");

      // Delete sub-tests
      await db.delete(subTests).where(inArray(subTests.id, subTestIds));
      console.log("Deleted sub-tests.");
    }

    // Delete test cases
    await db.delete(testCases).where(inArray(testCases.id, testIds));
    console.log("Deleted test cases.");

    console.log("Cleanup completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Cleanup failed:", err);
    process.exit(1);
  }
}

main();
