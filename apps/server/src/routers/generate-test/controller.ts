import { Router } from "express";
import { generateTestService } from "./service";

const router: Router = Router();

router.post("/", async (req, res) => {
  try {
    const { testCaseId } = req.body;

    if (!testCaseId) {
      return res.status(400).json({ error: "testCaseId is required" });
    }

    console.log(
      `[generate-test] Starting generation for test case ${testCaseId}...`
    );

    // Set a generous timeout (60 seconds) for AI generation
    const timeoutMs = 60000;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Test generation timed out after 60 seconds")),
        timeoutMs
      )
    );

    const result = await Promise.race([
      generateTestService(testCaseId),
      timeoutPromise,
    ]);

    console.log(
      `[generate-test] Successfully completed generation for test case ${testCaseId}`
    );
    res.json({ result });
  } catch (error) {
    console.error("Error generating test cases:", error);
    res.status(500).json({
      error: "Failed to generate test cases",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
