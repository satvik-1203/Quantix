import { getSubTestExpense } from "../routers/analytics-expense/service";
import { db } from "@workspace/drizzle";
import { subTextActivity, subTests, testCases } from "@workspace/drizzle/schema";

async function main() {
  console.log("Starting expense reporting verification...");

  // 1. Create dummy data with cost
  console.log("\n--- Creating Dummy Data ---");
  const [testCase] = await db.insert(testCases).values({
    name: "Expense Verification Test",
    description: "Testing expense reporting",
    kindOfTestCases: "Verification",
  }).returning();

  const [subTest] = await db.insert(subTests).values({
    name: "Expense SubTest",
    description: "SubTest for expense",
    testCaseId: testCase.id,
    expected: "Success",
  }).returning();

  await db.insert(subTextActivity).values({
    subTestId: subTest.id,
    type: "PHONE",
    status: "SUCCESS",
    cost: 25, // 25 cents
    tokens: 2500,
    metadata: {
      callId: "expense-test-1",
      messageData: {},
    },
    misc_id: "expense-test-1",
  });

  await db.insert(subTextActivity).values({
    subTestId: subTest.id,
    type: "EMAIL",
    status: "SUCCESS",
    cost: 0, // Email usually has 0 cost but has tokens
    tokens: 1000,
    metadata: {
      threadId: "expense-test-2",
      messageData: {},
    },
    misc_id: "expense-test-2",
  });

  // 2. Verify Expense Service
  console.log("\n--- Verifying Expense Service ---");
  const expense = await getSubTestExpense(subTest.id);
  console.log("Expense Report:", expense);

  // Expected: Voice=25, Email=1 (1000*0.001), Total=26
  // Wait, email cost logic: 1000 tokens * 0.001 = 1 cent.
  if (expense.voiceCost === 25 && expense.emailCost === 1 && expense.totalCost === 26) {
    console.log("✅ Expense verification passed");
  } else {
    console.error("❌ Expense verification failed");
    console.error(`Expected: Voice=25, Email=1, Total=26`);
    console.error(`Actual: Voice=${expense.voiceCost}, Email=${expense.emailCost}, Total=${expense.totalCost}`);
  }

  console.log("\nVerification completed.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
