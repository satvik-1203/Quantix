"use client";

import { useSearchParams, useRouter } from "next/navigation";
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
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Proposed plan</CardTitle>
            <CardDescription>
              Review your inputs before proceeding.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Industry</div>
                <div className="font-medium">{industry}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Purpose</div>
                <div className="font-medium">{dataNeed}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Record volume</div>
                <div className="font-medium">{recordVolume}</div>
              </div>
              <div>
                <div className="text-muted-foreground">
                  Sensitive attributes
                </div>
                <div className="font-medium">{sensitive}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-muted-foreground">Notes</div>
                <div className="font-medium whitespace-pre-wrap">
                  {freeText}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => router.back()}>
                Back
              </Button>
              <Button onClick={() => router.push(nextHref)}>Proceed</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
