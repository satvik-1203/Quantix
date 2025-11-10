import { computeAllMetrics, loadThreadsFromData } from "@/lib/email-metrics";
import { toCsv } from "@/lib/csv";

export async function getEmailMetrics() {
  const threads = await loadThreadsFromData();
  const metrics = computeAllMetrics(threads);
  return metrics;
}

export async function getEmailMetricsCsv() {
  const rows = await getEmailMetrics();
  return toCsv(rows);
}
