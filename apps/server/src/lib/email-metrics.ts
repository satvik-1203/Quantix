import fs from "fs";
import fsp from "fs/promises";
import path from "path";

export type EmailMessage = {
  messageId?: string;
  threadId?: string;
  from?: string;
  to?: string[];
  subject?: string;
  body?: string;
  timestamp?: string;
};

export type EmailThread = {
  threadId: string;
  messages: EmailMessage[];
  summary?: string | null;
};

export type ThreadMetrics = {
  threadId: string;
  subjectFirst?: string;
  numMessages: number;
  participants: number;
  firstSenderDomain?: string;
  firstTimestamp?: string | null;
  lastTimestamp?: string | null;
  firstResponseMinutes?: number | null;
  avgResponseMinutes?: number | null;
  subjectLength?: number | null;
  totalBodyChars: number;
  summaryLength?: number | null;
  startHour?: number | null;
  weekday?: number | null; // 0..6
  lastSender?: string | null;
};

function datasetDir(): string {
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

export async function loadThreadsFromData(): Promise<EmailThread[]> {
  const dir = datasetDir();
  const detailsPath = path.join(dir, "email_thread_details.json");
  const summariesPath = path.join(dir, "email_thread_summaries.json");
  if (!fs.existsSync(detailsPath) || !fs.existsSync(summariesPath)) {
    return [];
  }
  const [details, summaries] = await Promise.all([
    readJsonArray(detailsPath),
    readJsonArray(summariesPath),
  ]);
  if (!details || !summaries) return [];

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

function minutesBetween(a?: string, b?: string): number | null {
  if (!a || !b) return null;
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  if (!isFinite(ta) || !isFinite(tb)) return null;
  return Math.max(0, Math.round((tb - ta) / 60000));
}

export function computeThreadMetrics(thread: EmailThread): ThreadMetrics {
  const m = thread.messages || [];
  const first = m[0];
  const last = m[m.length - 1];
  const participantsSet = new Set<string>();
  for (const msg of m) {
    if (msg.from) participantsSet.add(String(msg.from).toLowerCase());
    for (const rcpt of msg.to || []) {
      participantsSet.add(String(rcpt).toLowerCase());
    }
  }

  // Response times
  let firstResp: number | null = null;
  const deltas: number[] = [];
  for (let i = 1; i < m.length; i++) {
    const delta = minutesBetween(m[i - 1]?.timestamp, m[i]?.timestamp);
    if (delta != null) deltas.push(delta);
  }
  if (deltas.length > 0) {
    firstResp = deltas[0] ?? null;
  }
  const avgResp =
    deltas.length > 0
      ? Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length)
      : null;

  const subjectFirst = first?.subject || "";
  const subjectLength =
    subjectFirst && typeof subjectFirst === "string"
      ? subjectFirst.length
      : null;
  const totalBodyChars = m.reduce(
    (sum, msg) => sum + (msg.body ? String(msg.body).length : 0),
    0
  );
  const firstDomain =
    (first?.from || "").split("@")[1]?.toLowerCase() || undefined;
  const start = first?.timestamp ? new Date(first.timestamp) : null;
  const startHour = start ? start.getHours() : null;
  const weekday = start ? start.getDay() : null;

  return {
    threadId: thread.threadId,
    subjectFirst,
    numMessages: m.length,
    participants: participantsSet.size,
    firstSenderDomain: firstDomain,
    firstTimestamp: first?.timestamp || null,
    lastTimestamp: last?.timestamp || null,
    firstResponseMinutes: firstResp,
    avgResponseMinutes: avgResp,
    subjectLength,
    totalBodyChars,
    summaryLength:
      thread.summary && typeof thread.summary === "string"
        ? thread.summary.length
        : null,
    startHour,
    weekday,
    lastSender: last?.from || null,
  };
}

export function computeAllMetrics(threads: EmailThread[]): ThreadMetrics[] {
  return threads.map(computeThreadMetrics);
}
