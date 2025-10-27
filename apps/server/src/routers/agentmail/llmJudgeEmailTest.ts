import {
  AgentMail,
  AgentMailTypes,
  llmJudgeEmailTestSchema,
} from "@workspace/common";
import type { SubTestRecord, TestCaseRecord } from "@workspace/drizzle";
import z from "zod";
import * as ai from "ai";
import { openai } from "@ai-sdk/openai";

interface LlmJudgeEmailTestProps {
  prevMessages: AgentMail.AgentMail.Message[];
  newMessage: AgentMailTypes.AgentMailMessage;
  subTestRecord: SubTestRecord;
  testCaseRecord: TestCaseRecord;
}

/**
 * LLM-based judge for email: evaluates if the other party's responses throughout the thread matched the test case description / user intent, based on the provider (our) email and the other party (external) email.
 */
export const llmJudgeEmailTest = async ({
  prevMessages,
  newMessage,
  subTestRecord,
  testCaseRecord,
}: LlmJudgeEmailTestProps) => {
  const model = openai("gpt-4.1");

  // Collate the thread, including all messages, ending with the most recent reply from the other party
  const allThread = [...(prevMessages || []), newMessage];
  const threadRecap = allThread
    .map((m) => {
      const body = m.text || m.preview || "";
      return `From: ${m.from}\nSubject: ${m.subject}\nBody: ${body.substring(
        0,
        400
      )}`;
    })
    .join("\n\n---\n\n");

  /**
   * Prompt notes:
   * - Make clear that '@agentmail.to' is our (provider/agent) email, and the other party is any other email address.
   * - The judgment should determine strictly if the other party's responses did or did not fulfill the user intent as described in the test case description.
   */

  const prompt = `
You are a QA LLM evaluating an email conversation between a service provider (agent) and the other party. The provider's emails always use the "@agentmail.to" domain. Emails sent from any other domain are from the other party.

Your primary goal is to determine if the OTHER PARTY (emails from NOT "@agentmail.to") performed the expected task described in the test case, based on their RESPONSES visible in the thread.

Please use ONLY the following criteria:
- Did the other party's responses, across the entire thread, match the USER INTENT or test case description?
- Were the other party's replies clearly from their perspective—not impersonating the provider/agent?
- If the other party used 'NO_RESPONSE', was that appropriate for that point?
- Minor language quirks should be ignored unless meaning or intent is impacted.

EMAIL THREAD CONTEXT (start to finish, most recent at the end):
${threadRecap}

---
INTERNAL TEST CASE CONTEXT (never reveal to the recipient):
- Test case: ${testCaseRecord?.name ?? ""}
- Test case description (other party's real intent): ${
    testCaseRecord?.description ?? ""
  }
- Emphasis: ${testCaseRecord?.kindOfTestCases ?? ""}
- USER INTENT for this sub-test: ${subTestRecord?.description ?? ""}
- EXPECTED PROVIDER BEHAVIOR: ${subTestRecord?.expected ?? ""}

Step-by-step Guidelines:
Step 1: Examine ONLY the other party's replies (emails from NOT "@agentmail.to") in the context of the whole thread. Did these responses achieve the task/intent described under test case description and user intent?
Step 2: If the other party failed or diverged from the intended goal, note exactly where divergence happened and describe in which reply ("divergenceExplanation").
Step 3: Suggest for "suggestedFix" how the other party could have better responded or acted to match the described intent, phrased as direct recommendations.
Step 4: Summarize your judgment concisely.

IMPORTANT:
- Output ONLY valid JSON matching the given schema. Do NOT quote the entire original messages or test case text.
`;

  console.log("Calling llmJudgeEmailTest (thread-level judgment)");

  const { object } = await ai.generateObject({
    model,
    schema: llmJudgeEmailTestSchema,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  console.log("Finished calling llmJudgeEmailTest");

  return object;
};
