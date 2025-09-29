import { z } from "zod";

export const generateTestCasesSchema = z.object({
  subTests: z.array(
    z.object({
      name: z.string().describe("The name of the sub-test"),
      prompt: z.string().describe("The prompt of the sub-test"),
      expected: z.string().describe("The expected output of the sub-test"),
    })
  ),
});
