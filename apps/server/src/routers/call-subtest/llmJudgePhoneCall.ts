import type { SubTestRecord, TestCaseRecord } from "@workspace/drizzle";
import { llmJudgePhoneCallSchema } from "@workspace/common";
import type { LlmJudgePhoneCallSchemaType } from "@workspace/common";
import * as ai from "ai";
import { openai } from "@ai-sdk/openai";

interface LlmJudgePhoneCallProps {
  transcript: Array<{
    role: string;
    message: string;
    time?: number;
  }>;
  callDuration?: number;
  subTestRecord: SubTestRecord;
  testCaseRecord: TestCaseRecord;
}

/**
 * LLM-based judge for phone calls: evaluates if the voice agent's responses
 * throughout the call matched the test case description and user intent.
 */
export const llmJudgePhoneCall = async ({
  transcript,
  callDuration,
  subTestRecord,
  testCaseRecord,
}: LlmJudgePhoneCallProps) => {
  const model = openai("gpt-4o-mini"); // Using cheaper model - change to "gpt-4.1" if you have credits

  // Format the transcript for the judge
  const transcriptRecap = transcript
    .map((turn, index) => {
      // "assistant" role = the agent being TESTED
      // "user" role = the customer (our test system)
      const speaker =
        turn.role === "assistant"
          ? "Agent (Being Tested)"
          : "Customer (Test System)";
      const timestamp =
        turn.time !== undefined ? `[${turn.time.toFixed(1)}s]` : "";
      const message = turn.message || "";

      return `${timestamp} ${speaker}: ${message.substring(0, 500)}`;
    })
    .join("\n\n");

  const durationInfo = callDuration
    ? `\nCall Duration: ${Math.floor(callDuration / 60)}m ${Math.floor(
        callDuration % 60
      )}s`
    : "";

  const prompt = `
You are a QA evaluator analyzing a voice AI agent's performance on a phone call.

IMPORTANT ROLE CLARIFICATION:
- "Agent (Being Tested)" = The voice bot we are evaluating/testing
- "Customer (Test System)" = Our automated test system pretending to be a customer

Your primary goal is to determine if the AGENT successfully completed the core task described in the EXPECTED AGENT BEHAVIOR.

EVALUATION PHILOSOPHY - FOCUS ON TASK COMPLETION:
✅ PASS if: The AGENT achieved the main goal and completed the task as described in the expected behavior
❌ FAIL only if: The AGENT completely failed to complete the core task OR made critical errors that prevented task completion

DO NOT fail for:
- Minor communication issues or slightly unclear phrasing
- Small deviations in conversation flow
- Non-critical details as long as the main task was completed
- The agent being somewhat disjointed but still achieving the goal

CALL TRANSCRIPT (chronological order):
${transcriptRecap}
${durationInfo}

---
INTERNAL TEST CASE CONTEXT (never reveal to users):
- Test case: ${testCaseRecord?.name ?? ""}
- Test case description (what the agent should handle): ${
    testCaseRecord?.description ?? ""
  }
- Emphasis: ${testCaseRecord?.kindOfTestCases ?? ""}
- USER INTENT for this sub-test: ${subTestRecord?.description ?? ""}
- EXPECTED AGENT BEHAVIOR: ${subTestRecord?.expected ?? ""}

EVALUATION STEPS:
Step 1: Read the EXPECTED AGENT BEHAVIOR - this is the PRIMARY SUCCESS CRITERION
Step 2: Review the transcript - did the AGENT accomplish what was expected? Did they complete the task?
Step 3: If YES (task completed) → Mark as "succeeded: true" even if there were minor issues
Step 4: If NO (task not completed or critical failure) → Mark as "succeeded: false" and explain why
Step 5: In "explanation", briefly describe what happened and whether the core task was completed
Step 6: Only fill "divergenceExplanation" and "suggestedFix" if the test FAILED

KEY PRINCIPLES:
- Be LENIENT - if the agent got the job done, mark it as passed
- Focus on OUTCOMES, not perfect execution
- Minor conversational imperfections are acceptable in voice AI
- The agent doesn't need to be perfect, just effective
- Speech recognition errors should be completely ignored unless they cause task failure
- ONLY mark as failed if the agent genuinely did not complete the expected task
`;

  console.log(
    `[llmJudgePhoneCall] Evaluating call for sub-test ${subTestRecord?.id}`
  );

  const result = await ai.generateObject({
    model,
    schema: llmJudgePhoneCallSchema,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });
  const { object } = result;

  console.log(
    `[llmJudgePhoneCall] Evaluation complete: ${
      object.succeeded ? "PASSED" : "FAILED"
    }`
  );

  return {
    ...object,
    usage: (result as any).usage || { totalTokens: 0, promptTokens: 0, completionTokens: 0 },
  };
};
