// Load environment variables FIRST before any other imports
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

// Now import everything else
import {
  getSimilarThreadsPinecone,
  formatRetrievedThreadsPinecone,
} from "@/lib/pinecone-retrieval";

async function main() {
  console.log("[test] Testing Pinecone retrieval with email threads...\n");

  const testQueries = [
    "termination and contract cancellation",
    "scheduling meetings and appointments",
    "financial transactions and payments",
  ];

  for (const query of testQueries) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Query: "${query}"`);
    console.log("=".repeat(60));

    try {
      const results = await getSimilarThreadsPinecone(query, 2);
      console.log(`\nFound ${results.length} similar threads`);

      for (const result of results) {
        console.log(`\n--- Thread ${result.threadId} ---`);
        console.log(`Score: ${result.score.toFixed(4)}`);
        console.log(`Messages type: ${typeof result.rawData.messages}`);
        console.log(
          `Messages is array: ${Array.isArray(result.rawData.messages)}`
        );
        console.log(
          `Messages count: ${
            Array.isArray(result.rawData.messages)
              ? result.rawData.messages.length
              : "N/A"
          }`
        );
        console.log(`Summary: ${result.rawData.summary?.slice(0, 100)}...`);

        if (
          Array.isArray(result.rawData.messages) &&
          result.rawData.messages.length > 0
        ) {
          const firstMsg = result.rawData.messages[0];
          console.log(`\nFirst message:`);
          console.log(`  From: ${firstMsg.from}`);
          console.log(`  Subject: ${firstMsg.subject}`);
          console.log(
            `  Body (preview): ${String(firstMsg.body).slice(0, 150)}...`
          );
        } else {
          console.log(`\nMessages data (raw):`, result.rawData.messages);
        }
      }

      console.log("\n\nFormatted output for test generation:");
      console.log(formatRetrievedThreadsPinecone(results));
    } catch (err) {
      console.error(`Error querying Pinecone:`, err);
    }
  }

  console.log("\n[test] Done!");
}

main().catch((err) => {
  console.error("[test] ERROR:", err);
  process.exit(1);
});
