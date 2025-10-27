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
