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
  const [mathLines, setMathLines] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

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

  async function onInfer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setInferred(null);
    setPreview(null);
    setMathLines(null);
    setRowObjects(null);

    const resp = await fetch("/api/shape", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        industry: prior.industry,
        dataNeed: prior.dataNeed,
        outcome: prior.outcome,
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

    // Compute math summary on primary samples ONLY
    if (d === "Gaussian (Normal)") {
      const m = Number(p.mean ?? 0);
      const s = Math.max(Number(p.stddev ?? 1), 1e-6);
      setMathLines([
        `E[X] = μ = ${format(m)} • sample mean = ${format(mean(out))}`,
        `Var[X] = σ² = ${format(s * s)} • sample σ ≈ ${format(stddev(out))}`,
      ]);
    } else if (d === "Uniform") {
      const a = Number(p.min ?? 0);
      const b = Number(p.max ?? 1);
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      const theoMean = (lo + hi) / 2;
      const theoVar = (hi - lo) ** 2 / 12;
      setMathLines([
        `E[X] = (a+b)/2 = ${format(theoMean)} • sample mean = ${format(
          mean(out)
        )}`,
        `Var[X] = (b−a)²/12 = ${format(theoVar)} • range ≈ [${format(
          Math.min(...out)
        )}, ${format(Math.max(...out))}]`,
      ]);
    } else if (d === "Poisson") {
      const l = Math.max(Number(p.lambda ?? 1), 1e-6);
      setMathLines([
        `E[X] = Var[X] = λ = ${format(l)} • sample mean = ${format(mean(out))}`,
      ]);
    } else if (d === "Exponential") {
      const l = Math.max(Number(p.lambda ?? 1), 1e-6);
      setMathLines([
        `E[X] = 1/λ = ${format(1 / l)} • sample mean = ${format(mean(out))}`,
      ]);
    } else if (d === "Log-normal") {
      const mu = Number(p.mean ?? 0);
      const sg = Math.max(Number(p.stddev ?? 1), 1e-6);
      const logVals = out.filter((x) => x > 0).map((x) => Math.log(x));
      const lm = mean(logVals);
      const ls = stddev(logVals);
      setMathLines([
        `log-mean (μ) = ${format(mu)} • sample log-mean = ${format(lm)}`,
        `log-std (σ) = ${format(sg)} • sample log-std = ${format(ls)}`,
      ]);
    }

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
    } else {
      setRowObjects(null);
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

                  {rowObjects && (
                    <div className="space-y-3">
                      <Label className="text-sm">Example rows (10)</Label>
                      <div className="rounded-lg border overflow-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-accent/20">
                            <tr>
                              {Object.keys(rowObjects[0]).map((k) => (
                                <th
                                  key={k}
                                  className="text-left px-3 py-2 font-medium"
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
                                  <td key={k} className="px-3 py-2 font-mono">
                                    {String(r[k])}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
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

                  <div className="flex items-center justify-end gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => router.back()}
                    >
                      Back
                    </Button>
                    <Button className="pulse-glow">
                      <Zap className="w-4 h-4 mr-2" /> Start generation
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
