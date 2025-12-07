import { getSubTestExpense } from "../routers/analytics-expense/service";
import { db } from "@workspace/drizzle";
import { subTextActivity, subTests, testCases } from "@workspace/drizzle/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Starting split expense verification...");

  // 1. Create dummy data
  console.log("\n--- Creating Dummy Data ---");
  const [testCase] = await db.insert(testCases).values({
    name: "Split Expense Verification Test",
    description: "Testing split expense reporting",
    kindOfTestCases: "Verification",
  }).returning();

  const [subTest] = await db.insert(subTests).values({
    name: "Split Expense SubTest",
    description: "SubTest for split expense",
    testCaseId: testCase.id,
    expected: "Success",
  }).returning();

  // Voice call (cost = 50 cents)
  await db.insert(subTextActivity).values({
    subTestId: subTest.id,
    type: "PHONE",
    status: "SUCCESS",
    cost: 50,
    tokens: 0,
    metadata: {
      callId: "split-test-voice",
      messageData: {},
    },
    misc_id: "split-test-voice",
  });

  // Email (tokens = 10000 -> cost should be 10 cents)
  // Note: We insert with NULL cost to test backfill logic too
  await db.insert(subTextActivity).values({
    subTestId: subTest.id,
    type: "EMAIL",
    status: "SUCCESS",
    cost: null, 
    tokens: 10000,
    metadata: {
      threadId: "split-test-email",
      messageData: {},
    },
    misc_id: "split-test-email",
  });

  // 2. Verify Expense Service
  console.log("\n--- Verifying Expense Service ---");
  const expense = await getSubTestExpense(subTest.id);
  console.log("Expense Report:", expense);

  // Expected:
  // Voice: 50
  // Email: 10 (10000 * 0.001)
  // Total: 60
  
  if (expense.voiceCost === 50 && expense.emailCost === 10 && expense.totalCost === 60) {
    console.log("✅ Split expense verification passed");
  } else {
    console.error("❌ Split expense verification failed");
    console.error(`Expected: Voice=50, Email=10, Total=60`);
    console.error(`Actual: Voice=${expense.voiceCost}, Email=${expense.emailCost}, Total=${expense.totalCost}`);
  }

  // Cleanup
  console.log("\n--- Cleaning Up ---");
  await db.delete(subTextActivity).where(eq(subTextActivity.subTestId, subTest.id));
  await db.delete(subTests).where(eq(subTests.id, subTest.id));
  await db.delete(testCases).where(eq(testCases.id, testCase.id));

  console.log("Verification completed.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
