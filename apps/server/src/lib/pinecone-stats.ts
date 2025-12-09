import { configDotenv } from "dotenv";

// Load env from .env and .env.local (if present)
configDotenv({ path: ".env" });
configDotenv({ path: ".env.local", override: false });

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

export type PineconeStats = {
  dimension: number | null;
  totalVectorCount: number;
  namespaces: Record<string, { vectorCount: number }>;
};

/**
 * Fetch overall index statistics from Pinecone. This does not issue a query;
 * it only reports counts/dimensions, which is safe for analytics displays.
 */
export async function getPineconeStats(): Promise<PineconeStats> {
  const endpoint = getEndpoint();
  const apiKey = getApiKey();

  const resp = await fetch(`${endpoint}/describe_index_stats`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Api-Key": apiKey,
    },
    body: JSON.stringify({}),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `Pinecone describe_index_stats failed: ${resp.status} ${text.slice(
        0,
        200
      )}`
    );
  }

  const data = await resp.json();
  const namespaces = data?.namespaces || {};
  const totalVectorCount = Number(data?.totalVectorCount || 0);
  const dimension = Number.isFinite(data?.dimension) ? data.dimension : null;

  return {
    dimension,
    totalVectorCount,
    namespaces,
  };
}
