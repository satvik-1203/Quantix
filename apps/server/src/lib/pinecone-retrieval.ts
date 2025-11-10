import { embedText } from "./embeddings";

export type PineconeMatch = {
  id?: string;
  score?: number;
  metadata?: Record<string, any>;
};

export type RetrievedThreadPinecone = {
  threadId: string;
  score: number;
  rawData: {
    threadId?: string;
    messages?: Array<{ from?: string; subject?: string; body?: string }>;
    summary?: string | null;
    [k: string]: any;
  };
};

function getEndpoint(): string {
  const endpoint = process.env.PINECONE_ENDPOINT;
  if (!endpoint) throw new Error("PINECONE_ENDPOINT not set");
  return endpoint.replace(/^@?https?:\/\//, "https://");
}

function getApiKey(): string {
  const key = process.env.PINECONE_KEY;
  if (!key) throw new Error("PINECONE_KEY not set");
  return key;
}

export async function getSimilarThreadsPinecone(
  queryText: string,
  topK: number = 2
): Promise<RetrievedThreadPinecone[]> {
  const apiKey = getApiKey();
  const endpoint = getEndpoint();
  const vector = await embedText(queryText);

  const resp = await fetch(`${endpoint}/query`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Api-Key": apiKey,
    },
    body: JSON.stringify({
      vector,
      topK: Math.max(1, topK),
      includeMetadata: true,
    }),
  });

  if (!resp.ok) {
    let reason = "";
    try {
      reason = await resp.text();
    } catch {}
    throw new Error(`Pinecone query failed: ${resp.status} ${reason}`);
  }
  const data = await resp.json();
  const matches: PineconeMatch[] = data?.matches || [];

  return matches
    .filter((m) => m && typeof m.score === "number")
    .map((m) => {
      const md = m.metadata || {};
      const threadId =
        md.threadId ||
        md.thread_id ||
        md.id ||
        md.thread?.id ||
        md.thread?.thread_id ||
        m.id ||
        "unknown";

      // Parse messages from JSON string or use as-is if already an array
      let messages: any[] = [];
      if (typeof md.messages === "string") {
        try {
          messages = JSON.parse(md.messages);
        } catch {
          messages = [];
        }
      } else if (Array.isArray(md.messages)) {
        messages = md.messages;
      } else if (md.subject || md.body) {
        messages = [
          {
            from: md.from || md.sender || "",
            subject: md.subject || "",
            body: md.body || "",
          },
        ];
      }

      const summary = md.summary || null;

      // Spread md first, then overwrite with parsed values
      return {
        threadId: String(threadId),
        score: Number(m.score || 0),
        rawData: {
          ...md,
          threadId,
          messages, // Overwrite with parsed messages array
          summary,
        },
      };
    });
}

export function formatRetrievedThreadsPinecone(
  items: RetrievedThreadPinecone[],
  maxMessages: number = 3,
  maxCharsPerMsg: number = 400
): string {
  if (!items.length) return "";
  const blocks: string[] = [];
  for (const it of items) {
    const messages = it.rawData?.messages || [];
    // Ensure messages is an array
    const msgs = Array.isArray(messages) ? messages.slice(0, maxMessages) : [];

    if (msgs.length === 0) {
      // Skip threads with no messages
      continue;
    }

    const formatted = msgs
      .map((m: any, idx: number) => {
        const body = String(m?.body || "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, maxCharsPerMsg);
        const to = Array.isArray(m?.to) ? m.to.join(", ") : m?.to || "";
        return `Message ${idx + 1}:
From: ${m?.from || "unknown"}
To: ${to}
Subject: ${m?.subject || "(no subject)"}
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
  return blocks.length > 0
    ? `\n\nREAL EMAIL THREAD EXAMPLES from similar contexts:\n${blocks.join(
        "\n\n========================================\n\n"
      )}\n`
    : "";
}
