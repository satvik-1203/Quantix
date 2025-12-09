import { Router } from "express";
import { getEmailMetrics, getEmailMetricsCsv } from "./service";
import { getPineconeStats } from "@/lib/pinecone-stats";

const router: Router = Router();

// GET /api/email-analytics/metrics  -> JSON list of metrics (one row per thread)
router.get("/metrics", async (_req, res) => {
  try {
    const data = await getEmailMetrics();
    res.status(200).json({ count: data.length, data });
  } catch (err) {
    res.status(500).json({ error: (err as Error)?.message || "unknown" });
  }
});

// GET /api/email-analytics/pinecone -> Pinecone index stats
router.get("/pinecone", async (_req, res) => {
  try {
    const stats = await getPineconeStats();
    res.status(200).json(stats);
  } catch (err) {
    res.status(500).json({
      error: (err as Error)?.message || "Failed to read Pinecone stats",
    });
  }
});

// GET /api/email-analytics/metrics.csv -> CSV
router.get("/metrics.csv", async (_req, res) => {
  try {
    const csv = await getEmailMetricsCsv();
    res
      .status(200)
      .setHeader("content-type", "text/csv; charset=utf-8")
      .send(csv);
  } catch (err) {
    res.status(500).json({ error: (err as Error)?.message || "unknown" });
  }
});

export default router;
