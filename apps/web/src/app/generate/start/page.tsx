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

        <div className="grid gap-8">
          {/* Enhanced Inference Card */}
          <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <LineChart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">AI Data Inference</CardTitle>
                  <CardDescription className="text-base">
                    Let AI analyze your requirements and infer the optimal data
                    structure
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={onInfer} className="space-y-6">
                {/* Enhanced Context Display */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                      Project Context
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                        Industry
                      </label>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {prior.industry || "Not specified"}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                        Purpose
                      </label>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {prior.dataNeed || "Not specified"}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                        Volume
                      </label>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {prior.recordVolume || "Not specified"}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                        Outcome
                      </label>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {prior.outcome || "Not specified"}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                        Sensitive Data
                      </label>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            prior.sensitive === "true"
                              ? "bg-red-500"
                              : "bg-green-500"
                          }`}
                        ></div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {prior.sensitive === "true" ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>

                    {prior.freeText && (
                      <div className="space-y-1 md:col-span-2 lg:col-span-3">
                        <label className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                          Additional Notes
                        </label>
                        <div className="text-sm text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg border">
                          {prior.freeText}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Action Button */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>Ready to infer data structure</span>
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Analyzing requirements...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <LineChart className="w-4 h-4" />
                        <span>Infer Data Shape</span>
                      </div>
                    )}
                  </Button>
                </div>
              </form>

              {/* Enhanced Preview Section */}
              {inferred && (
                <div className="mt-8 space-y-6">
                  {/* Inference Results Card */}
                  <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                          <div>
                            <CardTitle className="text-lg text-green-900 dark:text-green-100">
                              Inference Complete
                            </CardTitle>
                            <CardDescription className="text-green-700 dark:text-green-300">
                              AI has analyzed your requirements and determined
                              the optimal data structure
                            </CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">
                            {inferred.source}
                          </div>
                          <div className="text-sm text-green-800 dark:text-green-200 font-semibold">
                            {inferred.distribution}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    {inferred.fields && inferred.fields.length > 0 && (
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
                              Detected Fields ({inferred.fields.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {inferred.fields.map((field, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 px-3 py-2 rounded-lg border border-green-200 dark:border-green-700"
                                >
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {field.name}
                                  </span>
                                  <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                                    {field.type}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {inferred.explanation && (
                            <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg border border-green-200 dark:border-green-700">
                              <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
                                AI Analysis
                              </h4>
                              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                {inferred.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* Enhanced Numeric Preview */}
                  {preview && !rowObjects && (
                    <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <LineChart className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          </div>
                          Sample Values Preview
                        </CardTitle>
                        <CardDescription>
                          Generated sample values based on the inferred
                          distribution
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                          {preview.slice(0, 10).map((val, idx) => (
                            <div
                              key={idx}
                              className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center hover:shadow-md transition-shadow"
                            >
                              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                                #{idx + 1}
                              </div>
                              <div className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
                                {format(val)}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 text-center">
                          <span className="text-xs text-muted-foreground">
                            Showing 10 sample values from the{" "}
                            {inferred.distribution} distribution
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Enhanced Data Preview */}
                  {rowObjects && rowObjects.length > 0 && (
                    <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <LineChart className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          </div>
                          Data Preview
                        </CardTitle>
                        <CardDescription>
                          Sample rows showing the structure and content of your
                          generated data
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
                                <tr>
                                  {Object.keys(rowObjects[0]).map(
                                    (field, idx) => (
                                      <th
                                        key={field}
                                        className="text-left px-6 py-4 font-semibold text-gray-900 dark:text-gray-100 text-sm"
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                          {field}
                                        </div>
                                      </th>
                                    )
                                  )}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {rowObjects.slice(0, 5).map((row, rowIdx) => (
                                  <tr
                                    key={rowIdx}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                  >
                                    {Object.keys(rowObjects[0]).map(
                                      (field, fieldIdx) => (
                                        <td
                                          key={field}
                                          className="px-6 py-4 text-sm"
                                        >
                                          <div className="max-w-xs">
                                            <div
                                              className="text-gray-900 dark:text-gray-100 font-medium truncate"
                                              title={String(row[field])}
                                            >
                                              {String(row[field])}
                                            </div>
                                          </div>
                                        </td>
                                      )
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {rowObjects.length > 5 && (
                            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                                <span>
                                  Showing 5 of {rowObjects.length} sample rows
                                </span>
                                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                  {inferred.distribution}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Enhanced Generation Controls */}
                  <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                          <Zap className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        Ready to Generate
                      </CardTitle>
                      <CardDescription>
                        Your data structure has been analyzed. Generate your
                        synthetic dataset now.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-white/60 dark:bg-gray-800/60 p-4 rounded-lg border border-indigo-200 dark:border-indigo-700">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                {inferred.fields?.length || 0}
                              </div>
                              <div className="text-gray-600 dark:text-gray-400">
                                Fields
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                {prior.recordVolume || "100"}
                              </div>
                              <div className="text-gray-600 dark:text-gray-400">
                                Records
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                {inferred.source}
                              </div>
                              <div className="text-gray-600 dark:text-gray-400">
                                AI Source
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-indigo-200 dark:border-indigo-700">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => router.back()}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                          >
                            ← Back to Setup
                          </Button>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-indigo-700 dark:text-indigo-300">
                              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                              <span>
                                Ready to generate {prior.recordVolume || "100"}{" "}
                                records
                              </span>
                            </div>
                            <Button
                              onClick={onStartGeneration}
                              disabled={generating}
                              size="lg"
                              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                            >
                              {generating ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                  <span>Generating Dataset...</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Zap className="w-4 h-4" />
                                  <span>Start Generation</span>
                                </div>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
