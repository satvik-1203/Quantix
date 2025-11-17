import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export type RagTraceKind =
  | "generate-tests"
  | "respond-agent"
  | "draft-first-message"
  | string;

export interface RagTrace {
  id: string;
  createdAt: string;
  kind: RagTraceKind;
  testCaseId?: number | null;
  subTestId?: number | null;
  metadata?: {
    model?: string;
    [key: string]: any;
  };
  input?: any;
  retrieval?: {
    engine?: "pinecone" | "file" | "none" | string | null;
    queryText?: string;
    snippet?: string;
    [key: string]: any;
  };
  prompt?: {
    system?: string;
    user?: string;
    [key: string]: any;
  };
  output?: any;
  evalResult?: any;
}

function tracesDir(): string {
  // Prefer repo-root /data/rag_traces when running from apps/server
  const repoRoot = path.resolve(process.cwd(), "..", "..");
  const repoTraces = path.join(repoRoot, "data", "rag_traces");
  return repoTraces;
}

async function ensureDirExists(dir: string): Promise<void> {
  try {
    await fsp.mkdir(dir, { recursive: true });
  } catch {
    // ignore
  }
}

export async function logRagTrace(
  partial: Omit<RagTrace, "id" | "createdAt">
): Promise<RagTrace> {
  const dir = tracesDir();
  await ensureDirExists(dir);

  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const trace: RagTrace = {
    id,
    createdAt,
    ...partial,
  };

  const safeTs = createdAt.replace(/[:.]/g, "-");
  const filename = `${safeTs}-${id}.json`;
  const filePath = path.join(dir, filename);

  try {
    await fsp.writeFile(filePath, JSON.stringify(trace, null, 2), "utf-8");
  } catch (err) {
    // If writing fails, we still return the trace so callers can continue.
    console.warn(
      "[rag-trace] Failed to write trace file:",
      (err as Error)?.message || err
    );
  }

  return trace;
}

export async function listRagTraces(options?: {
  kind?: RagTraceKind;
  testCaseId?: number;
  subTestId?: number;
  limit?: number;
}): Promise<RagTrace[]> {
  const dir = tracesDir();
  if (!fs.existsSync(dir)) {
    return [];
  }

  let files: string[] = [];
  try {
    files = await fsp.readdir(dir);
  } catch (err) {
    console.warn(
      "[rag-trace] Failed to read traces directory:",
      (err as Error)?.message || err
    );
    return [];
  }

  const traces: RagTrace[] = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const fullPath = path.join(dir, file);
    try {
      const txt = await fsp.readFile(fullPath, "utf-8");
      const parsed = JSON.parse(txt) as RagTrace;
      traces.push(parsed);
    } catch {
      // Skip malformed entries
    }
  }

  // Apply basic filtering
  let filtered = traces;
  if (options?.kind) {
    filtered = filtered.filter((t) => t.kind === options.kind);
  }
  if (typeof options?.testCaseId === "number") {
    filtered = filtered.filter((t) => t.testCaseId === options.testCaseId);
  }
  if (typeof options?.subTestId === "number") {
    filtered = filtered.filter((t) => t.subTestId === options.subTestId);
  }

  // Sort newest first
  filtered.sort((a, b) => {
    const ta = new Date(a.createdAt || 0).getTime();
    const tb = new Date(b.createdAt || 0).getTime();
    return tb - ta;
  });

  if (options?.limit && options.limit > 0) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

export async function getRagTraceById(id: string): Promise<RagTrace | null> {
  const dir = tracesDir();
  if (!fs.existsSync(dir)) {
    return null;
  }

  let files: string[] = [];
  try {
    files = await fsp.readdir(dir);
  } catch {
    return null;
  }

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const fullPath = path.join(dir, file);
    try {
      const txt = await fsp.readFile(fullPath, "utf-8");
      const parsed = JSON.parse(txt) as RagTrace;
      if (parsed.id === id) {
        return parsed;
      }
    } catch {
      // ignore malformed
    }
  }

  return null;
}
