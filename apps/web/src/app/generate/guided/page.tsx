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
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 overflow-y-auto">
      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-4 sm:mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Guided setup
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  AI-Powered configuration
                </p>
              </div>
            </div>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
              Answer a few questions so we can infer an optimal schema and
              generate a high-quality preview.
            </p>
          </div>

          <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base sm:text-lg">
                    Project context
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Provide details to tailor the dataset to your scenario
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 lg:px-5">
              <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
                {/* Industry */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Briefcase className="w-4 h-4 flex-shrink-0" /> Industry
                  </Label>
                  <div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between h-8 text-sm"
                        >
                          <span className="truncate">
                            {industry || "Select industry"}
                          </span>
                          <ChevronDown className="w-4 h-4 flex-shrink-0" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-full min-w-[200px]">
                        {INDUSTRIES.map((item) => (
                          <DropdownMenuItem
                            key={item}
                            onSelect={() => setIndustry(item)}
                            className="cursor-pointer text-sm"
                          >
                            {item}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Data need */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Target className="w-4 h-4 flex-shrink-0" /> What is the
                    data needed for?
                  </Label>
                  <div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between h-8 text-sm"
                        >
                          <span className="truncate">
                            {dataNeed || "Select purpose"}
                          </span>
                          <ChevronDown className="w-4 h-4 flex-shrink-0" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-full min-w-[200px]">
                        {DATA_NEEDS.map((item) => (
                          <DropdownMenuItem
                            key={item}
                            onSelect={() => setDataNeed(item)}
                            className="cursor-pointer text-sm"
                          >
                            {item}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Volume */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Database className="w-4 h-4 flex-shrink-0" /> Approximate
                    record volume
                  </Label>
                  <Input
                    inputMode="numeric"
                    placeholder="e.g. 100k, 1M"
                    value={recordVolume}
                    onChange={(e) => setRecordVolume(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>

                {/* Sensitive data */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <HelpCircle className="w-4 h-4 flex-shrink-0" /> Contains
                    sensitive attributes?
                  </Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="sensitive"
                      checked={sensitive}
                      onCheckedChange={(v) => setSensitive(Boolean(v))}
                      className="flex-shrink-0"
                    />
                    <label
                      htmlFor="sensitive"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Yes, consider PP/DP constraints
                    </label>
                  </div>
                </div>

                {/* Free text */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    Tell us a bit more about your scenario
                  </Label>
                  <Textarea
                    placeholder="Domain specifics, mandatory fields, correlations, etc."
                    value={freeText}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFreeText(e.target.value)
                    }
                    className="min-h-[70px] resize-y text-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.push("/")}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 order-2 sm:order-1 h-8 text-sm"
                  >
                    ← Back
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 order-1 sm:order-2 w-full sm:w-auto h-8 text-sm"
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
