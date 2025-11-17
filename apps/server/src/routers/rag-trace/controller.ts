import { Router } from "express";
import { getRagTraceById, listRagTraces } from "@/lib/rag-trace";

const router: Router = Router();

// GET /api/rag-trace?testCaseId=&subTestId=&kind=
router.get("/", async (req, res) => {
  try {
    const { testCaseId, subTestId, kind, limit } = req.query;

    const parsedTestCaseId =
      typeof testCaseId === "string" ? Number(testCaseId) : undefined;
    const parsedSubTestId =
      typeof subTestId === "string" ? Number(subTestId) : undefined;
    const parsedLimit =
      typeof limit === "string" ? Number(limit) || undefined : undefined;

    const traces = await listRagTraces({
      kind: typeof kind === "string" ? kind : undefined,
      testCaseId:
        typeof parsedTestCaseId === "number" && !Number.isNaN(parsedTestCaseId)
          ? parsedTestCaseId
          : undefined,
      subTestId:
        typeof parsedSubTestId === "number" && !Number.isNaN(parsedSubTestId)
          ? parsedSubTestId
          : undefined,
      limit: parsedLimit,
    });

    res.status(200).json({ count: traces.length, data: traces });
  } catch (err) {
    res.status(500).json({
      error:
        (err as Error)?.message || "Failed to list RAG traces for inspection.",
    });
  }
});

// GET /api/rag-trace/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "id is required" });
    }

    const trace = await getRagTraceById(id);
    if (!trace) {
      return res.status(404).json({ error: "Trace not found" });
    }

    res.status(200).json({ trace });
  } catch (err) {
    res.status(500).json({
      error:
        (err as Error)?.message || "Failed to load RAG trace for inspection.",
    });
  }
});

export default router;
