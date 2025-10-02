"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  "Model finetuning",
  "Research/experimentation",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Guided setup
                </h1>
                <p className="text-sm text-muted-foreground">
                  AI-Powered configuration
                </p>
              </div>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Answer a few questions so we can infer an optimal schema and
              generate a high-quality preview.
            </p>
          </div>

          <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Project context</CardTitle>
                  <CardDescription className="text-base">
                    Provide details to tailor the dataset to your scenario
                  </CardDescription>
                </div>
              </div>
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
                  <Label className="text-sm">
                    Tell us a bit more about your scenario
                  </Label>
                  <Textarea
                    placeholder="Domain specifics, mandatory fields, correlations, etc."
                    value={freeText}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFreeText(e.target.value)
                    }
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.push("/")}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    ← Back
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Continue
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
