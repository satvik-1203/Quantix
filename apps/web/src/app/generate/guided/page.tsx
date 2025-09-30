"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Briefcase,
  Target,
  HelpCircle,
  Database,
  Sparkles,
} from "lucide-react";

const INDUSTRIES = [
  "Healthcare",
  "Finance",
  "E-commerce",
  "Manufacturing",
  "Telecommunications",
  "Education",
  "Transportation",
  "Energy",
  "Public Sector",
  "Other",
] as const;

const DATA_NEEDS = [
  "Model training",
  "Model Finetuning",
  "Research/Experimentation",
] as const;

export default function GuidedGeneratorPage() {
  const router = useRouter();
  const [industry, setIndustry] = useState<string>("");
  const [dataNeed, setDataNeed] = useState<string>("");
  const [recordVolume, setRecordVolume] = useState<string>("");
  const [sensitive, setSensitive] = useState<boolean>(false);
  const [freeText, setFreeText] = useState<string>("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams({
      industry,
      dataNeed,
      recordVolume,
      sensitive: String(sensitive),
      freeText,
    });
    router.push(`/generate/guided/summary?${params.toString()}`);
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Guided setup</CardTitle>
            <CardDescription>
              Answer a few questions so we can propose a schema and sample
              output.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              {/* Industry */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4" /> Industry
                </Label>
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        {industry || "Select industry"}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full">
                      {INDUSTRIES.map((item) => (
                        <DropdownMenuItem
                          key={item}
                          onSelect={() => setIndustry(item)}
                        >
                          {item}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Data need */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4" /> What is the data needed for?
                </Label>
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        {dataNeed || "Select purpose"}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full">
                      {DATA_NEEDS.map((item) => (
                        <DropdownMenuItem
                          key={item}
                          onSelect={() => setDataNeed(item)}
                        >
                          {item}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Volume */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Database className="w-4 h-4" /> Approximate record volume
                </Label>
                <Input
                  inputMode="numeric"
                  placeholder="e.g. 100k, 1M"
                  value={recordVolume}
                  onChange={(e) => setRecordVolume(e.target.value)}
                />
              </div>

              {/* Sensitive data */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <HelpCircle className="w-4 h-4" /> Contains sensitive
                  attributes?
                </Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sensitive"
                    checked={sensitive}
                    onCheckedChange={(v) => setSensitive(Boolean(v))}
                  />
                  <label
                    htmlFor="sensitive"
                    className="text-sm text-muted-foreground"
                  >
                    Yes, consider PP/DP constraints
                  </label>
                </div>
              </div>

              {/* Free text */}
              <div className="space-y-2">
                <Label className="text-sm">Anything else we should know?</Label>
                <Input
                  placeholder="Domain specifics, mandatory fields, correlations, etc."
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/")}
                >
                  Cancel
                </Button>
                <Button type="submit">Continue</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
