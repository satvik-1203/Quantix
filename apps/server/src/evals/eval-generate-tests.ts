import "dotenv/config";
import { z } from "zod";
import type { TestCaseRecord } from "@workspace/drizzle";
import { generateTestCases } from "../routers/generate-test/ai/generate-test";
import { generateTestCasesSchema } from "../routers/generate-test/ai/schema";

const EXTRA_CHECKS_SCHEMA = z.object({
  subTests: z
    .array(
      z.object({
        name: z.string().min(1),
        prompt: z.string().min(1).max(180),
        expected: z.string().min(1).max(220),
      })
    )
    .length(8),
});

type SubTestType =
  | "happy_path"
  | "disambiguation"
  | "correction"
  | "no_availability_edge"
  | "policy_compliance"
  | "error_handling"
  | "guardrails_adversarial";

function classifySubTest(prompt: string, expected: string): SubTestType {
  const text = `${prompt} ${expected}`.toLowerCase();
  if (
    /(jailbreak|ignore (previous|prior) (instructions|message)|prompt injection|hack|bypass|override)/.test(
      text
    )
  ) {
    return "guardrails_adversarial";
  }
  if (
    /(policy|cannot|not allowed|refuse|decline|restricted|prohibited|safety)/.test(
      text
    )
  ) {
    return "policy_compliance";
  }
  if (/(error|fail(ed|ure)|timeout|crash|bug|exception|retry)/.test(text)) {
    return "error_handling";
  }
  if (
    /(no (availability|tables|slots)|fully booked|sold out|out of stock|unavailable|cannot accommodate)/.test(
      text
    )
  ) {
    return "no_availability_edge";
  }
  if (
    /(clarify|clarification|disambiguate|which (one|option)|do you mean|could you specify|not sure which)/.test(
      text
    )
  ) {
    return "disambiguation";
  }
  if (
    /(change|actually|correction|i meant|update that|switch to|edit the)/.test(
      text
    )
  ) {
    return "correction";
  }
  return "happy_path";
}

function getMockTestCase(): TestCaseRecord {
  return {
    id: 999999,
    name: "Mocked Voice Agent",
    description:
      process.env.EVAL_TESTCASE_DESCRIPTION ??
      "Restaurant booking assistant that helps users reserve tables by date/time and party size. Handles clarifications and policy refusals.",
    kindOfTestCases:
      process.env.EVAL_TESTCASE_EMPHASIS ?? "balanced coverage with guardrails",
    email: null as any,
    testPhoneNumber: null as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function main() {
  const testCase = getMockTestCase();

  console.log("[eval:generate-tests] Generating sub-tests...");
  const subTests = await generateTestCases(testCase);

  let passed = true;
  const failures: string[] = [];

  try {
    // Validate shape via existing zod schema
    generateTestCasesSchema.parse({ subTests });
  } catch (err) {
    passed = false;
    failures.push(`Schema validation failed: ${(err as Error).message}`);
  }

  try {
    // Extra constraints: exactly 8, reasonable field lengths
    EXTRA_CHECKS_SCHEMA.parse({ subTests });
  } catch (err) {
    passed = false;
    failures.push(`Extra checks failed: ${(err as Error).message}`);
  }

  // Uniqueness of names
  const names = subTests.map((s) => s.name.trim().toLowerCase());
  const nameSet = new Set(names);
  if (nameSet.size !== names.length) {
    passed = false;
    failures.push("Duplicate sub-test names detected");
  }

  // Basic distinctness for prompts
  const prompts = subTests.map((s) => s.prompt.trim().toLowerCase());
  const promptSet = new Set(prompts);
  if (promptSet.size !== prompts.length) {
    passed = false;
    failures.push("Duplicate sub-test prompts detected");
  }

  // Report: heading, description, and inferred type for each sub-test
  console.log("\n[eval:generate-tests] Report");
  console.log("Test Case:", testCase.name);
  console.log("Description:", testCase.description);
  console.log("Emphasis:", testCase.kindOfTestCases, "\n");
  subTests.forEach((st, idx) => {
    const kind = classifySubTest(st.prompt, st.expected);
    console.log(`#${idx + 1} Heading: ${st.name}`);
    console.log(`   Description: ${st.prompt}`);
    console.log(`   Type: ${kind}`);
  });
  console.log("");

  if (passed) {
    console.log(
      `[eval:generate-tests] PASS: generated ${subTests.length} valid sub-tests.`
    );
    process.exit(0);
  } else {
    console.error("[eval:generate-tests] FAIL:");
    for (const f of failures) {
      console.error(" -", f);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[eval:generate-tests] ERROR:", err);
  process.exit(1);
});
