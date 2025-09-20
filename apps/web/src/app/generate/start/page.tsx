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

export default function StartGenerationPage() {
  const params = useSearchParams();
  const router = useRouter();
  const prior = useMemo(() => Object.fromEntries(params.entries()), [params]);

  const [distribution, setDistribution] = useState<string>("");
  const [mean, setMean] = useState<string>("");
  const [stddev, setStddev] = useState<string>("");
  const [min, setMin] = useState<string>("");
  const [max, setMax] = useState<string>("");
  const [lambda, setLambda] = useState<string>("");

  function onStart(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Placeholder: would call API or navigate to preview next.
    router.push("/");
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

              {/* Conditional parameter inputs */}
              {distribution === "Gaussian (Normal)" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Mean (μ)</Label>
                    <Input
                      inputMode="decimal"
                      placeholder="e.g. 0"
                      value={mean}
                      onChange={(e) => setMean(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Std Dev (σ)</Label>
                    <Input
                      inputMode="decimal"
                      placeholder="e.g. 1"
                      value={stddev}
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
                      value={min}
                      onChange={(e) => setMin(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Max</Label>
                    <Input
                      inputMode="decimal"
                      placeholder="e.g. 1"
                      value={max}
                      onChange={(e) => setMax(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {distribution === "Poisson" && (
                <div className="space-y-2">
                  <Label className="text-sm">Lambda (λ)</Label>
                  <Input
                    inputMode="decimal"
                    placeholder="e.g. 3.5"
                    value={lambda}
                    onChange={(e) => setLambda(e.target.value)}
                  />
                </div>
              )}

              {distribution === "Exponential" && (
                <div className="space-y-2">
                  <Label className="text-sm">Lambda (λ)</Label>
                  <Input
                    inputMode="decimal"
                    placeholder="e.g. 1.2"
                    value={lambda}
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
                      value={mean}
                      onChange={(e) => setMean(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Log-std (σ)</Label>
                    <Input
                      inputMode="decimal"
                      placeholder="e.g. 1"
                      value={stddev}
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
                <LineChart className="w-5 h-5 text-primary" /> Preview & next
              </CardTitle>
              <CardDescription>
                We’ll soon render sample rows and charts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onStart} className="space-y-4">
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
                    type="button"
                    variant="ghost"
                    onClick={() => router.back()}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="pulse-glow">
                    <Zap className="w-4 h-4 mr-2" /> Start generation
                  </Button>
                </div>
              </form>
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
