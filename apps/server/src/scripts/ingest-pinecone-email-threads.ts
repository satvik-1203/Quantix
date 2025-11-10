// Load environment variables FIRST before any other imports
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

// Now import everything else
import fs from "fs";
import { loadThreadsFromData } from "@/lib/email-metrics";
import { embedText } from "@/lib/embeddings";

type PineconeUpsertVector = {
  id: string;
  values: number[];
  metadata?: Record<string, any>;
};

function validateOpenAIKey(): void {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.error("\n❌ OPENAI_API_KEY is not set!");
    console.error("Please set it in apps/server/.env.local");
    console.error("Get your key from: https://platform.openai.com/api-keys\n");
    process.exit(1);
  }
  if (!key.startsWith("sk-")) {
    console.error("\n❌ OPENAI_API_KEY has invalid format!");
    console.error(`Got: ${key.substring(0, 10)}...`);
    console.error("OpenAI keys should start with 'sk-' or 'sk-proj-'");
    console.error("Check your apps/server/.env.local file\n");
    process.exit(1);
  }
  console.log(
    `✓ OpenAI key detected: ${key.substring(0, 10)}...${key.substring(
      key.length - 4
    )}`
  );
}

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

function buildEmbeddingText(thread: {
  summary?: string | null;
  messages?: Array<{ subject?: string; body?: string }>;
}): string {
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

async function main() {
  console.log("[ingest:pq] Validating environment...");
  validateOpenAIKey();

  // Try to ensure process.cwd() has a "data/" folder at its root.
  // 1) If DATA_DIR is provided (e.g., /path/to/repo/data), chdir to its parent (repo root)
  const dataDirEnv = process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : null;
  if (
    dataDirEnv &&
    fs.existsSync(dataDirEnv) &&
    fs.existsSync(path.join(dataDirEnv, "email_thread_details.json"))
  ) {
    console.log("[ingest:pq] Using DATA_DIR:", dataDirEnv);
    process.chdir(path.dirname(dataDirEnv));
  } else {
    // 2) If we're running from apps/server, move up to repo root if it contains data/
    const repoRoot = path.resolve(process.cwd(), "..", "..");
    const repoData = path.join(repoRoot, "data");
    if (
      fs.existsSync(repoData) &&
      fs.existsSync(path.join(repoData, "email_thread_details.json"))
    ) {
      console.log(
        "[ingest:pq] Switching cwd to repo root for data/:",
        repoRoot
      );
      process.chdir(repoRoot);
    }
  }

  const threads = await loadThreadsFromData();
  console.log(`[ingest:pq] Loaded ${threads.length} threads from data/`);

  const batchSize = Number(process.env.PINECONE_BATCH_SIZE || 32);
  let processed = 0;

  for (let i = 0; i < threads.length; i += batchSize) {
    const batch = threads.slice(i, i + batchSize);
    const vectors: PineconeUpsertVector[] = [];

    await Promise.all(
      batch.map(async (t) => {
        try {
          const text = buildEmbeddingText(t);
          const values = await embedText(text);
          // Carry compact metadata. Avoid huge blobs to stay within metadata limits.
          const compactMessages = (t.messages || []).slice(0, 3).map((m) => ({
            from: m.from || "",
            subject: (m.subject || "").slice(0, 160),
            body: (m.body || "").slice(0, 300),
          }));
          const md = {
            threadId: t.threadId,
            summary: t.summary ? String(t.summary).slice(0, 500) : null,
            // Store messages as JSON string (Pinecone doesn't support array of objects)
            messages: JSON.stringify(compactMessages),
          };
          vectors.push({
            id: String(t.threadId),
            values,
            metadata: md,
          });
        } catch (err) {
          console.warn(
            `[ingest:pq] Skipping thread ${t.threadId}:`,
            (err as Error)?.message || err
          );
        }
      })
    );

    if (vectors.length > 0) {
      await upsertBatch(vectors);
    }
    processed += batch.length;
    console.log(`[ingest:pq] Upserted ${processed}/${threads.length}`);
  }
  console.log("[ingest:pq] Done.");
}

main().catch((err) => {
  console.error("[ingest:pq] ERROR:", err);
  process.exit(1);
});
