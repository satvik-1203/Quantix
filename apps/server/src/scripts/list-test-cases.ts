import { db, subTests, testCases } from "@workspace/drizzle";
import { eq } from "drizzle-orm";

async function main() {
  console.log("🔍 Querying database for test cases and subtests...\n");

  // Get all test cases
  const allTestCases = await db
    .select()
    .from(testCases)
    .orderBy(testCases.id);

  console.log(`Found ${allTestCases.length} test case(s)\n`);

  if (allTestCases.length === 0) {
    console.log("No test cases found in the database.");
    process.exit(0);
  }

  // For each test case, get its subtests
  for (const testCase of allTestCases) {
    console.log("=".repeat(80));
    console.log(`Test Case ID: ${testCase.id}`);
    console.log(`Name: ${testCase.name || "(unnamed)"}`);
    console.log(`Description: ${testCase.description ? testCase.description.substring(0, 150) + (testCase.description.length > 150 ? "..." : "") : "(no description)"}`);
    console.log(`Kind of Test Cases: ${testCase.kindOfTestCases || "(not specified)"}`);
    console.log(`Created: ${testCase.createdAt}`);
    console.log();

    const subtests = await db
      .select()
      .from(subTests)
      .where(eq(subTests.testCaseId, testCase.id))
      .orderBy(subTests.id);

    console.log(`  Subtests (${subtests.length}):`);
    if (subtests.length === 0) {
      console.log("    (no subtests)");
    } else {
      for (const subtest of subtests) {
        console.log(`    - ID ${subtest.id}: ${subtest.name || "(unnamed)"}`);
        if (subtest.description) {
          console.log(`      Description: ${subtest.description.substring(0, 100)}${subtest.description.length > 100 ? "..." : ""}`);
        }
        if (subtest.expected) {
          console.log(`      Expected: ${subtest.expected.substring(0, 100)}${subtest.expected.length > 100 ? "..." : ""}`);
        }
      }
    }
    console.log();
  }

  // Summary
  const allSubtests = await db
    .select()
    .from(subTests);

  console.log("=".repeat(80));
  console.log("📊 SUMMARY");
  console.log("=".repeat(80));
  console.log(`Total Test Cases: ${allTestCases.length}`);
  console.log(`Total Subtests: ${allSubtests.length}`);
  console.log();

  if (allSubtests.length > 0) {
    console.log("The benchmark will test all models on these subtests:");
    for (const subtest of allSubtests) {
      const testCase = allTestCases.find((tc) => tc.id === subtest.testCaseId);
      console.log(`  - Subtest ${subtest.id} (${subtest.name || "unnamed"}) from "${testCase?.name || "Unknown"}"`);
    }
  }

  console.log();
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});


