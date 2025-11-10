import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { getEmailMetricsCsv } from "@/routers/email-analytics/service";

async function main() {
  const outDir =
    process.env.ANALYTICS_OUT_DIR ||
    path.resolve(process.cwd(), "data", "outputs");
  const outFile =
    process.env.ANALYTICS_OUT_FILE ||
    path.join(outDir, "email-thread-metrics.csv");
  await fs.mkdir(outDir, { recursive: true });
  const csv = await getEmailMetricsCsv();
  await fs.writeFile(outFile, csv, "utf-8");
  console.log("[export] wrote:", outFile);
}

main().catch((err) => {
  console.error("[export] ERROR:", err);
  process.exit(1);
});
