"use client";

import { useSearchParams, useRouter } from "next/navigation";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function GuidedSummaryPage() {
  const params = useSearchParams();
  const router = useRouter();
  const industry = params.get("industry") || "—";
  const dataNeed = params.get("dataNeed") || "—";
  const recordVolume = params.get("recordVolume") || "—";
  const sensitive = params.get("sensitive") === "true" ? "Yes" : "No";
  const freeText = params.get("freeText") || "—";

  const nextHref = `/generate/start?${params.toString()}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-8 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Review Configuration
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
              Review your inputs before proceeding to generate your dataset.
            </p>
          </div>

          <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">
                Proposed plan
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Review your inputs before proceeding.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm">
                <div className="space-y-1">
                  <div className="text-muted-foreground text-xs uppercase tracking-wide">
                    Industry
                  </div>
                  <div className="font-medium text-base">{industry}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground text-xs uppercase tracking-wide">
                    Purpose
                  </div>
                  <div className="font-medium text-base">{dataNeed}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground text-xs uppercase tracking-wide">
                    Record volume
                  </div>
                  <div className="font-medium text-base">{recordVolume}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground text-xs uppercase tracking-wide">
                    Sensitive attributes
                  </div>
                  <div className="font-medium text-base">{sensitive}</div>
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <div className="text-muted-foreground text-xs uppercase tracking-wide">
                    Notes
                  </div>
                  <div className="font-medium text-base whitespace-pre-wrap break-words">
                    {freeText}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  className="order-2 sm:order-1"
                >
                  ← Back
                </Button>
                <Button
                  onClick={() => router.push(nextHref as Route)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 order-1 sm:order-2 w-full sm:w-auto"
                >
                  Proceed
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
