import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type SummaryItem = {
  subTestId: number;
  subTestName: string | null;
  testCaseId: number | null;
  testCaseName: string | null;
  model: string;
  runs: number;
  avgComposite: number | null;
  avgSemantic: number | null;
  successRate: number | null;
  lastTimestamp: string | null;
};

type LabelSummaryItem = {
  subTestId: number;
  subTestName: string | null;
  testCaseId: number | null;
  testCaseName: string | null;
  model: string;
  labeledRuns: number;
  correct: number;
  incorrect: number;
  judgeAgreementRate: number | null;
};

async function fetchSummary(): Promise<SummaryItem[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/llm-dialog/summary`, {
    // This is a server component; forcing cache to no-store keeps it fresh.
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Failed to load analytics summary:", await res.text());
    return [];
  }

  const data = (await res.json()) as { items?: SummaryItem[] };
  return data.items ?? [];
}

async function fetchLabelSummary(): Promise<LabelSummaryItem[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/llm-dialog/labels/summary`, {
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Failed to load label summary:", await res.text());
    return [];
  }

  const data = (await res.json()) as { items?: LabelSummaryItem[] };
  return data.items ?? [];
}

export default async function AnalyticsPage() {
  const [items, labelItems] = await Promise.all([
    fetchSummary(),
    fetchLabelSummary(),
  ]);

  const totalRuns = items.reduce((sum, i) => sum + i.runs, 0);
  const models = Array.from(new Set(items.map((i) => i.model))).sort();

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
              Model Analytics
            </h1>
            <p className="text-muted-foreground mt-2">
              Aggregate performance of models across all sub-tests.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="secondary" className="h-7 px-3 text-sm">
              {totalRuns} runs
            </Badge>
            {models.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-end">
                {models.map((m) => (
                  <Badge
                    key={m}
                    variant="outline"
                    className="text-[11px] px-2 py-0.5"
                  >
                    {m}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <Button asChild variant="outline" size="sm">
            <Link href="/generate/test-case/list">Back to Test Cases</Link>
          </Button>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                No analytics data available yet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Run some sub-tests with different models to populate analytics.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Per Sub-Test &amp; Model Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold text-xs">
                      Test Case
                    </th>
                    <th className="px-2 py-2 text-left font-semibold text-xs">
                      Sub-Test
                    </th>
                    <th className="px-2 py-2 text-left font-semibold text-xs">
                      Model
                    </th>
                    <th className="px-2 py-2 text-right font-semibold text-xs">
                      Runs
                    </th>
                    <th className="px-2 py-2 text-right font-semibold text-xs">
                      Avg Composite
                    </th>
                    <th className="px-2 py-2 text-right font-semibold text-xs">
                      Avg Semantic
                    </th>
                    <th className="px-2 py-2 text-right font-semibold text-xs">
                      Success Rate
                    </th>
                    <th className="px-2 py-2 text-left font-semibold text-xs">
                      Last Run
                    </th>
                    <th className="px-2 py-2 text-left font-semibold text-xs">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items
                    .sort((a, b) => {
                      if (a.testCaseId !== b.testCaseId) {
                        return (a.testCaseId ?? 0) - (b.testCaseId ?? 0);
                      }
                      if (a.subTestId !== b.subTestId) {
                        return a.subTestId - b.subTestId;
                      }
                      return a.model.localeCompare(b.model);
                    })
                    .map((item) => (
                      <tr
                        key={`${item.subTestId}-${item.model}`}
                        className="border-t border-border/60"
                      >
                        <td className="px-2 py-1 align-top text-xs">
                          {item.testCaseName ?? `Test Case #${item.testCaseId}`}
                        </td>
                        <td className="px-2 py-1 align-top text-xs">
                          {item.subTestName ?? `Sub-Test #${item.subTestId}`}
                        </td>
                        <td className="px-2 py-1 align-top text-xs">
                          <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
                            {item.model}
                          </code>
                        </td>
                        <td className="px-2 py-1 align-top text-right text-xs">
                          {item.runs}
                        </td>
                        <td className="px-2 py-1 align-top text-right text-xs">
                          {item.avgComposite !== null &&
                          typeof item.avgComposite === "number"
                            ? `${(item.avgComposite * 100).toFixed(1)}%`
                            : "—"}
                        </td>
                        <td className="px-2 py-1 align-top text-right text-xs">
                          {item.avgSemantic !== null &&
                          typeof item.avgSemantic === "number"
                            ? `${(item.avgSemantic * 100).toFixed(1)}%`
                            : "—"}
                        </td>
                        <td className="px-2 py-1 align-top text-right text-xs">
                          {item.successRate !== null &&
                          typeof item.successRate === "number"
                            ? `${(item.successRate * 100).toFixed(1)}%`
                            : "—"}
                        </td>
                        <td className="px-2 py-1 align-top text-xs">
                          {item.lastTimestamp
                            ? new Date(item.lastTimestamp).toLocaleString()
                            : "—"}
                        </td>
                        <td className="px-2 py-1 align-top text-xs">
                          {item.testCaseId ? (
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-[11px]"
                            >
                              <Link
                                href={`/generate/test-case/${item.testCaseId}/sub-tests`}
                              >
                                View Sub-Tests
                              </Link>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Human Label Analytics</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto space-y-2">
            {labelItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No human labels recorded yet. Use the &quot;Human Label&quot;
                section in the Test Model dialog to add correctness labels, and
                they will appear here.
              </p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold text-xs">
                      Test Case
                    </th>
                    <th className="px-2 py-2 text-left font-semibold text-xs">
                      Sub-Test
                    </th>
                    <th className="px-2 py-2 text-left font-semibold text-xs">
                      Model
                    </th>
                    <th className="px-2 py-2 text-right font-semibold text-xs">
                      Labeled
                    </th>
                    <th className="px-2 py-2 text-right font-semibold text-xs">
                      Correct
                    </th>
                    <th className="px-2 py-2 text-right font-semibold text-xs">
                      Incorrect
                    </th>
                    <th className="px-2 py-2 text-right font-semibold text-xs">
                      Judge Agree
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {labelItems
                    .sort((a, b) => {
                      if (a.testCaseId !== b.testCaseId) {
                        return (a.testCaseId ?? 0) - (b.testCaseId ?? 0);
                      }
                      if (a.subTestId !== b.subTestId) {
                        return a.subTestId - b.subTestId;
                      }
                      return a.model.localeCompare(b.model);
                    })
                    .map((item) => (
                      <tr
                        key={`${item.subTestId}-${item.model}`}
                        className="border-t border-border/60"
                      >
                        <td className="px-2 py-1 align-top text-xs">
                          {item.testCaseName ?? `Test Case #${item.testCaseId}`}
                        </td>
                        <td className="px-2 py-1 align-top text-xs">
                          {item.subTestName ?? `Sub-Test #${item.subTestId}`}
                        </td>
                        <td className="px-2 py-1 align-top text-xs">
                          <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
                            {item.model}
                          </code>
                        </td>
                        <td className="px-2 py-1 align-top text-right text-xs">
                          {item.labeledRuns}
                        </td>
                        <td className="px-2 py-1 align-top text-right text-xs">
                          {item.correct}
                        </td>
                        <td className="px-2 py-1 align-top text-right text-xs">
                          {item.incorrect}
                        </td>
                        <td className="px-2 py-1 align-top text-right text-xs">
                          {item.judgeAgreementRate !== null &&
                          typeof item.judgeAgreementRate === "number"
                            ? `${(item.judgeAgreementRate * 100).toFixed(1)}%`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
