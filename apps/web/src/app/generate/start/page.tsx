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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Atom, LineChart, Sigma, Zap } from "lucide-react";

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

  const [distribution, setDistribution] = useState<string>("");
  const [meanStr, setMean] = useState<string>("");
  const [stddevStr, setStddev] = useState<string>("");
  const [minStr, setMin] = useState<string>("");
  const [maxStr, setMax] = useState<string>("");
  const [lambdaStr, setLambda] = useState<string>("");

  const [inferred, setInferred] = useState<null | {
    distribution: string;
    params: any;
    source: string;
    explanation?: string;
  }>(null);
  const [preview, setPreview] = useState<number[] | null>(null);
  const [mathLines, setMathLines] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function onInfer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setInferred(null);
    setPreview(null);
    setMathLines(null);

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

    const d = data.distribution as string;
    const p = data.params || {};

    // Generate 10 samples only AFTER inference
    const out: number[] = [];
    if (d === "Gaussian (Normal)") {
      const m = Number(p.mean ?? 0);
      const s = Math.max(Number(p.stddev ?? 1), 1e-6);
      for (let i = 0; i < 10; i++) out.push(sampleNormal(m, s));
      setMathLines([
        `E[X] = μ = ${format(m)} • sample mean = ${format(mean(out))}`,
        `Var[X] = σ² = ${format(s * s)} • sample σ ≈ ${format(stddev(out))}`,
      ]);
    } else if (d === "Uniform") {
      const a = Number(p.min ?? 0);
      const b = Number(p.max ?? 1);
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      for (let i = 0; i < 10; i++) out.push(sampleUniform(lo, hi));
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
      for (let i = 0; i < 10; i++) out.push(samplePoisson(l));
      setMathLines([
        `E[X] = Var[X] = λ = ${format(l)} • sample mean = ${format(mean(out))}`,
      ]);
    } else if (d === "Exponential") {
      const l = Math.max(Number(p.lambda ?? 1), 1e-6);
      for (let i = 0; i < 10; i++) out.push(sampleExponential(l));
      setMathLines([
        `E[X] = 1/λ = ${format(1 / l)} • sample mean = ${format(mean(out))}`,
      ]);
    } else if (d === "Log-normal") {
      const mu = Number(p.mean ?? 0);
      const sg = Math.max(Number(p.stddev ?? 1), 1e-6);
      for (let i = 0; i < 10; i++) out.push(sampleLogNormal(mu, sg));
      const logVals = out.filter((x) => x > 0).map((x) => Math.log(x));
      const lm = mean(logVals);
      const ls = stddev(logVals);
      setMathLines([
        `log-mean (μ) = ${format(mu)} • sample log-mean = ${format(lm)}`,
        `log-std (σ) = ${format(sg)} • sample log-std = ${format(ls)}`,
      ]);
    }

    setPreview(out);
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
            Configure distributions and parameters. Your previous inputs are
            carried over.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="data-grid">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Atom className="w-5 h-5 text-primary" /> Distribution
              </CardTitle>
              <CardDescription>
                Select the base distribution for your synthetic variable(s).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label className="text-sm">Choose distribution</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-between ${
                      distribution === "Custom mixture"
                        ? "pulse-glow border-accent"
                        : ""
                    }`}
                  >
                    {distribution || "Select distribution"}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  {DISTRIBUTIONS.map((d) => (
                    <DropdownMenuItem
                      key={d}
                      onSelect={() => setDistribution(d)}
                    >
                      {d}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Parameter inputs (optional overrides) */}
              {distribution === "Gaussian (Normal)" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Mean (μ)</Label>
                    <Input
                      inputMode="decimal"
                      placeholder="e.g. 0"
                      value={meanStr}
                      onChange={(e) => setMean(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Std Dev (σ)</Label>
                    <Input
                      inputMode="decimal"
                      placeholder="e.g. 1"
                      value={stddevStr}
                      onChange={(e) => setStddev(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {distribution === "Uniform" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Min</Label>
                    <Input
                      inputMode="decimal"
                      placeholder="e.g. 0"
                      value={minStr}
                      onChange={(e) => setMin(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Max</Label>
                    <Input
                      inputMode="decimal"
                      placeholder="e.g. 1"
                      value={maxStr}
                      onChange={(e) => setMax(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {(distribution === "Poisson" ||
                distribution === "Exponential") && (
                <div className="space-y-2">
                  <Label className="text-sm">Lambda (λ)</Label>
                  <Input
                    inputMode="decimal"
                    placeholder="e.g. 1.2"
                    value={lambdaStr}
                    onChange={(e) => setLambda(e.target.value)}
                  />
                </div>
              )}

              {distribution === "Log-normal" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Log-mean (μ)</Label>
                    <Input
                      inputMode="decimal"
                      placeholder="e.g. 0"
                      value={meanStr}
                      onChange={(e) => setMean(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Log-std (σ)</Label>
                    <Input
                      inputMode="decimal"
                      placeholder="e.g. 1"
                      value={stddevStr}
                      onChange={(e) => setStddev(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {distribution === "Custom mixture" && (
                <div className="space-y-2">
                  <Label className="text-sm">Describe your mixture</Label>
                  <Input placeholder="e.g. 70% Normal(0,1) + 30% Exponential(1.2)" />
                </div>
              )}
            </CardContent>
          </Card>

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

                  {preview && (
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
