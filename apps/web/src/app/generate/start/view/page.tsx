"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = (text || "").split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
  const split = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') {
          quoted = false;
        } else {
          cur += ch;
        }
      } else {
        if (ch === ",") {
          out.push(cur);
          cur = "";
        } else if (ch === '"') {
          quoted = true;
        } else {
          cur += ch;
        }
      }
    }
    out.push(cur);
    return out;
  };
  const headers = split(lines[0]);
  const rows = lines.slice(1).map(split);
  return { headers, rows };
}

export default function GeneratedDataViewPage() {
  const router = useRouter();
  const [csv, setCsv] = useState<string>("");
  const [filename, setFilename] = useState<string>("synthetic-data.csv");

  useEffect(() => {
    try {
      const t = sessionStorage.getItem("generatedCsv") || "";
      const f =
        sessionStorage.getItem("generatedFilename") || "synthetic-data.csv";
      setCsv(t);
      setFilename(f);
    } catch {}
  }, []);

  const parsed = useMemo(() => parseCsv(csv), [csv]);
  const [judge, setJudge] = useState<null | {
    scores: {
      overall: number;
      realism: number;
      us_constraints: number;
      schema_consistency: number;
      anomalies: number;
    };
    findings: string[];
    recommendations: string[];
  }>(null);
  const [judging, setJudging] = useState(false);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Generated data</h1>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => router.back()}>
              Back
            </Button>
            <Button
              disabled={!csv || judging}
              onClick={async () => {
                if (!csv) return;
                setJudging(true);
                try {
                  const resp = await fetch("/api/judge", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ csv }),
                  });
                  const data = await resp.json();
                  if (!resp.ok || !data || !data.scores) {
                    toast.error("Judge failed", {
                      description: data?.error || "Unknown error",
                    });
                  } else {
                    setJudge(data);
                    toast.success("Judge complete", {
                      description: `Overall: ${Math.round(
                        data.scores.overall * 100
                      )}%`,
                    });
                  }
                } catch (e: any) {
                  toast.error("Judge error", {
                    description: e?.message || String(e),
                  });
                } finally {
                  setJudging(false);
                }
              }}
            >
              {judging ? "Judging..." : "Run judge"}
            </Button>
            <Button
              onClick={() => {
                const blob = new Blob([csv], {
                  type: "text/csv;charset=utf-8",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
            >
              Download CSV
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{filename}</CardTitle>
          </CardHeader>
          <CardContent>
            {judge && (
              <div className="mb-4 text-sm">
                <div className="font-medium mb-1">Judge scorecard</div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
                  <div>Overall: {Math.round(judge.scores.overall * 100)}%</div>
                  <div>Realism: {Math.round(judge.scores.realism * 100)}%</div>
                  <div>
                    US: {Math.round(judge.scores.us_constraints * 100)}%
                  </div>
                  <div>
                    Schema: {Math.round(judge.scores.schema_consistency * 100)}%
                  </div>
                  <div>
                    Anomalies: {Math.round(judge.scores.anomalies * 100)}%
                  </div>
                </div>
                {judge.findings?.length > 0 && (
                  <ul className="list-disc ml-5 mb-2">
                    {judge.findings.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                )}
                {judge.recommendations?.length > 0 && (
                  <div>
                    <div className="font-medium">Recommendations</div>
                    <ul className="list-disc ml-5">
                      {judge.recommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {csv && parsed.headers.length > 0 ? (
              <div className="rounded-lg border overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-accent/20">
                    <tr>
                      {parsed.headers.map((h, i) => (
                        <th key={i} className="text-left px-2 py-2 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parsed.rows.map((r, i) => (
                      <tr key={i}>
                        {parsed.headers.map((_, j) => (
                          <td key={j} className="px-2 py-2">
                            {r[j] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No data found in this session. Generate again to preview here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
