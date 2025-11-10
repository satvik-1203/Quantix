import OpenAI from "openai";

const DEFAULT_EMBEDDING_MODEL =
  process.env.EMBEDDING_MODEL || "text-embedding-3-large";

// Lazy initialization to ensure env vars are loaded
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey:
        process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_PRIVATE || "",
    });
  }
  return openai;
}

export async function embedText(
  text: string,
  model: string = DEFAULT_EMBEDDING_MODEL
): Promise<number[]> {
  const input = (text || "").slice(0, 8000);
  const client = getOpenAIClient();
  const resp = await client.embeddings.create({
    model,
    input,
    dimensions: 1024, // Match Pinecone index dimension
  });
  const embedding = resp.data?.[0]?.embedding;
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error("Failed to create embedding");
  }
  return embedding.map((v) => Number(v));
}
