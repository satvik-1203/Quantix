import { Router } from "express";
import { getThreadById, listThreads, clearThreadCache } from "./service";
import type { ThreadFilters } from "./service";
import { parseCsv } from "@/lib/csv-parse";
import type { EmailThread, EmailMessage } from "@/lib/email-metrics";
import { upsertEmailThreadsToPinecone } from "@/lib/pinecone-upsert";
import path from "path";
import fs from "fs";

const router: Router = Router();

router.get("/", async (req, res) => {
  try {
    const page = Number.parseInt(String(req.query.page || "1"), 10);
    const pageSize = Number.parseInt(String(req.query.pageSize || "20"), 10);
    const q = (req.query.q as string | undefined) || undefined;
    const filters: ThreadFilters = {};

    const minMessagesRaw = req.query.minMessages as string | undefined;
    const maxMessagesRaw = req.query.maxMessages as string | undefined;
    const startDate = (req.query.startDate as string | undefined) || undefined;
    const endDate = (req.query.endDate as string | undefined) || undefined;
    const domain = (req.query.domain as string | undefined) || undefined;
    const hasSummaryRaw = req.query.hasSummary as string | undefined;

    if (minMessagesRaw != null) {
      const n = Number.parseInt(minMessagesRaw, 10);
      if (Number.isFinite(n)) filters.minMessages = n;
    }
    if (maxMessagesRaw != null) {
      const n = Number.parseInt(maxMessagesRaw, 10);
      if (Number.isFinite(n)) filters.maxMessages = n;
    }
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (domain && domain.trim()) filters.domain = domain.trim();
    if (hasSummaryRaw != null) {
      filters.hasSummary =
        hasSummaryRaw === "1" ||
        hasSummaryRaw.toLowerCase() === "true" ||
        hasSummaryRaw.toLowerCase() === "yes";
    }

    const data = await listThreads(page, pageSize, q, filters);
    res.status(200).json(data);
  } catch (error) {
    console.error("[email-dataset] Failed to list threads:", error);
    res.status(500).json({
      error: "Failed to list email threads",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.get("/:threadId", async (req, res) => {
  try {
    const { threadId } = req.params;
    const thread = await getThreadById(threadId);
    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }
    res.status(200).json(thread);
  } catch (error) {
    console.error("[email-dataset] Failed to fetch thread:", error);
    res.status(500).json({
      error: "Failed to fetch email thread",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Upload user CSV of emails to extend dataset and Pinecone
// Expected CSV columns (header row):
// thread_id, subject, timestamp, from, to, body, summary (optional)
router.post("/upload", async (req, res) => {
  try {
    const contentType = req.headers["content-type"] || "";
    if (!contentType.includes("application/json")) {
      return res.status(400).json({
        error: "Invalid content type. Expected application/json",
      });
    }

    const body = req.body as { csv?: string; filename?: string };
    const csvText = body?.csv;
    if (!csvText || typeof csvText !== "string") {
      return res
        .status(400)
        .json({ error: "Missing 'csv' field in JSON body" });
    }

    const rows = parseCsv(csvText);
    if (!rows.length) {
      return res.status(400).json({ error: "CSV contained no rows" });
    }

    const requiredColumns = [
      "thread_id",
      "subject",
      "timestamp",
      "from",
      "to",
      "body",
    ];
    const header = Object.keys(rows[0] || {});
    const missing = requiredColumns.filter((c) => !header.includes(c));
    if (missing.length) {
      return res.status(400).json({
        error: `CSV missing required columns: ${missing.join(", ")}`,
      });
    }

    // Group rows into threads
    const threadMap = new Map<string, EmailThread>();
    for (const r of rows) {
      const threadId = String(r["thread_id"] || "").trim();
      if (!threadId) continue;
      const subject = r["subject"] ?? "";
      const from = r["from"] ?? "";
      const toRaw = r["to"] ?? "";
      const bodyText = r["body"] ?? "";
      const timestampRaw = r["timestamp"];
      const summary = r["summary"] ?? undefined;

      let timestamp: string | undefined;
      if (timestampRaw) {
        const asNum = Number(timestampRaw);
        if (Number.isFinite(asNum) && asNum > 0) {
          timestamp = new Date(asNum).toISOString();
        } else {
          const d = new Date(String(timestampRaw));
          if (Number.isFinite(d.getTime())) {
            timestamp = d.toISOString();
          }
        }
      }

      const toList = String(toRaw || "")
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const msg: EmailMessage = {
        threadId,
        subject,
        from,
        to: toList,
        body: bodyText,
        timestamp,
      };

      const existing = threadMap.get(threadId);
      if (!existing) {
        threadMap.set(threadId, {
          threadId,
          messages: [msg],
          summary: summary ? String(summary) : undefined,
        });
      } else {
        existing.messages.push(msg);
        if (!existing.summary && summary) {
          existing.summary = String(summary);
        }
      }
    }

    const newThreads: EmailThread[] = Array.from(threadMap.values());
    if (!newThreads.length) {
      return res.status(400).json({
        error: "No valid rows found in CSV (thread_id missing or invalid).",
      });
    }

    // Persist to custom_email_threads.json in data dir
    const dataDirCandidates = [
      path.resolve(process.cwd(), "data"),
      path.resolve(process.cwd(), "..", "..", "data"),
    ];
    let customPath: string | null = null;
    for (const dir of dataDirCandidates) {
      if (fs.existsSync(dir)) {
        customPath = path.join(dir, "custom_email_threads.json");
        break;
      }
    }
    if (!customPath) {
      // Default to repo-root/data/custom_email_threads.json
      const fallbackDir = path.resolve(process.cwd(), "data");
      fs.mkdirSync(fallbackDir, { recursive: true });
      customPath = path.join(fallbackDir, "custom_email_threads.json");
    }

    let existingThreads: EmailThread[] = [];
    if (fs.existsSync(customPath)) {
      try {
        const raw = fs.readFileSync(customPath, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          existingThreads = parsed;
        }
      } catch (err) {
        console.warn(
          "[email-dataset] Failed to read existing custom_email_threads.json:",
          (err as Error)?.message || err
        );
      }
    }

    const mergedMap = new Map<string, EmailThread>();
    for (const t of existingThreads) {
      if (t && t.threadId && Array.isArray(t.messages)) {
        mergedMap.set(String(t.threadId), t);
      }
    }
    for (const t of newThreads) {
      const key = String(t.threadId);
      if (mergedMap.has(key)) {
        const existing = mergedMap.get(key)!;
        existing.messages.push(...t.messages);
        if (!existing.summary && t.summary) {
          existing.summary = t.summary;
        }
      } else {
        mergedMap.set(key, t);
      }
    }

    const mergedThreads = Array.from(mergedMap.values());
    fs.writeFileSync(
      customPath,
      JSON.stringify(mergedThreads, null, 2),
      "utf-8"
    );
    console.log(
      `[email-dataset] Saved ${newThreads.length} new thread(s) to custom_email_threads.json`
    );

    // Invalidate cache so future list requests see new threads
    clearThreadCache();

    // Upsert to Pinecone if configured
    if (process.env.PINECONE_KEY && process.env.PINECONE_ENDPOINT) {
      try {
        await upsertEmailThreadsToPinecone(newThreads);
      } catch (err) {
        console.warn(
          "[email-dataset] Failed to upsert threads to Pinecone:",
          (err as Error)?.message || err
        );
        // Don't fail the request solely due to Pinecone issues
      }
    }

    res.status(200).json({
      message: "CSV uploaded successfully",
      importedThreads: newThreads.length,
    });
  } catch (error) {
    console.error("[email-dataset] Failed to upload CSV:", error);
    res.status(500).json({
      error: "Failed to upload CSV",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
