import { embedText } from "./embeddings";
import type { EmailThread } from "./email-metrics";

type PineconeUpsertVector = {
  id: string;
  values: number[];
  metadata?: Record<string, any>;
};

function getEndpoint(): string {
  const endpoint = process.env.PINECONE_ENDPOINT;
  if (!endpoint) {
    throw new Error("PINECONE_ENDPOINT env is required");
  }
  return endpoint.replace(/^@?https?:\/\//, "https://");
}

function getApiKey(): string {
  const key = process.env.PINECONE_KEY;
  if (!key) {
    throw new Error("PINECONE_KEY env is required");
  }
  return key;
}

export function buildEmbeddingTextForThread(thread: EmailThread): string {
  const parts: string[] = [];
  if (thread.summary) {
    parts.push(`summary: ${String(thread.summary).slice(0, 600)}`);
  }
  const msgs = thread.messages || [];
  for (let i = 0; i < Math.min(4, msgs.length); i++) {
    const m = msgs[i] || {};
    if (m.subject) parts.push(`subj: ${String(m.subject).slice(0, 200)}`);
    if (m.body) parts.push(`body: ${String(m.body).slice(0, 600)}`);
  }
  return parts.join("\n");
}

async function upsertBatch(vectors: PineconeUpsertVector[]) {
  const endpoint = getEndpoint();
  const apiKey = getApiKey();
  const namespace = process.env.PINECONE_NAMESPACE || undefined;

  const resp = await fetch(`${endpoint}/vectors/upsert`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Api-Key": apiKey,
    },
    body: JSON.stringify({
      vectors,
      ...(namespace ? { namespace } : {}),
    }),
  });
  if (!resp.ok) {
    let reason = "";
    try {
      reason = await resp.text();
    } catch {}
    throw new Error(`Pinecone upsert failed: ${resp.status} ${reason}`);
  }
}

export async function upsertEmailThreadsToPinecone(
  threads: EmailThread[],
  batchSize: number = Number(process.env.PINECONE_BATCH_SIZE || 32)
): Promise<void> {
  if (!threads.length) return;

  let processed = 0;
  for (let i = 0; i < threads.length; i += batchSize) {
    const batch = threads.slice(i, i + batchSize);
    const vectors: PineconeUpsertVector[] = [];

    await Promise.all(
      batch.map(async (t) => {
        try {
          const text = buildEmbeddingTextForThread(t);
          const values = await embedText(text);
          const compactMessages = (t.messages || []).slice(0, 3).map((m) => ({
            from: m.from || "",
            subject: (m.subject || "").slice(0, 160),
            body: (m.body || "").slice(0, 300),
          }));
          const md = {
            threadId: t.threadId,
            summary: t.summary ? String(t.summary).slice(0, 500) : null,
            messages: JSON.stringify(compactMessages),
          };
          vectors.push({
            id: String(t.threadId),
            values,
            metadata: md,
          });
        } catch (err) {
          console.warn(
            `[pinecone-upsert] Skipping thread ${t.threadId}:`,
            (err as Error)?.message || err
          );
        }
      })
    );

    if (vectors.length > 0) {
      await upsertBatch(vectors);
    }
    processed += batch.length;
    console.log(
      `[pinecone-upsert] Upserted batch. Progress: ${processed}/${threads.length}`
    );
  }
}
