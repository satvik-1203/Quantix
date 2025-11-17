"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type RagTrace = {
  id: string;
  createdAt: string;
  kind: string;
  testCaseId?: number | null;
  subTestId?: number | null;
  metadata?: {
    model?: string;
    [key: string]: any;
  };
  input?: any;
  retrieval?: {
    engine?: string | null;
    queryText?: string;
    snippet?: string;
    [key: string]: any;
  };
  prompt?: {
    system?: string;
    user?: string;
    [key: string]: any;
  };
  output?: any;
  evalResult?: any;
};

export default function RagTracePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trace, setTrace] = useState<RagTrace | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const baseUrl =
          process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
        const resp = await fetch(`${baseUrl}/api/rag-trace/${params.id}`, {
          signal: controller.signal,
        });
        if (resp.status === 404) {
          setError("Trace not found.");
          setTrace(null);
          return;
        }
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(
            `Failed to load trace (${resp.status}): ${text.slice(0, 200)}`
          );
        }
        const json = (await resp.json()) as { trace: RagTrace };
        setTrace(json.trace);
      } catch (err) {
        if ((err as any)?.name === "AbortError") return;
        setError(
          (err as Error)?.message || "Failed to load RAG trace for inspection."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [params.id]);

  const prettyJson = (value: any) => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">RAG Trace</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            End-to-end view of retrieval, prompt, and model output for a single
            run. Use this to inspect exactly how the model was grounded.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            Back
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Loading RAG trace...
        </div>
      ) : error ? (
        <div className="text-sm text-red-500">{error}</div>
      ) : !trace ? (
        <div className="text-sm text-muted-foreground">
          No trace data available.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline">{trace.kind}</Badge>
            {trace.metadata?.model && (
              <Badge variant="outline">Model: {trace.metadata.model}</Badge>
            )}
            {typeof trace.testCaseId === "number" && (
              <Badge variant="outline">Test case #{trace.testCaseId}</Badge>
            )}
            {typeof trace.subTestId === "number" && (
              <Badge variant="outline">Sub-test #{trace.subTestId}</Badge>
            )}
            {trace.createdAt && (
              <span className="text-xs text-muted-foreground">
                Run at {new Date(trace.createdAt).toLocaleString()}
              </span>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4 space-y-3">
              <h2 className="text-sm font-semibold">Input & retrieval</h2>
              <div className="space-y-2 text-xs">
                <div className="space-y-1">
                  <div className="font-medium text-[11px] uppercase tracking-wide text-muted-foreground">
                    Input
                  </div>
                  <pre className="bg-muted rounded-md p-2 text-[11px] leading-relaxed max-h-64 overflow-auto">
                    {prettyJson(trace.input)}
                  </pre>
                </div>
                <div className="space-y-1">
                  <div className="font-medium text-[11px] uppercase tracking-wide text-muted-foreground">
                    Retrieval
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Engine:{" "}
                    {trace.retrieval?.engine ? trace.retrieval.engine : "none"}
                  </div>
                  {trace.retrieval?.queryText && (
                    <div className="mt-1">
                      <div className="text-[11px] text-muted-foreground mb-1">
                        Query text
                      </div>
                      <pre className="bg-muted rounded-md p-2 text-[11px] leading-relaxed max-h-40 overflow-auto whitespace-pre-wrap">
                        {trace.retrieval.queryText}
                      </pre>
                    </div>
                  )}
                  {trace.retrieval?.snippet && (
                    <div className="mt-1">
                      <div className="text-[11px] text-muted-foreground mb-1">
                        Retrieved examples (snippet sent to the model)
                      </div>
                      <pre className="bg-muted rounded-md p-2 text-[11px] leading-relaxed max-h-40 overflow-auto whitespace-pre-wrap">
                        {trace.retrieval.snippet}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-4 space-y-3">
              <h2 className="text-sm font-semibold">Prompt sent to model</h2>
              <div className="space-y-3 text-xs">
                {trace.prompt?.system && (
                  <div className="space-y-1">
                    <div className="font-medium text-[11px] uppercase tracking-wide text-muted-foreground">
                      System prompt
                    </div>
                    <pre className="bg-muted rounded-md p-2 text-[11px] leading-relaxed max-h-40 overflow-auto whitespace-pre-wrap">
                      {trace.prompt.system}
                    </pre>
                  </div>
                )}
                {trace.prompt?.user && (
                  <div className="space-y-1">
                    <div className="font-medium text-[11px] uppercase tracking-wide text-muted-foreground">
                      User prompt
                    </div>
                    <pre className="bg-muted rounded-md p-2 text-[11px] leading-relaxed max-h-40 overflow-auto whitespace-pre-wrap">
                      {trace.prompt.user}
                    </pre>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <Card className="p-4 space-y-3">
            <h2 className="text-sm font-semibold">Model output</h2>
            <pre className="bg-muted rounded-md p-2 text-[11px] leading-relaxed max-h-[28rem] overflow-auto">
              {prettyJson(trace.output)}
            </pre>
          </Card>
        </>
      )}
    </div>
  );
}
