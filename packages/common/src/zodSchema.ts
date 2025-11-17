import { z } from "zod";

export const llmJudgeEmailTestSchema = z.object({
  didExpectedTask: z
    .boolean()
    .describe(
      "Whether the customer's entire conversation (all replies) fulfilled the expected user/customer intent as described in the sub-test."
    ),
  divergenceExplanation: z
    .string()
    .max(1200)
    .describe(
      "If the customer replies diverged from expectation, explain where and why, referencing both the most relevant reply/replies and the expected behavior. If not, reply 'None'."
    ),
  suggestedFix: z
    .string()
    .max(1000)
    .describe(
      "If there was a divergence, propose specific changes to the customer reply or the flow to match the expectation. If not, reply 'None'."
    ),
  summary: z
    .string()
    .max(350)
    .describe(
      "Brief summary sentence of the overall judgment (assessment of the entire customer reply conversation as per instructions/expectations)."
    ),
  succeeded: z
    .boolean()
    .describe(
      "Whether the test case succeeded or not for the entire customer conversation. If the test case succeeded, return true. If the test case failed, return false."
    ),
});

export type LlmJudgeEmailTestSchemaType = z.infer<
  typeof llmJudgeEmailTestSchema
>;

export const llmJudgePhoneCallSchema = z.object({
  succeeded: z
    .boolean()
    .describe(
      "Whether the agent successfully fulfilled the user intent based on the call transcript"
    ),
  explanation: z
    .string()
    .describe(
      "Detailed explanation of the judgment, covering what the agent did well or poorly"
    ),
  divergenceExplanation: z
    .string()
    .describe(
      "If the test failed, explain where and how the agent diverged from expected behavior"
    ),
  suggestedFix: z
    .string()
    .describe(
      "Actionable recommendations for how the agent could improve to meet expectations"
    ),
  conversationQuality: z
    .enum(["excellent", "good", "fair", "poor"])
    .optional()
    .describe("Overall quality of the conversation flow"),
  callDurationAppropriate: z
    .boolean()
    .optional()
    .describe("Whether the call duration was reasonable for the task"),
});

export type LlmJudgePhoneCallSchemaType = z.infer<
  typeof llmJudgePhoneCallSchema
>;
