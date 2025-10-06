import * as ai from "ai";
import { openai } from "@ai-sdk/openai";
import type { TestCaseRecord } from "@workspace/drizzle/schema";
import { generateTestCasesSchema } from "./schema";

const model = openai("gpt-5-mini");

export const generateTestCases = async (testCase: TestCaseRecord) => {
  console.log("Starting test case generation for:", testCase.id);

  try {
    const sysPrompt = `You output strictly valid JSON. No markdown.

You are a rigorous test designer for voice agents. Generate diverse sub-tests as structured JSON matching the schema:
{
  "subTests": [ { "name": string, "prompt": string, "expected": string }, ... ]
}

Coverage (balanced across the set):
- happy path, disambiguation/clarification, corrections, no-availability/edge constraints,
- policy/compliance, error-handling, and guardrails/adversarial attempts.
- fulfillment_mode exclusivity: must be exactly one of ["pickup","delivery","dine_in"]. If multiple modes are mentioned, ask the user to choose one before proceeding. When switching modes, clear conflicting fields and reconfirm.

Per subTest field requirements:
- name: concise title (<= 8 words)
- prompt: the exact end-user utterance sent to the target voice agent (1–2 sentences, <= 180 chars)
- expected: brief expected outcome (<= 220 chars) describing observable behavior (e.g., confirmation, refusal, verification, summary)

Style/constraints:
- Plain English with realistic phrasing; use specific dates/times where natural.
- Make guardrails adversarial but safe; include injection attempts that must be refused.
- Avoid duplicates; ensure each scenario covers a distinct intent.

Return strictly valid JSON matching the schema above and nothing else.`;

    console.log("Calling AI model to generate test cases...");

    const result = await ai.generateObject({
      model,
      schema: generateTestCasesSchema,
      system: sysPrompt,
      messages: [
        {
          role: "user",
          content: `Generate exactly 8 subTests.

Target voice agent description:
${testCase.description}

Emphasis (if provided): ${testCase.kindOfTestCases || "balanced coverage"}

Locale/style: US English; realistic dates/times; no PII.
Ensure each subTest adheres to the schema (name, prompt, expected) with non-duplicative coverage across types.`,
        },
      ],
    });

    console.log(
      "Successfully generated test cases:",
      result.object.subTests.length,
      "sub-tests"
    );

    return result.object.subTests;
  } catch (error) {
    console.error(
      "Error generating test cases for test case ID:",
      testCase.id,
      error
    );

    return [];
  }
};
