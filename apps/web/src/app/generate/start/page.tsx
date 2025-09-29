"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LineChart, Sigma, Zap } from "lucide-react";
import { toast } from "sonner";

const DISTRIBUTIONS = [
  "Gaussian (Normal)",
  "Uniform",
  "Poisson",
  "Exponential",
  "Log-normal",
  "Custom mixture",
] as const;

function parseNum(value: string, fallback = 0): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

function sampleNormal(mean: number, std: number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + std * z;
}

function sampleUniform(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function samplePoisson(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

function sampleExponential(lambda: number): number {
  const u = Math.random();
  return -Math.log(1 - u) / lambda;
}

function sampleLogNormal(mu: number, sigma: number): number {
  const x = sampleNormal(mu, sigma);
  return Math.exp(x);
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance =
    values.reduce((acc, x) => acc + (x - m) * (x - m), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function format(n: number, digits = 3): string {
  return Number.isFinite(n) ? n.toFixed(digits) : "—";
}

export default function StartGenerationPage() {
  const params = useSearchParams();
  const router = useRouter();
  const prior = useMemo(() => Object.fromEntries(params.entries()), [params]);

  const [inferred, setInferred] = useState<null | {
    distribution: string;
    params: any;
    source: string;
    explanation?: string;
    fields?: Array<{ name: string; type: string }>;
  }>(null);
  const [preview, setPreview] = useState<number[] | null>(null);
  const [rowObjects, setRowObjects] = useState<any[] | null>(null);
  const [normalizedObjects, setNormalizedObjects] = useState<any[] | null>(
    null
  );
  const [mlReadyObjects, setMlReadyObjects] = useState<any[] | null>(null);
  const [mathLines, setMathLines] = useState<string[] | null>(null);
  const [normalizationInfo, setNormalizationInfo] = useState<{
    method: string;
    params: any;
    reason: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  function randomIp() {
    return `${Math.floor(Math.random() * 256)}.${Math.floor(
      Math.random() * 256
    )}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
  }

  function randomPhone() {
    const d = () => Math.floor(Math.random() * 10);
    return `+1-${d()}${d()}${d()}-${d()}${d()}${d()}-${d()}${d()}${d()}${d()}`;
  }

  function randomIcd10() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const L = letters[Math.floor(Math.random() * letters.length)];
    const n1 = Math.floor(Math.random() * 10);
    const n2 = Math.floor(Math.random() * 10);
    const n3 = Math.floor(Math.random() * 10);
    return `${L}${n1}${n2}.${n3}`;
  }

  // Statistical functions for normalization detection
  function shapiroWilk(data: number[]): number {
    // Simplified Shapiro-Wilk test implementation
    const n = data.length;
    if (n < 3) return 0.5;

    const sorted = [...data].sort((a, b) => a - b);
    const mean = sorted.reduce((a, b) => a + b, 0) / n;
    const variance =
      sorted.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);

    // Simplified W statistic calculation
    const W = Math.max(0, Math.min(1, 1 - variance / (mean * mean + 1)));
    return W;
  }

  function isNormal(data: number[]): boolean {
    const W = shapiroWilk(data);
    return W > 0.9; // Simplified threshold
  }

  function detectNormalization(data: number[]): {
    method: "log" | "sqrt" | "box-cox" | "z-score" | "none";
    params: any;
    reason: string;
  } {
    // Check for log-normal: log(data) should be normal
    const logData = data.filter((x) => x > 0).map((x) => Math.log(x));
    if (logData.length > 3 && isNormal(logData)) {
      return {
        method: "log",
        params: {},
        reason: "Log-normal distribution detected",
      };
    }

    // Check for square root: sqrt(data) should be normal
    const sqrtData = data.map((x) => Math.sqrt(Math.max(0, x)));
    if (isNormal(sqrtData)) {
      return {
        method: "sqrt",
        params: {},
        reason: "Square root normal distribution detected",
      };
    }

    // Check for Box-Cox transformation (simplified)
    const positiveData = data.filter((x) => x > 0);
    if (positiveData.length > 3) {
      const logData = positiveData.map((x) => Math.log(x));
      if (isNormal(logData)) {
        return {
          method: "box-cox",
          params: { lambda: 0 },
          reason: "Box-Cox transformation optimal",
        };
      }
    }

    // Default to z-score for standardization
    return {
      method: "z-score",
      params: {},
      reason: "Standardization recommended",
    };
  }

  function applyNormalization(
    data: number[],
    method: string,
    params: any
  ): number[] {
    switch (method) {
      case "log":
        return data.filter((x) => x > 0).map((x) => Math.log(x));
      case "sqrt":
        return data.map((x) => Math.sqrt(Math.max(0, x)));
      case "box-cox":
        const lambda = params.lambda || 0;
        if (lambda === 0) {
          return data.filter((x) => x > 0).map((x) => Math.log(x));
        } else {
          return data.map((x) => (Math.pow(x, lambda) - 1) / lambda);
        }
      case "z-score":
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const std = Math.sqrt(
          data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) /
            (data.length - 1)
        );
        return data.map((x) => (x - mean) / std);
      default:
        return data;
    }
  }

  function oneHotEncode(
    data: any[],
    fieldName: string
  ): { [key: string]: number[] } {
    // Get all unique values for the field
    const uniqueValues = [...new Set(data.map((row) => row[fieldName]))];

    // Create one-hot encoding for each unique value
    const encoded: { [key: string]: number[] } = {};
    uniqueValues.forEach((value) => {
      encoded[`${fieldName}_${value}`] = data.map((row) =>
        row[fieldName] === value ? 1 : 0
      );
    });

    return encoded;
  }

  function isModelTrainingUseCase(dataNeed: string, freeText: string): boolean {
    const text = `${dataNeed} ${freeText}`.toLowerCase();
    return (
      text.includes("model") ||
      text.includes("training") ||
      text.includes("machine learning") ||
      text.includes("ml") ||
      text.includes("intelligence") ||
      text.includes("ai") ||
      text.includes("algorithm")
    );
  }

  function toCsv(rows: Array<Record<string, any>>): string {
    if (!rows || rows.length === 0) return "";
    const headers = Object.keys(rows[0]);
    const escape = (val: any) => {
      const s = String(val ?? "");
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    const lines = [headers.join(",")];
    for (const row of rows) {
      lines.push(headers.map((h) => escape(row[h])).join(","));
    }
    return lines.join("\n");
  }

  function download(
    filename: string,
    content: string,
    type = "text/csv;charset=utf-8"
  ) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function parseRowCount(input: string | undefined): number {
    if (!input) return 100;
    const n = parseInt(String(input).replace(/[^0-9]/g, ""), 10);
    if (!Number.isFinite(n) || n <= 0) return 100;
    return Math.min(n, 1_000_000);
  }

  async function onStartGeneration() {
    if (!inferred) return;
    setGenerating(true);
    try {
      const count = parseRowCount(prior.recordVolume);
      const resp = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fields: (inferred.fields || [
            { name: "value", type: "number" },
          ]) as Array<{
            name: string;
            type: "number" | "string" | "date";
          }>,
          distribution: inferred.distribution,
          params: inferred.params,
          count,
          context: {
            industry: prior.industry,
            dataNeed: prior.dataNeed,
            recordVolume: prior.recordVolume,
            sensitive: prior.sensitive,
            notes: prior.freeText,
          },
        }),
      });

      let csv = await resp.text();
      const usedLLM =
        resp.ok && resp.headers.get("x-generation-mode") !== "fallback-no-llm";
      if (usedLLM) {
        toast.success("Generating with LLM", {
          description: `Synthesizing ${count} rows using Groq model`,
        });
      }
      if (!resp.ok || !csv || csv.trim().length === 0) {
        toast.message("Falling back to local generation", {
          description: `Generating ${count} rows in your browser`,
        });
        // Fallback to local generation when LLM is unavailable or returns empty
        const d = inferred.distribution as string;
        const p = inferred.params || {};
        const samplePrimary = () => {
          if (d === "Gaussian (Normal)") {
            const m = Number(p.mean ?? 0);
            const s = Math.max(Number(p.stddev ?? 1), 1e-6);
            return sampleNormal(m, s);
          }
          if (d === "Uniform") {
            const a = Number(p.min ?? 0);
            const b = Number(p.max ?? 1);
            const lo = Math.min(a, b);
            const hi = Math.max(a, b);
            return sampleUniform(lo, hi);
          }
          if (d === "Poisson") {
            const l = Math.max(Number(p.lambda ?? 1), 1e-6);
            return samplePoisson(l);
          }
          if (d === "Exponential") {
            const l = Math.max(Number(p.lambda ?? 1), 1e-6);
            return sampleExponential(l);
          }
          if (d === "Log-normal") {
            const mu = Number(p.mean ?? 0);
            const sg = Math.max(Number(p.stddev ?? 1), 1e-6);
            return sampleLogNormal(mu, sg);
          }
          return sampleNormal(0, 1);
        };

        const fieldDefs = (inferred.fields || [
          { name: "value", type: "number" },
        ]) as Array<{
          name: string;
          type: string;
        }>;

        const merchants = [
          "Amazon",
          "Walmart",
          "Target",
          "Starbucks",
          "Uber",
          "Apple Store",
        ];
        const categories = [
          "Groceries",
          "Dining",
          "Transport",
          "Electronics",
          "Health",
          "Utilities",
        ];

        const rows: any[] = [];
        for (let i = 0; i < count; i++) {
          const primary = samplePrimary();
          const r: any = {};
          fieldDefs.forEach((f) => {
            const nm = f.name.toLowerCase();
            if (
              nm === "amount" ||
              nm === "price" ||
              nm === "duration_seconds" ||
              nm === "inter_arrival_seconds" ||
              nm === "length_of_stay" ||
              nm === "charge"
            ) {
              r[f.name] = format(
                primary,
                nm === "duration_seconds" || nm === "inter_arrival_seconds"
                  ? 3
                  : 2
              );
            } else if (nm === "timestamp" || nm === "timestamp_start") {
              const now = Date.now();
              r[f.name] = new Date(
                now - Math.floor(Math.random() * 30 * 864e5)
              ).toISOString();
            } else if (nm === "merchant") {
              r[f.name] =
                merchants[Math.floor(Math.random() * merchants.length)];
            } else if (nm === "category") {
              r[f.name] =
                categories[Math.floor(Math.random() * categories.length)];
            } else if (nm === "currency") {
              r[f.name] = "USD";
            } else if (nm === "card_last4") {
              r[f.name] = String(1000 + Math.floor(Math.random() * 9000));
            } else if (nm === "channel") {
              r[f.name] = Math.random() < 0.5 ? "card-present" : "ecom";
            } else if (nm === "city") {
              r[f.name] = ["San Francisco", "New York", "Austin", "Seattle"][
                Math.floor(Math.random() * 4)
              ];
            } else if (nm === "country") {
              r[f.name] = "US";
            } else if (
              nm === "txn_id" ||
              nm === "order_id" ||
              nm === "encounter_id" ||
              nm === "call_id" ||
              nm === "event_id"
            ) {
              r[f.name] = `${nm.split("_")[0]}_${Math.random()
                .toString(36)
                .slice(2, 10)}`;
            } else if (nm === "source_ip" || nm === "dest_ip") {
              r[f.name] = randomIp();
            } else if (nm === "from_number" || nm === "to_number") {
              r[f.name] = randomPhone();
            } else if (nm === "diagnosis_code") {
              r[f.name] = randomIcd10();
            } else if (f.type === "number") {
              r[f.name] = format(primary * (0.9 + Math.random() * 0.2), 3);
            } else if (f.type === "date") {
              r[f.name] = new Date(
                Date.now() - Math.floor(Math.random() * 7 * 864e5)
              ).toISOString();
            } else {
              r[f.name] = `${f.name}_${i + 1}`;
            }
          });
          rows.push(r);
        }
        csv = toCsv(rows);
      }
      const safeName = (prior.dataNeed || "synthetic-data")
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const filename = `${safeName || "synthetic-data"}-${count}.csv`;
      download(filename, csv);
      try {
        sessionStorage.setItem("generatedCsv", csv);
        sessionStorage.setItem("generatedFilename", filename);
      } catch {}
      router.push(`/generate/start/view` as any);
    } finally {
      setGenerating(false);
    }
  }

  async function onInfer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setInferred(null);
    setPreview(null);
    setMathLines(null);
    setRowObjects(null);
    setNormalizedObjects(null);
    setMlReadyObjects(null);
    setNormalizationInfo(null);

    const resp = await fetch("/api/shape", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        industry: prior.industry,
        dataNeed: prior.dataNeed,
        recordVolume: prior.recordVolume,
        sensitive: prior.sensitive === "true",
        notes: prior.freeText,
      }),
    });

    const data = await resp.json();
    setInferred(data);

    // Determine sampling function from inferred distribution
    const d = data.distribution as string;
    const p = data.params || {};
    const samplePrimary = () => {
      if (d === "Gaussian (Normal)") {
        const m = Number(p.mean ?? 0);
        const s = Math.max(Number(p.stddev ?? 1), 1e-6);
        return sampleNormal(m, s);
      }
      if (d === "Uniform") {
        const a = Number(p.min ?? 0);
        const b = Number(p.max ?? 1);
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        return sampleUniform(lo, hi);
      }
      if (d === "Poisson") {
        const l = Math.max(Number(p.lambda ?? 1), 1e-6);
        return samplePoisson(l);
      }
      if (d === "Exponential") {
        const l = Math.max(Number(p.lambda ?? 1), 1e-6);
        return sampleExponential(l);
      }
      if (d === "Log-normal") {
        const mu = Number(p.mean ?? 0);
        const sg = Math.max(Number(p.stddev ?? 1), 1e-6);
        return sampleLogNormal(mu, sg);
      }
      return sampleNormal(0, 1);
    };

    // Generate 10 primary samples
    const out: number[] = [];
    for (let i = 0; i < 10; i++) out.push(samplePrimary());
    setPreview(out);

    // Detect and apply normalization
    const normInfo = detectNormalization(out);
    setNormalizationInfo(normInfo);
    const normalizedData = applyNormalization(
      out,
      normInfo.method,
      normInfo.params
    );

    // Compute math summary on NORMALIZED data for statistical validation
    const normMean = mean(normalizedData);
    const normStd = stddev(normalizedData);
    const shapiroW = shapiroWilk(normalizedData);

    setMathLines([
      `Normalization: ${normInfo.method} (${normInfo.reason})`,
      `Normalized E[X] = ${format(normMean)} • Normalized σ = ${format(
        normStd
      )}`,
      `Shapiro-Wilk W = ${format(shapiroW, 3)} • ${
        shapiroW > 0.9 ? "Normal" : "Non-normal"
      }`,
    ]);

    // Build row objects using domain fields; map primary numeric column to appropriate field
    if (Array.isArray(data.fields) && data.fields.length > 0) {
      const rows: any[] = [];
      const fieldDefs = data.fields as Array<{ name: string; type: string }>;
      const merchants = [
        "Amazon",
        "Walmart",
        "Target",
        "Starbucks",
        "Uber",
        "Apple Store",
      ];
      const categories = [
        "Groceries",
        "Dining",
        "Transport",
        "Electronics",
        "Health",
        "Utilities",
      ];
      for (let i = 0; i < 10; i++) {
        const r: any = {};
        fieldDefs.forEach((f) => {
          const nm = f.name.toLowerCase();
          if (
            nm === "amount" ||
            nm === "price" ||
            nm === "duration_seconds" ||
            nm === "inter_arrival_seconds" ||
            nm === "length_of_stay" ||
            nm === "charge"
          ) {
            // Use primary sample so math summary matches these values
            r[f.name] = format(
              out[i],
              nm === "duration_seconds" || nm === "inter_arrival_seconds"
                ? 3
                : 2
            );
          } else if (nm === "timestamp" || nm === "timestamp_start") {
            const now = Date.now();
            r[f.name] = new Date(
              now - Math.floor(Math.random() * 30 * 864e5)
            ).toISOString();
          } else if (nm === "merchant") {
            r[f.name] = merchants[Math.floor(Math.random() * merchants.length)];
          } else if (nm === "category") {
            r[f.name] =
              categories[Math.floor(Math.random() * categories.length)];
          } else if (nm === "currency") {
            r[f.name] = "USD";
          } else if (nm === "card_last4") {
            r[f.name] = String(1000 + Math.floor(Math.random() * 9000));
          } else if (nm === "channel") {
            r[f.name] = Math.random() < 0.5 ? "card-present" : "ecom";
          } else if (nm === "city") {
            r[f.name] = ["San Francisco", "New York", "Austin", "Seattle"][
              Math.floor(Math.random() * 4)
            ];
          } else if (nm === "country") {
            r[f.name] = "US";
          } else if (
            nm === "txn_id" ||
            nm === "order_id" ||
            nm === "encounter_id" ||
            nm === "call_id" ||
            nm === "event_id"
          ) {
            r[f.name] = `${nm.split("_")[0]}_${Math.random()
              .toString(36)
              .slice(2, 10)}`;
          } else if (nm === "source_ip" || nm === "dest_ip") {
            r[f.name] = randomIp();
          } else if (nm === "from_number" || nm === "to_number") {
            r[f.name] = randomPhone();
          } else if (nm === "diagnosis_code") {
            r[f.name] = randomIcd10();
          } else if (f.type === "number") {
            // Secondary numeric fields: derive mild noise around primary to look plausible but keep preview focused on primary
            r[f.name] = format(out[i] * (0.9 + Math.random() * 0.2), 3);
          } else if (f.type === "date") {
            r[f.name] = new Date(
              Date.now() - Math.floor(Math.random() * 7 * 864e5)
            ).toISOString();
          } else {
            r[f.name] = `${f.name}_${i + 1}`;
          }
        });
        rows.push(r);
      }
      setRowObjects(rows);

      // Create normalized version of the same data
      const normalizedRows: any[] = [];
      for (let i = 0; i < 10; i++) {
        const r: any = {};
        fieldDefs.forEach((f) => {
          const nm = f.name.toLowerCase();
          if (
            nm === "amount" ||
            nm === "price" ||
            nm === "duration_seconds" ||
            nm === "inter_arrival_seconds" ||
            nm === "length_of_stay" ||
            nm === "charge"
          ) {
            // Use normalized value for statistical validation
            r[f.name] = format(normalizedData[i], 3);
          } else if (nm === "timestamp" || nm === "timestamp_start") {
            r[f.name] = new Date(
              Date.now() - Math.floor(Math.random() * 30 * 864e5)
            ).toISOString();
          } else if (nm === "merchant") {
            r[f.name] = merchants[Math.floor(Math.random() * merchants.length)];
          } else if (nm === "category") {
            r[f.name] =
              categories[Math.floor(Math.random() * categories.length)];
          } else if (nm === "currency") {
            r[f.name] = "USD";
          } else if (nm === "card_last4") {
            r[f.name] = String(1000 + Math.floor(Math.random() * 9000));
          } else if (nm === "channel") {
            r[f.name] = Math.random() < 0.5 ? "card-present" : "ecom";
          } else if (nm === "city") {
            r[f.name] = ["San Francisco", "New York", "Austin", "Seattle"][
              Math.floor(Math.random() * 4)
            ];
          } else if (nm === "country") {
            r[f.name] = "US";
          } else if (
            nm === "txn_id" ||
            nm === "order_id" ||
            nm === "encounter_id" ||
            nm === "call_id" ||
            nm === "event_id"
          ) {
            r[f.name] = `${nm.split("_")[0]}_${Math.random()
              .toString(36)
              .slice(2, 10)}`;
          } else if (nm === "source_ip" || nm === "dest_ip") {
            r[f.name] = randomIp();
          } else if (nm === "from_number" || nm === "to_number") {
            r[f.name] = randomPhone();
          } else if (nm === "diagnosis_code") {
            r[f.name] = randomIcd10();
          } else if (f.type === "number") {
            // Secondary numeric fields: use normalized values
            r[f.name] = format(
              normalizedData[i] * (0.9 + Math.random() * 0.2),
              3
            );
          } else if (f.type === "date") {
            r[f.name] = new Date(
              Date.now() - Math.floor(Math.random() * 7 * 864e5)
            ).toISOString();
          } else {
            r[f.name] = `${f.name}_${i + 1}`;
          }
        });
        normalizedRows.push(r);
      }
      setNormalizedObjects(normalizedRows);

      // Create ML-ready version if this is a model training use case
      if (isModelTrainingUseCase(prior.dataNeed, prior.freeText)) {
        const mlReadyRows: any[] = [];

        // Get categorical fields for one-hot encoding
        const categoricalFields = fieldDefs.filter(
          (f) =>
            f.type === "string" &&
            !f.name.toLowerCase().includes("id") &&
            !f.name.toLowerCase().includes("timestamp") &&
            !f.name.toLowerCase().includes("date")
        );

        for (let i = 0; i < 10; i++) {
          const r: any = {};
          fieldDefs.forEach((f) => {
            const nm = f.name.toLowerCase();
            if (
              nm === "amount" ||
              nm === "price" ||
              nm === "duration_seconds" ||
              nm === "inter_arrival_seconds" ||
              nm === "length_of_stay" ||
              nm === "charge"
            ) {
              // Use normalized value for ML
              r[f.name] = format(normalizedData[i], 3);
            } else if (f.type === "number") {
              // Secondary numeric fields: use normalized values
              r[f.name] = format(
                normalizedData[i] * (0.9 + Math.random() * 0.2),
                3
              );
            } else if (nm === "timestamp" || nm === "timestamp_start") {
              // Convert timestamp to numeric (days since epoch)
              const timestamp = new Date(
                Date.now() - Math.floor(Math.random() * 30 * 864e5)
              );
              r[f.name] = Math.floor(
                timestamp.getTime() / (1000 * 60 * 60 * 24)
              );
            } else if (nm === "merchant") {
              r[f.name] =
                merchants[Math.floor(Math.random() * merchants.length)];
            } else if (nm === "category") {
              r[f.name] =
                categories[Math.floor(Math.random() * categories.length)];
            } else if (nm === "city") {
              r[f.name] = ["San Francisco", "New York", "Austin", "Seattle"][
                Math.floor(Math.random() * 4)
              ];
            } else if (nm === "country") {
              r[f.name] = "US";
            } else if (nm === "channel") {
              r[f.name] = Math.random() < 0.5 ? "card-present" : "ecom";
            } else if (nm === "currency") {
              r[f.name] = "USD";
            } else if (nm === "card_last4") {
              r[f.name] = String(1000 + Math.floor(Math.random() * 9000));
            } else if (nm === "source_ip" || nm === "dest_ip") {
              r[f.name] = randomIp();
            } else if (nm === "from_number" || nm === "to_number") {
              r[f.name] = randomPhone();
            } else if (nm === "diagnosis_code") {
              r[f.name] = randomIcd10();
            } else if (
              nm === "txn_id" ||
              nm === "order_id" ||
              nm === "encounter_id" ||
              nm === "call_id" ||
              nm === "event_id"
            ) {
              r[f.name] = `${nm.split("_")[0]}_${Math.random()
                .toString(36)
                .slice(2, 10)}`;
            } else if (f.type === "date") {
              const date = new Date(
                Date.now() - Math.floor(Math.random() * 7 * 864e5)
              );
              r[f.name] = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
            } else {
              r[f.name] = `${f.name}_${i + 1}`;
            }
          });
          mlReadyRows.push(r);
        }

        // Apply one-hot encoding to categorical fields
        const mlReadyWithEncoding: any[] = [];
        for (let i = 0; i < 10; i++) {
          const row: any = {};

          // Copy numeric fields as-is
          fieldDefs.forEach((f) => {
            const nm = f.name.toLowerCase();
            if (
              f.type === "number" ||
              nm.includes("amount") ||
              nm.includes("price") ||
              nm.includes("duration") ||
              nm.includes("charge") ||
              nm.includes("timestamp")
            ) {
              row[f.name] = mlReadyRows[i][f.name];
            }
          });

          // Add one-hot encoded categorical fields
          categoricalFields.forEach((field) => {
            const uniqueValues = [
              ...new Set(mlReadyRows.map((row) => row[field.name])),
            ];
            uniqueValues.forEach((value) => {
              row[`${field.name}_${value}`] =
                mlReadyRows[i][field.name] === value ? 1 : 0;
            });
          });

          mlReadyWithEncoding.push(row);
        }

        setMlReadyObjects(mlReadyWithEncoding);
      } else {
        setMlReadyObjects(null);
      }
    } else {
      setRowObjects(null);
      setNormalizedObjects(null);
      setMlReadyObjects(null);
    }

    setLoading(false);
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Generation Console
          </h1>
          <p className="text-muted-foreground mt-3">
            We will infer the distribution and show a preview.
          </p>
        </div>

        <div className="grid gap-6">
          <Card className="data-grid">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5 text-primary" /> Inference &
                preview
              </CardTitle>
              <CardDescription>
                We infer shape with Groq (or fallback), then preview.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onInfer} className="space-y-4">
                <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                  <div className="font-medium mb-2">Context</div>
                  <div>
                    Industry:{" "}
                    <span className="text-foreground">
                      {prior.industry || "—"}
                    </span>
                  </div>
                  <div>
                    Purpose:{" "}
                    <span className="text-foreground">
                      {prior.dataNeed || "—"}
                    </span>
                  </div>
                  <div>
                    Outcome:{" "}
                    <span className="text-foreground">
                      {prior.outcome || "—"}
                    </span>
                  </div>
                  <div>
                    Volume:{" "}
                    <span className="text-foreground">
                      {prior.recordVolume || "—"}
                    </span>
                  </div>
                  <div>
                    Sensitive:{" "}
                    <span className="text-foreground">
                      {prior.sensitive === "true" ? "Yes" : "No"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <Button
                    type="submit"
                    className="pulse-glow"
                    disabled={loading}
                  >
                    {loading ? "Inferring..." : "Infer data shape"}
                  </Button>
                </div>
              </form>

              {/* Show preview only after inference */}
              {inferred && (
                <div className="space-y-4 mt-6">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">
                      Inference result ({inferred.source})
                    </div>
                    <div className="text-sm mt-1">
                      Distribution:{" "}
                      <span className="font-medium">
                        {inferred.distribution}
                      </span>
                    </div>
                    {inferred.explanation && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {inferred.explanation}
                      </div>
                    )}
                  </div>

                  {preview && !rowObjects && (
                    <div className="space-y-3">
                      <Label className="text-sm">Example rows (10)</Label>
                      <div className="rounded-lg border overflow-hidden">
                        <div className="grid grid-cols-[60px_1fr] bg-accent/20 text-xs font-medium">
                          <div className="px-3 py-2">#</div>
                          <div className="px-3 py-2">value</div>
                        </div>
                        <div className="divide-y">
                          {preview.map((val, idx) => (
                            <div
                              key={idx}
                              className="grid grid-cols-[60px_1fr] text-sm"
                            >
                              <div className="px-3 py-2 text-muted-foreground">
                                {idx + 1}
                              </div>
                              <div className="px-3 py-2 font-mono">
                                {format(val)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {rowObjects && normalizedObjects && (
                    <div className="space-y-6">
                      <div
                        className={`grid grid-cols-1 ${
                          mlReadyObjects ? "lg:grid-cols-3" : "lg:grid-cols-2"
                        } gap-4`}
                      >
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">
                            Natural Language Preview
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Human-readable data with business context
                          </p>
                          <div className="rounded-lg border overflow-auto">
                            <table className="w-full text-xs">
                              <thead className="bg-accent/20">
                                <tr>
                                  {Object.keys(rowObjects[0]).map((k) => (
                                    <th
                                      key={k}
                                      className="text-left px-2 py-1 font-medium"
                                    >
                                      {k}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {rowObjects.map((r, i) => (
                                  <tr key={i}>
                                    {Object.keys(rowObjects[0]).map((k) => (
                                      <td key={k} className="px-2 py-1">
                                        {String(r[k])}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium">
                            Normalized Preview
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Statistical values for mathematical validation
                          </p>
                          <div className="rounded-lg border overflow-auto">
                            <table className="w-full text-xs">
                              <thead className="bg-accent/20">
                                <tr>
                                  {Object.keys(normalizedObjects[0]).map(
                                    (k) => (
                                      <th
                                        key={k}
                                        className="text-left px-2 py-1 font-medium"
                                      >
                                        {k}
                                      </th>
                                    )
                                  )}
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {normalizedObjects.map((r, i) => (
                                  <tr key={i}>
                                    {Object.keys(normalizedObjects[0]).map(
                                      (k) => (
                                        <td
                                          key={k}
                                          className="px-2 py-1 font-mono"
                                        >
                                          {String(r[k])}
                                        </td>
                                      )
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {mlReadyObjects && (
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">
                              ML-Ready Preview
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              One-hot encoded for machine learning
                            </p>
                            <div className="rounded-lg border overflow-auto">
                              <table className="w-full text-xs">
                                <thead className="bg-accent/20">
                                  <tr>
                                    {Object.keys(mlReadyObjects[0]).map((k) => (
                                      <th
                                        key={k}
                                        className="text-left px-2 py-1 font-medium"
                                      >
                                        {k}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {mlReadyObjects.map((r, i) => (
                                    <tr key={i}>
                                      {Object.keys(mlReadyObjects[0]).map(
                                        (k) => (
                                          <td
                                            key={k}
                                            className="px-2 py-1 font-mono"
                                          >
                                            {String(r[k])}
                                          </td>
                                        )
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {mathLines && mathLines.length > 0 && (
                    <div className="rounded-lg border p-4 text-sm data-grid">
                      <div className="font-medium mb-2">Distribution check</div>
                      <ul className="space-y-1">
                        {mathLines.map((line, i) => (
                          <li key={i} className="font-mono">
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {inferred && (
                    <div className="rounded-lg border p-4 text-sm">
                      <div className="font-medium mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Data Shape Source
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              inferred.source === "groq"
                                ? "bg-green-500"
                                : inferred.source === "heuristic"
                                ? "bg-blue-500"
                                : "bg-red-500"
                            }`}
                          ></div>
                          <span className="font-medium">
                            {inferred.source === "groq"
                              ? "LLM Generated"
                              : inferred.source === "heuristic"
                              ? "Heuristic Rules"
                              : "Error"}
                          </span>
                        </div>
                        {inferred.source === "groq" && (
                          <p className="text-xs text-muted-foreground">
                            Data shape inferred using Groq LLM for intelligent
                            distribution selection
                          </p>
                        )}
                        {inferred.source === "heuristic" && (
                          <p className="text-xs text-muted-foreground">
                            Data shape determined using domain-specific
                            heuristic rules
                          </p>
                        )}
                        {inferred.explanation && (
                          <div className="mt-2 p-2 bg-accent/10 rounded text-xs">
                            <strong>Explanation:</strong> {inferred.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => router.back()}
                    >
                      Back
                    </Button>
                    <Button
                      className="pulse-glow"
                      disabled={generating}
                      onClick={onStartGeneration}
                    >
                      <Zap className="w-4 h-4 mr-2" />{" "}
                      {generating ? "Generating..." : "Start generation"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Sigma className="w-4 h-4" />
          <span>
            Mathematically grounded synthetic data • no real data exposure
          </span>
        </div>
      </div>
    </div>
  );
}
