"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

type ThreadListItem = {
  threadId: string;
  subject: string;
  firstFrom: string;
  numMessages: number;
  summarySnippet: string;
};

type ThreadListResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: ThreadListItem[];
};

type ThreadMetrics = {
  threadId: string;
  subjectFirst?: string;
  numMessages: number;
  participants: number;
  firstSenderDomain?: string | null;
  firstTimestamp?: string | null;
  lastTimestamp?: string | null;
  firstResponseMinutes?: number | null;
  avgResponseMinutes?: number | null;
  summaryLength?: number | null;
};

type EmailMessage = {
  messageId?: string;
  threadId?: string;
  from?: string;
  to?: string[];
  subject?: string;
  body?: string;
  timestamp?: string;
};

type EmailThreadDetail = {
  threadId: string;
  messages: EmailMessage[];
  summary?: string | null;
};

const PAGE_SIZE = 20;

export default function EmailDatasetPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialPage = Number(searchParams.get("page") || "1");
  const initialQuery = searchParams.get("q") || "";
  const initialMinMessages = searchParams.get("minMessages");
  const initialMaxMessages = searchParams.get("maxMessages");
  const initialStartDate = searchParams.get("startDate") || "";
  const initialEndDate = searchParams.get("endDate") || "";
  const initialDomain = searchParams.get("domain") || "";
  const initialHasSummary =
    searchParams.get("hasSummary") === "1" ||
    searchParams.get("hasSummary") === "true";

  const [page, setPage] = useState(initialPage);
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ThreadListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] =
    useState<EmailThreadDetail | null>(null);
  const [minMessages, setMinMessages] = useState<string>(
    initialMinMessages || ""
  );
  const [maxMessages, setMaxMessages] = useState<string>(
    initialMaxMessages || ""
  );
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [domainFilter, setDomainFilter] = useState(initialDomain);
  const [hasSummary, setHasSummary] = useState(initialHasSummary);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ThreadMetrics[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [pineconeCount, setPineconeCount] = useState<number | null>(null);
  const [pineconeError, setPineconeError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("pageSize", String(PAGE_SIZE));
        if (query.trim()) params.set("q", query.trim());
        if (minMessages.trim()) params.set("minMessages", minMessages.trim());
        if (maxMessages.trim()) params.set("maxMessages", maxMessages.trim());
        if (startDate.trim()) params.set("startDate", startDate.trim());
        if (endDate.trim()) params.set("endDate", endDate.trim());
        if (domainFilter.trim()) params.set("domain", domainFilter.trim());
        if (hasSummary) params.set("hasSummary", "1");

        const baseUrl =
          process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
        const resp = await fetch(
          `${baseUrl}/api/email-dataset?${params.toString()}`,
          { signal: controller.signal }
        );
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(
            `Failed to load dataset (${resp.status}): ${text.slice(0, 200)}`
          );
        }
        const json = (await resp.json()) as ThreadListResponse;
        setData(json);
      } catch (err) {
        if ((err as any)?.name === "AbortError") return;
        setError(
          (err as Error)?.message || "Failed to load email dataset threads."
        );
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [
    page,
    query,
    minMessages,
    maxMessages,
    startDate,
    endDate,
    domainFilter,
    hasSummary,
  ]);

  // Load analytics metrics (once)
  useEffect(() => {
    const controller = new AbortController();
    async function loadMetrics() {
      try {
        setMetricsLoading(true);
        setMetricsError(null);
        const baseUrl =
          process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
        const resp = await fetch(`${baseUrl}/api/email-analytics/metrics`, {
          signal: controller.signal,
        });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(
            `Failed to load metrics (${resp.status}): ${text.slice(0, 200)}`
          );
        }
        const json = (await resp.json()) as {
          count: number;
          data: ThreadMetrics[];
        };
        setMetrics(json.data || []);
      } catch (err) {
        if ((err as any)?.name === "AbortError") return;
        setMetricsError(
          (err as Error)?.message || "Failed to load email analytics metrics."
        );
      } finally {
        setMetricsLoading(false);
      }
    }
    loadMetrics();
    return () => controller.abort();
  }, []);

  // Load Pinecone stats (once)
  useEffect(() => {
    const controller = new AbortController();
    async function loadPinecone() {
      try {
        setPineconeError(null);
        const baseUrl =
          process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
        const resp = await fetch(`${baseUrl}/api/email-analytics/pinecone`, {
          signal: controller.signal,
        });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(
            `Failed to load Pinecone stats (${resp.status}): ${text.slice(
              0,
              200
            )}`
          );
        }
        const json = (await resp.json()) as {
          totalVectorCount?: number;
        };
        setPineconeCount(
          typeof json.totalVectorCount === "number"
            ? json.totalVectorCount
            : null
        );
      } catch (err) {
        if ((err as any)?.name === "AbortError") return;
        setPineconeError(
          (err as Error)?.message || "Failed to load Pinecone stats."
        );
      }
    }
    loadPinecone();
    return () => controller.abort();
  }, []);

  const totalThreads = metrics.length;
  const threadsWithSummary = metrics.filter(
    (m) => (m.summaryLength ?? 0) > 0
  ).length;
  const summaryCoverage =
    totalThreads > 0
      ? Math.round((threadsWithSummary / totalThreads) * 100)
      : 0;

  const lengthBuckets = [
    { label: "1–2 msgs", min: 1, max: 2, count: 0 },
    { label: "3–5 msgs", min: 3, max: 5, count: 0 },
    { label: "6–10 msgs", min: 6, max: 10, count: 0 },
    { label: "11–20 msgs", min: 11, max: 20, count: 0 },
    { label: "21+ msgs", min: 21, max: Infinity, count: 0 },
  ];
  metrics.forEach((m) => {
    const n = m.numMessages ?? 0;
    for (const bucket of lengthBuckets) {
      if (n >= bucket.min && n <= bucket.max) {
        bucket.count++;
        break;
      }
    }
  });
  const maxLengthCount =
    lengthBuckets.reduce((max, b) => Math.max(max, b.count), 0) || 1;

  const responseBuckets = [
    { label: "0–5 min", min: 0, max: 5, count: 0 },
    { label: "6–30 min", min: 6, max: 30, count: 0 },
    { label: "31–120 min", min: 31, max: 120, count: 0 },
    { label: "2–12 hrs", min: 121, max: 720, count: 0 },
    { label: "12+ hrs", min: 721, max: Infinity, count: 0 },
  ];
  metrics.forEach((m) => {
    const n = m.avgResponseMinutes ?? m.firstResponseMinutes ?? null;
    if (n == null || !Number.isFinite(n)) return;
    for (const bucket of responseBuckets) {
      if (n >= bucket.min && n <= bucket.max) {
        bucket.count++;
        break;
      }
    }
  });
  const maxRespCount =
    responseBuckets.reduce((max, b) => Math.max(max, b.count), 0) || 1;

  // Domain distribution is available in metrics if needed later for additional charts.

  const totalPages =
    data && data.pageSize > 0
      ? Math.max(1, Math.ceil(data.total / data.pageSize))
      : 1;

  const applySearch = () => {
    setPage(1);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (minMessages.trim()) params.set("minMessages", minMessages.trim());
    if (maxMessages.trim()) params.set("maxMessages", maxMessages.trim());
    if (startDate.trim()) params.set("startDate", startDate.trim());
    if (endDate.trim()) params.set("endDate", endDate.trim());
    if (domainFilter.trim()) params.set("domain", domainFilter.trim());
    if (hasSummary) params.set("hasSummary", "1");
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const resetFilters = () => {
    setQuery("");
    setMinMessages("");
    setMaxMessages("");
    setStartDate("");
    setEndDate("");
    setDomainFilter("");
    setHasSummary(false);
    setPage(1);
    const params = new URLSearchParams();
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const goToPage = (nextPage: number) => {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages || 1);
    setPage(safePage);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (minMessages.trim()) params.set("minMessages", minMessages.trim());
    if (maxMessages.trim()) params.set("maxMessages", maxMessages.trim());
    if (startDate.trim()) params.set("startDate", startDate.trim());
    if (endDate.trim()) params.set("endDate", endDate.trim());
    if (domainFilter.trim()) params.set("domain", domainFilter.trim());
    if (hasSummary) params.set("hasSummary", "1");
    params.set("page", String(safePage));
    router.push(`?${params.toString()}`);
  };

  const handleUploadCsv = async (file: File | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please select a .csv file");
      return;
    }
    try {
      setUploading(true);
      const text = await file.text();
      const baseUrl =
        process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
      const resp = await fetch(`${baseUrl}/api/email-dataset/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ csv: text, filename: file.name }),
      });
      if (!resp.ok) {
        const errJson = await resp
          .json()
          .catch(async () => ({ error: await resp.text() }));
        throw new Error(
          errJson.error || errJson.message || "Failed to upload CSV"
        );
      }
      const json = await resp.json();
      toast.success(
        `Uploaded CSV successfully (${
          json.importedThreads ?? "unknown number of"
        } threads). Now reloading threads...`
      );
      // Refresh list from first page
      setPage(1);
      const params = new URLSearchParams();
      params.set("page", "1");
      if (query.trim()) params.set("q", query.trim());
      router.push(`?${params.toString()}`);
    } catch (err) {
      toast.error(
        (err as Error)?.message || "Failed to upload and process CSV"
      );
      console.error("CSV upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const openThreadDetail = async (threadId: string) => {
    try {
      setDetailDialogOpen(true);
      setDetailLoading(true);
      setDetailError(null);
      setSelectedThread(null);

      const baseUrl =
        process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
      const resp = await fetch(`${baseUrl}/api/email-dataset/${threadId}`);
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(
          `Failed to load thread (${resp.status}): ${text.slice(0, 200)}`
        );
      }
      const json = (await resp.json()) as EmailThreadDetail;
      // Sort messages by timestamp (server should already do this, but enforce here)
      const sorted = [...(json.messages || [])].sort((a, b) => {
        const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return ta - tb;
      });
      setSelectedThread({ ...json, messages: sorted });
    } catch (err) {
      const msg =
        (err as Error)?.message || "Failed to load thread conversation.";
      setDetailError(msg);
      console.error("Thread detail error:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="space-y-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Email DataLake
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              High-level view of your email test corpus: how many threads you
              have, how long they are, how quickly they move, and how well they
              are summarized.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <div className="border rounded-md px-2 py-1 bg-muted/50">
              <span className="font-semibold">Local dataset:</span>{" "}
              {metricsLoading
                ? "Loading..."
                : metricsError
                ? "Error"
                : `${metrics.length.toLocaleString()} threads`}
            </div>
            <div className="border rounded-md px-2 py-1 bg-muted/50">
              <span className="font-semibold">Pinecone:</span>{" "}
              {pineconeError
                ? "Error"
                : pineconeCount !== null
                ? `${pineconeCount.toLocaleString()} vectors`
                : "Loading..."}
            </div>
          </div>
        </div>
      </div>

      <Card className="p-4 md:p-5 space-y-4 border border-border/60 bg-card">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 flex-1">
            <h2 className="text-sm font-semibold">Summary coverage</h2>
            {metricsLoading && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Computing coverage…
              </div>
            )}
            {metricsError && !metricsLoading && (
              <div className="text-xs text-red-500">{metricsError}</div>
            )}
            {!metricsLoading && !metricsError && (
              <div className="flex items-center gap-4 text-xs sm:text-sm">
                <div className="relative inline-flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border-4 border-muted flex items-center justify-center bg-background">
                    <div
                      className="w-16 h-16 rounded-full border-4 border-primary"
                      style={{
                        clipPath: `inset(${100 - summaryCoverage}% 0 0 0)`,
                      }}
                    />
                    <div className="absolute text-xs font-semibold">
                      {summaryCoverage}%
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="font-medium">
                    {threadsWithSummary} of {totalThreads || "…"} threads have
                    summaries.
                  </div>
                  <p className="text-xs text-muted-foreground">
                    More summaries = more ground truth for evaluation and
                    stronger context for retrieval.
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-3 flex-1">
            <h2 className="text-sm font-semibold">
              Thread length distribution
            </h2>
            <div className="space-y-1 text-xs">
              {lengthBuckets.map((b) => (
                <div
                  key={b.label}
                  className="flex items-center gap-2 text-[11px]"
                >
                  <span className="w-20">{b.label}</span>
                  <div className="flex-1 bg-muted rounded h-2 overflow-hidden">
                    <div
                      className="h-2 bg-primary"
                      style={{
                        width: `${(b.count / maxLengthCount) * 100 || 0}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-right">{b.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 pt-2 border-t border-border/60">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Response time (avg)</h2>
            <div className="space-y-1 text-xs">
              {responseBuckets.map((b) => (
                <div
                  key={b.label}
                  className="flex items-center gap-2 text-[11px]"
                >
                  <span className="w-24">{b.label}</span>
                  <div className="flex-1 bg-muted rounded h-2 overflow-hidden">
                    <div
                      className="h-2 bg-primary"
                      style={{
                        width: `${(b.count / maxRespCount) * 100 || 0}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-right">{b.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-1 gap-2 items-stretch sm:items-center">
            <Input
              placeholder="Search by subject, sender, or summary..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <div className="flex gap-2">
              <Button onClick={applySearch} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={resetFilters}
              >
                Reset
              </Button>
            </div>
          </div>
          <div className="flex gap-2 items-center justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => setShowFilters((v) => !v)}
            >
              {showFilters ? "Hide filters" : "Show filters"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUploadDialogOpen(true)}
            >
              Upload Custom Email Threads
            </Button>
          </div>
        </div>
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs sm:text-sm pt-2 border-t border-border/60">
            <div className="space-y-1">
              <div className="font-semibold">Messages</div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={minMessages}
                  onChange={(e) => setMinMessages(e.target.value)}
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="Max"
                  value={maxMessages}
                  onChange={(e) => setMaxMessages(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold">Date range</div>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold">Sender domain</div>
              <Input
                placeholder="@example.com"
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
              />
            </div>
            <div className="space-y-1 flex items-center md:items-start">
              <label className="inline-flex items-center gap-2 mt-1 md:mt-5">
                <input
                  type="checkbox"
                  className="h-3 w-3"
                  checked={hasSummary}
                  onChange={(e) => setHasSummary(e.target.checked)}
                />
                <span>Only threads with summary</span>
              </label>
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-500">
            Failed to load threads: {error}
          </div>
        )}

        <div className="border rounded-md overflow-hidden">
          <div className="grid grid-cols-12 bg-muted text-xs font-medium px-3 py-2">
            <div className="col-span-2">Thread ID</div>
            <div className="col-span-4">Subject</div>
            <div className="col-span-3">From</div>
            <div className="col-span-3">Summary</div>
          </div>
          <div className="divide-y">
            {loading && !data && (
              <div className="px-3 py-6 text-sm text-muted-foreground flex items-center justify-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading threads...
              </div>
            )}
            {!loading && data && data.items.length === 0 && (
              <div className="px-3 py-6 text-sm text-muted-foreground text-center">
                No threads found for this query.
              </div>
            )}
            {data &&
              data.items.map((item) => (
                <div
                  key={item.threadId}
                  className="grid grid-cols-12 px-3 py-2 text-xs sm:text-sm hover:bg-muted/60 cursor-pointer"
                  onClick={() => openThreadDetail(item.threadId)}
                >
                  <div className="col-span-2 font-mono truncate pr-2">
                    {item.threadId}
                  </div>
                  <div className="col-span-4 truncate pr-2">
                    {item.subject || "(no subject)"}
                  </div>
                  <div className="col-span-3 truncate pr-2">
                    {item.firstFrom || "(unknown sender)"}
                  </div>
                  <div className="col-span-3 text-xs text-muted-foreground">
                    {item.summarySnippet}
                    {item.summarySnippet.length >= 200 ? "…" : ""}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {data && data.total > 0 && (
          <div className="flex items-center justify-between text-xs sm:text-sm pt-2">
            <div>
              Page {data.page} of {totalPages} • {data.total} threads
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.page <= 1 || loading}
                onClick={() => goToPage(data.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={data.page >= totalPages || loading}
                onClick={() => goToPage(data.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload email CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file to add your own email threads to the dataset and
              Pinecone. Each row should represent a single email message.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs sm:text-sm">
            <div>
              <div className="font-semibold mb-1">Required columns:</div>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>
                  <code>thread_id</code> – groups messages into a thread
                </li>
                <li>
                  <code>subject</code> – email subject
                </li>
                <li>
                  <code>timestamp</code> – epoch ms or ISO datetime
                </li>
                <li>
                  <code>from</code> – sender
                </li>
                <li>
                  <code>to</code> – recipients, separated by commas or
                  semicolons
                </li>
                <li>
                  <code>body</code> – email body text
                </li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-1">Optional columns:</div>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>
                  <code>summary</code> – thread-level summary (can be repeated
                  per row; the system will keep one per thread)
                </li>
              </ul>
            </div>
            <div className="border border-dashed rounded-md p-4 text-center">
              <p className="text-xs text-muted-foreground mb-2">
                Click the button below to select a <code>.csv</code> file from
                your computer.
              </p>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                id="email-csv-input"
                onChange={async (e) => {
                  const file = e.target.files?.[0] || null;
                  if (!file) return;
                  await handleUploadCsv(file);
                  // Close dialog on success or failure; user can re-open if needed
                  setUploadDialogOpen(false);
                  // Reset input so same file can be selected again if needed
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => {
                  const input = document.getElementById(
                    "email-csv-input"
                  ) as HTMLInputElement | null;
                  if (input) input.click();
                }}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading CSV...
                  </>
                ) : (
                  "Select CSV file"
                )}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUploadDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Thread {selectedThread?.threadId || ""}</DialogTitle>
            <DialogDescription>
              Full email conversation for this thread, in chronological order.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto space-y-4 pr-1">
            {detailLoading && (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading conversation...
              </div>
            )}
            {detailError && !detailLoading && (
              <div className="text-sm text-red-500">{detailError}</div>
            )}
            {!detailLoading && !detailError && selectedThread && (
              <div className="space-y-3">
                {selectedThread.summary && (
                  <div className="rounded-md bg-muted px-3 py-2 text-xs sm:text-sm">
                    <div className="font-semibold mb-1">Summary</div>
                    <p className="text-muted-foreground">
                      {selectedThread.summary}
                    </p>
                  </div>
                )}
                <div className="space-y-3">
                  {selectedThread.messages.map((m, idx) => {
                    const ts = m.timestamp
                      ? new Date(m.timestamp).toLocaleString()
                      : "Unknown time";
                    return (
                      <div
                        key={m.messageId || `${selectedThread.threadId}-${idx}`}
                        className="border rounded-md px-3 py-2 text-xs sm:text-sm"
                      >
                        <div className="flex flex-wrap justify-between gap-1 mb-1">
                          <div className="font-medium truncate max-w-[60%]">
                            {m.subject || "(no subject)"}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {ts}
                          </div>
                        </div>
                        <div className="text-[11px] text-muted-foreground mb-1">
                          <span className="font-semibold">From:</span>{" "}
                          {m.from || "(unknown)"}{" "}
                          {m.to && m.to.length > 0 && (
                            <>
                              <span className="mx-1">·</span>
                              <span>
                                <span className="font-semibold">To:</span>{" "}
                                {m.to.join(", ")}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="whitespace-pre-wrap text-xs">
                          {m.body || ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <div className="flex w-full justify-between items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDetailDialogOpen(false)}
              >
                Close
              </Button>
              {selectedThread && (
                <Link
                  href={{
                    pathname: "/generate/test-case",
                    query: {
                      name:
                        selectedThread.messages?.[0]?.subject ||
                        `Thread ${selectedThread.threadId}`,
                      description:
                        selectedThread.summary ||
                        `Test email assistant behavior on thread ${selectedThread.threadId}.`,
                      kindOfTestCases:
                        "Email conversation handling, summarization, and reply drafting",
                    },
                  }}
                >
                  <Button type="button" size="sm">
                    Create test case from thread
                  </Button>
                </Link>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
