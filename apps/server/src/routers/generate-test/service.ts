import { db, testCases, subTests } from "@workspace/drizzle";
import { eq } from "drizzle-orm";
import { generateTestCases } from "./ai/generate-test";
import { logRagTrace } from "@/lib/rag-trace";

export const generateTestService = async (testCaseId: number) => {
  // Get the test case
  try {
    const testCase = await db.query.testCases.findFirst({
      where: eq(testCases.id, testCaseId),
    });

    if (!testCase) {
      throw new Error("Test case not found");
    }

    const { subTests: subTestsArray, rag } = await generateTestCases(testCase);

    await db.insert(subTests).values(
      subTestsArray.map((subTest) => ({
        name: subTest.name,
        description: subTest.prompt,
        testCaseId: testCase.id,
        expected: subTest.expected,
      }))
    );

    // Fire-and-forget logging of RAG trace; we don't block the main flow on this.
    let traceId: string | null = null;
    try {
      const trace = await logRagTrace({
        kind: "generate-tests",
        testCaseId: testCase.id,
        metadata: {
          model: rag.model,
        },
        input: {
          testCase,
        },
        retrieval: rag.retrieval,
        prompt: {
          system: rag.systemPrompt,
          user: rag.userPrompt,
        },
        output: {
          subTests: subTestsArray,
        },
      });
      traceId = trace.id;
    } catch (err) {
      console.warn(
        "[generate-test] Failed to log RAG trace:",
        (err as Error)?.message || err
      );
    }

    return { testCase, traceId };
  } catch (error) {
    console.error("[DB] Failed to query test_cases:", error);
    throw error;
  }
};
