import { loadThreadsFromData } from "@/lib/email-metrics";
import type { EmailThread } from "@/lib/email-metrics";

export type ThreadListItem = {
  threadId: string;
  subject: string;
  firstFrom: string;
  numMessages: number;
  summarySnippet: string;
};

export type ThreadListResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: ThreadListItem[];
};

export type ThreadFilters = {
  minMessages?: number;
  maxMessages?: number;
  startDate?: string;
  endDate?: string;
  domain?: string;
  hasSummary?: boolean;
};

let cachedThreads: EmailThread[] | null = null;

export function clearThreadCache() {
  cachedThreads = null;
}

async function getAllThreads(): Promise<EmailThread[]> {
  if (cachedThreads) return cachedThreads;
  const threads = await loadThreadsFromData();
  // Sort by threadId numeric if possible, else as string
  cachedThreads = threads.sort((a, b) => {
    const na = Number(a.threadId);
    const nb = Number(b.threadId);
    if (Number.isFinite(na) && Number.isFinite(nb)) {
      return na - nb;
    }
    return a.threadId.localeCompare(b.threadId);
  });
  return cachedThreads;
}

function normalizeSearchText(thread: EmailThread): string {
  const firstMsg = thread.messages?.[0];
  const subject = firstMsg?.subject || "";
  const body = firstMsg?.body || "";
  const summary = thread.summary || "";
  return `${subject}\n${body}\n${summary}`.toLowerCase();
}

export async function listThreads(
  page: number,
  pageSize: number,
  query?: string,
  filters?: ThreadFilters
): Promise<ThreadListResponse> {
  const all = await getAllThreads();
  const q = (query || "").trim().toLowerCase();

  const startMs =
    filters?.startDate && filters.startDate.trim()
      ? new Date(filters.startDate).getTime()
      : undefined;
  const endMs =
    filters?.endDate && filters.endDate.trim()
      ? new Date(filters.endDate).getTime()
      : undefined;
  const hasSummary = filters?.hasSummary;
  const minMessages = filters?.minMessages;
  const maxMessages = filters?.maxMessages;
  const domain = filters?.domain?.toLowerCase().trim() || "";

  const filtered = all.filter((t) => {
    // Text search
    if (q && !normalizeSearchText(t).includes(q)) {
      return false;
    }

    const messages = t.messages || [];
    const msgCount = messages.length;

    // Message count filters
    if (minMessages != null && Number.isFinite(minMessages)) {
      if (msgCount < minMessages) return false;
    }
    if (maxMessages != null && Number.isFinite(maxMessages)) {
      if (msgCount > maxMessages) return false;
    }

    // Summary filter
    if (hasSummary) {
      if (!t.summary || String(t.summary).trim().length === 0) {
        return false;
      }
    }

    // Domain filter (check first sender and optionally all senders)
    if (domain) {
      const froms = messages.map((m) => String(m.from || "").toLowerCase());
      if (!froms.some((f) => f.includes(domain))) {
        return false;
      }
    }

    // Date range filter (based on first/last message timestamps)
    if (startMs || endMs) {
      let firstTs: number | undefined;
      let lastTs: number | undefined;
      for (const m of messages) {
        if (!m.timestamp) continue;
        const tMs = new Date(m.timestamp).getTime();
        if (!Number.isFinite(tMs)) continue;
        if (firstTs == null || tMs < firstTs) firstTs = tMs;
        if (lastTs == null || tMs > lastTs) lastTs = tMs;
      }

      if (startMs != null && lastTs != null && lastTs < startMs) {
        return false;
      }
      if (endMs != null && firstTs != null && firstTs > endMs) {
        return false;
      }
    }

    return true;
  });

  const total = filtered.length;
  const safePageSize = Math.min(Math.max(pageSize, 1), 100);
  const maxPage = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(Math.max(page, 1), maxPage);
  const offset = (safePage - 1) * safePageSize;
  const slice = filtered.slice(offset, offset + safePageSize);

  const items: ThreadListItem[] = slice.map((t) => {
    const first = t.messages?.[0];
    const subject = first?.subject || "(no subject)";
    const from = first?.from || "(unknown)";
    const summaryText =
      (t.summary && String(t.summary)) ||
      (t.messages?.[0]?.body && String(t.messages[0].body)) ||
      "";
    const summarySnippet = summaryText.replace(/\s+/g, " ").slice(0, 200);
    return {
      threadId: t.threadId,
      subject,
      firstFrom: from,
      numMessages: t.messages?.length || 0,
      summarySnippet,
    };
  });

  return {
    page: safePage,
    pageSize: safePageSize,
    total,
    items,
  };
}

export async function getThreadById(
  threadId: string
): Promise<EmailThread | null> {
  const all = await getAllThreads();
  const found = all.find((t) => t.threadId === threadId);
  return found || null;
}
