// Load environment variables FIRST before any other imports
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

// Now import everything else
import { generateTestCases } from "@/routers/generate-test/ai/generate-test";
import type { TestCaseRecord } from "@workspace/drizzle/schema";

async function main() {
  console.log(
    "[demo] Demonstrating test generation with email thread context...\n"
  );

  // Simulate a test case for an email assistant agent
  const mockTestCase: TestCaseRecord = {
    id: 1,
    name: "Email Assistant Agent Test",
    description:
      "An AI voice agent that helps users manage their email communications, schedule meetings, handle contract terminations, and respond to business inquiries. The agent should be professional, accurate, and able to understand business context.",
    kindOfTestCases:
      "Focus on business email scenarios: contract management, meeting scheduling, and professional communication",
    email: "test@example.com",
    testPhoneNumber: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  console.log("Test Case:");
  console.log(`  Name: ${mockTestCase.name}`);
  console.log(`  Description: ${mockTestCase.description}`);
  console.log(`  Focus: ${mockTestCase.kindOfTestCases}\n`);

  console.log("Generating test cases with email thread context...\n");

  try {
    const { subTests } = await generateTestCases(mockTestCase);

    console.log(`\n${"=".repeat(60)}`);
    console.log(`Successfully generated ${subTests.length} sub-tests:`);
    console.log("=".repeat(60));

    subTests.forEach((test, idx) => {
      console.log(`\n${idx + 1}. ${test.name}`);
      console.log(`   Prompt: "${test.prompt}"`);
      console.log(`   Expected: ${test.expected}`);
    });

    console.log("\n[demo] Test generation complete!");
  } catch (err) {
    console.error("[demo] Error:", err);
    process.exit(1);
  }
}

main();
