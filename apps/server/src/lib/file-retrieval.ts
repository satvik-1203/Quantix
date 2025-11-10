import fs from "fs";
import fsp from "fs/promises";
import path from "path";

type EmailMessage = {
  messageId?: string;
  threadId?: string;
  from?: string;
  to?: string[];
  subject?: string;
  body?: string;
  timestamp?: string;
};

type EmailThread = {
  threadId: string;
  messages: EmailMessage[];
  summary?: string | null;
  intent?: string | null;
  domain?: string | null;
  outcome?: string | null;
};

export type RetrievedThreadFile = {
  threadId: string;
  rawData: EmailThread;
  score: number;
};

let cachedThreads: EmailThread[] | null = null;
let loadAttempted = false;

function datasetDir(): string {
  // Detect repo-root data folder
  return path.resolve(process.cwd(), "data");
}

async function readJsonArray(filePath: string): Promise<any[] | null> {
  try {
    const txt = await fsp.readFile(filePath, "utf-8");
    const parsed = JSON.parse(txt);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return null;
}

function toArrayOfStrings(val: unknown): string[] {
  if (Array.isArray(val)) return val.map((v) => String(v));
  if (typeof val === "string") {
    return val
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeThreads(details: any[], summaries: any[]): EmailThread[] {
  const summaryByThread = new Map<string, string>();
  for (const s of summaries) {
    const tid = String(s.thread_id ?? s.threadId ?? s.id ?? "");
    if (tid) summaryByThread.set(tid, String(s.summary ?? ""));
  }

  const grouped = new Map<string, EmailThread>();
  for (const r of details) {
    const threadId = String(
      r.thread_id ??
        r.threadId ??
        r.id ??
        r.thread?.id ??
        r.thread?.thread_id ??
        ""
    );
    if (!threadId) continue;
    const msg: EmailMessage = {
      messageId: r.message_id ?? r.id ?? undefined,
      threadId,
      from: r.from ?? r.sender ?? r.author ?? "",
      to: toArrayOfStrings(r.to),
      subject: r.subject ?? r.title ?? "",
      body: r.body ?? r.text ?? r.content ?? "",
      timestamp: r.timestamp ?? r.date ?? r.time ?? undefined,
    };
    const existing = grouped.get(threadId);
    if (!existing) {
      grouped.set(threadId, {
        threadId,
        messages: [msg],
        summary: summaryByThread.get(threadId) ?? null,
      });
    } else {
      existing.messages.push(msg);
    }
  }

  const threads: EmailThread[] = [];
  for (const t of grouped.values()) {
    t.messages.sort((a, b) => {
      const at = new Date(a.timestamp || 0).getTime();
      const bt = new Date(b.timestamp || 0).getTime();
      return at - bt;
    });
    threads.push(t);
  }
  return threads;
}

async function loadLocalThreads(): Promise<EmailThread[]> {
  if (cachedThreads) return cachedThreads;
  if (loadAttempted) return [];
  loadAttempted = true;

  const dir = datasetDir();
  const detailsPath = path.join(dir, "email_thread_details.json");
  const summariesPath = path.join(dir, "email_thread_summaries.json");
  if (!fs.existsSync(detailsPath) || !fs.existsSync(summariesPath)) {
    return [];
  }
  try {
    const [details, summaries] = await Promise.all([
      readJsonArray(detailsPath),
      readJsonArray(summariesPath),
    ]);
    if (!details || !summaries) return [];
    cachedThreads = normalizeThreads(details, summaries);
    return cachedThreads;
  } catch {
    return [];
  }
}

function extractKeywords(text: string, max = 12): string[] {
  const stop = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "from",
    "as",
    "is",
    "was",
    "are",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "should",
    "could",
    "may",
    "might",
    "must",
    "can",
    "this",
    "that",
    "these",
    "those",
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "your",
    "our",
    "their",
    "his",
    "her",
  ]);
  return String(text || "")
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2 && !stop.has(w))
    .slice(0, max);
}

function scoreThread(thread: EmailThread, query: string): number {
  const kws = extractKeywords(query);
  if (kws.length === 0) return 0;
  let text = "";
  for (let i = 0; i < Math.min(3, thread.messages.length); i++) {
    const m = thread.messages[i];
    text += ` ${m.subject || ""} ${m.body || ""}`;
  }
  const lower = text.toLowerCase();
  let hits = 0;
  for (const kw of kws) {
    if (lower.includes(kw)) hits++;
  }
  return hits / kws.length;
}

export async function getSimilarThreadsFile(
  queryText: string,
  topK: number = 2
): Promise<RetrievedThreadFile[]> {
  if (!queryText || !queryText.trim()) return [];
  const threads = await loadLocalThreads();
  if (!threads.length) return [];
  const scored = threads
    .map((t) => ({
      threadId: t.threadId,
      rawData: t,
      score: scoreThread(t, queryText),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, topK));
  return scored;
}

export function formatRetrievedThreadsFile(
  items: RetrievedThreadFile[],
  maxMessages: number = 3,
  maxCharsPerMsg: number = 400
): string {
  if (!items.length) return "";
  const blocks: string[] = [];
  for (const it of items) {
    const msgs = (it.rawData?.messages || []).slice(0, maxMessages);
    const formatted = msgs
      .map((m, idx) => {
        const body = String(m.body || "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, maxCharsPerMsg);
        const to = Array.isArray(m.to) ? m.to.join(", ") : m.to || "";
        return `Message ${idx + 1}:
From: ${m.from || "unknown"}
To: ${to}
Subject: ${m.subject || "(no subject)"}
Body: ${body}${body.length >= maxCharsPerMsg ? "..." : ""}`;
      })
      .join("\n\n---\n\n");
    const summary = it.rawData?.summary
      ? `\nSummary: ${String(it.rawData.summary).slice(0, 200)}${
          String(it.rawData.summary).length > 200 ? "..." : ""
        }`
      : "";
    const header = `Thread ${it.threadId} [relevance=${it.score.toFixed(
      2
    )}]${summary}`;
    blocks.push(`${header}\n\n${formatted}`);
  }
  return `\n\nREAL EMAIL THREAD EXAMPLES from similar contexts:\n${blocks.join(
    "\n\n========================================\n\n"
  )}\n`;
}
