"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import CallItem from "./CallItem";
import {
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
  PencilLine,
  Clock,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Brain,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EditSubTestForm from "./EditSubTestForm";
import { getEmailsBySubTestId } from "./actions";

interface SubTest {
  id: number;
  name: string | null;
  description: string | null;
  testCaseId: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  expected: string | null;
}

interface Call {
  id: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  duration?: number;
  transcript?: string;
  summary?: string;
  cost?: number;
  customer?: {
    number: string;
  };
}

export default function SubTestItem({ subTest }: { subTest: SubTest }) {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loadingCalls, setLoadingCalls] = useState(false);
  const [showCalls, setShowCalls] = useState(false);
  const [callCount, setCallCount] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [emailsOpen, setEmailsOpen] = useState(false);
  const [emails, setEmails] = useState<any[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [emailSheetOpen, setEmailSheetOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [emailsCount, setEmailsCount] = useState<number | null>(null);
  const [threadMessages, setThreadMessages] = useState<any[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("gpt-5");
  const [isTesting, setIsTesting] = useState(false);
  const [conversation, setConversation] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [runScores, setRunScores] = useState<number[]>([]);
  const [evaluation, setEvaluation] = useState<{
    semanticSimilarity: number | null;
    compositeScore: number | null;
    judge?: {
      succeeded: boolean;
      taskCompletionConfidence: number;
      safetyScore: number;
      faithfulnessScore?: number;
      reasoning: string;
      failureReasons?: string[];
    } | null;
  } | null>(null);
  const [lastRunId, setLastRunId] = useState<string | null>(null);
  const [humanLabel, setHumanLabel] = useState<"correct" | "incorrect" | null>(
    null
  );
  const [labelNotes, setLabelNotes] = useState("");
  const [savingLabel, setSavingLabel] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<
    Record<
      string,
      {
        runId: string | null;
        messages: { role: "user" | "assistant"; content: string }[];
        evaluation: {
          semanticSimilarity: number | null;
          compositeScore: number | null;
          judge?: {
            succeeded: boolean;
            taskCompletionConfidence: number;
            safetyScore: number;
            faithfulnessScore?: number;
            reasoning: string;
            failureReasons?: string[];
          } | null;
        } | null;
        rouge1?: number;
      }
    >
  >({});
  const [runHistory, setRunHistory] = useState<
    {
      timestamp: string;
      runId: string | null;
      model: string;
      evaluation: {
        semanticSimilarity: number | null;
        compositeScore: number | null;
        judge?: {
          succeeded: boolean;
          taskCompletionConfidence: number;
          safetyScore: number;
          faithfulnessScore?: number;
          reasoning: string;
          failureReasons?: string[];
        } | null;
      } | null;
    }[]
  >([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const modelOptions = [
    { id: "gpt-5", label: "GPT-5 (largest)" },
    { id: "gpt-5-mini", label: "GPT-5 Mini" },
    { id: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
    { id: "gpt-4.1-nano", label: "GPT-4.1 Nano (tiny)" },
  ] as const;

  const computeRouge1 = (reference: string, candidate: string): number => {
    const tokenize = (text: string) =>
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean);

    const refTokens = tokenize(reference);
    const candTokens = tokenize(candidate);

    if (refTokens.length === 0 || candTokens.length === 0) {
      return 0;
    }

    const refCounts = new Map<string, number>();
    for (const token of refTokens) {
      refCounts.set(token, (refCounts.get(token) ?? 0) + 1);
    }

    let overlap = 0;
    for (const token of candTokens) {
      const count = refCounts.get(token) ?? 0;
      if (count > 0) {
        overlap += 1;
        refCounts.set(token, count - 1);
      }
    }

    const precision = overlap / candTokens.length;
    const recall = overlap / refTokens.length;

    if (precision + recall === 0) {
      return 0;
    }

    return (2 * precision * recall) / (precision + recall);
  };

  const handleRunModelTest = async () => {
    if (!subTest.id) return;
    if (!selectedModel) {
      toast.error("Please select a model first");
      return;
    }

    setIsTesting(true);
    setConversation([]);
    setEvaluation(null);
    setLastRunId(null);
    setHumanLabel(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/llm-dialog/subtest`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subTestId: subTest.id,
            model: selectedModel,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to run model test:", errorText);
        toast.error("Failed to run model test");
        return;
      }

      const data = (await response.json()) as {
        runId?: string;
        messages?: { role: "user" | "assistant"; content: string }[];
        evaluation?: {
          semanticSimilarity: number | null;
          compositeScore: number | null;
          judge?: {
            succeeded: boolean;
            taskCompletionConfidence: number;
            safetyScore: number;
            faithfulnessScore?: number;
            reasoning: string;
            failureReasons?: string[];
          } | null;
        };
      };

      if (!data.messages || !Array.isArray(data.messages)) {
        toast.error("Model returned no conversation");
        return;
      }

      setConversation(data.messages);
      if (data.runId) {
        setLastRunId(data.runId);
      }
      if (data.evaluation) {
        setEvaluation(data.evaluation);
      }

      let rougeScore: number | undefined;
      if (subTest.expected) {
        const assistantText = data.messages
          .filter((m) => m.role === "assistant")
          .map((m) => m.content)
          .join(" ");

        const score = computeRouge1(subTest.expected, assistantText);
        rougeScore = score;
        setRunScores((prev) => [...prev, score]);
      }

      // Store latest run per model for side-by-side comparison
      setComparisonResults((prev) => ({
        ...prev,
        [selectedModel]: {
          runId: data.runId ?? null,
          messages: data.messages!,
          evaluation: data.evaluation ?? null,
          rouge1: rougeScore,
        },
      }));
    } catch (error) {
      console.error("Error running model test:", error);
      toast.error("Something went wrong while testing the model");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveLabel = async (label: "correct" | "incorrect") => {
    if (!subTest.id) return;
    setSavingLabel(true);
    try {
      const body = {
        runId: lastRunId,
        subTestId: subTest.id,
        model: selectedModel,
        label,
        notes: labelNotes || undefined,
        evaluation,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/llm-dialog/label`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        console.error("Failed to save label:", text);
        toast.error("Failed to save label");
        return;
      }

      setHumanLabel(label);
      toast.success("Label saved");
    } catch (error) {
      console.error("Error saving label:", error);
      toast.error("Something went wrong while saving label");
    } finally {
      setSavingLabel(false);
    }
  };

  const fetchRunHistory = async () => {
    if (!subTest.id) return;
    setLoadingHistory(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/llm-dialog/history/${subTest.id}`
      );
      if (!response.ok) {
        console.error("Failed to fetch run history:", await response.text());
        return;
      }
      const data = (await response.json()) as {
        runs?: {
          timestamp: string;
          runId: string | null;
          model: string;
          evaluation: {
            semanticSimilarity: number | null;
            compositeScore: number | null;
            judge?: {
              succeeded: boolean;
              taskCompletionConfidence: number;
              safetyScore: number;
              faithfulnessScore?: number;
              reasoning: string;
              failureReasons?: string[];
            } | null;
          } | null;
        }[];
      };
      setRunHistory(data.runs || []);
    } catch (error) {
      console.error("Error fetching run history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const callSubTest = async (subTestId: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/call-subtest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subTestId }),
      });
      toast.success("Sub-test called successfully");
      // Refresh call count after creating a new one
      fetchCallCount();
    } catch (error) {
      toast.error("Failed to call sub-test");
    }
  };

  const emailSubTest = async (subTestId: number) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/agentmail/start-test`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ testRunId: subTestId }),
        }
      );
      toast.success("Sub-test called successfully");
    } catch {
      toast.error("Something went wrong with email");
    }
  };

  const fetchCalls = async () => {
    setLoadingCalls(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/call-subtest/${subTest.id}`
      );
      if (response.ok) {
        const data = await response.json();
        const fetchedCalls = data.calls || [];
        setCalls(fetchedCalls);
        setCallCount(fetchedCalls.length);
      } else {
        console.error("Failed to fetch calls");
      }
    } catch (error) {
      console.error("Error fetching calls:", error);
    } finally {
      setLoadingCalls(false);
    }
  };

  const fetchCallCount = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/call-subtest/${subTest.id}`
      );
      if (response.ok) {
        const data = await response.json();
        const fetchedCalls = data.calls || [];
        setCallCount(fetchedCalls.length);
      }
    } catch (error) {
      console.error("Error fetching call count:", error);
    }
  };

  useEffect(() => {
    // Fetch call count on mount
    fetchCallCount();
  }, []);

  useEffect(() => {
    if (showCalls && calls.length === 0) {
      fetchCalls();
    }
  }, [showCalls]);

  const fetchEmails = async () => {
    setLoadingEmails(true);
    try {
      const fd = new FormData();
      fd.set("subTestId", String(subTest.id));
      const result = await getEmailsBySubTestId(fd);
      setEmails(result || []);
      setEmailsCount((result || []).length);
    } catch (e) {
      console.error("Error fetching emails", e);
    } finally {
      setLoadingEmails(false);
    }
  };

  const getEmailStatusBadgeClass = (status?: string) => {
    const s = String(status || "").toUpperCase();
    if (s === "SUCCESS")
      return "bg-green-500/15 text-green-500 border-green-500/30";
    if (s === "FAILED") return "bg-red-500/15 text-red-500 border-red-500/30";
    return "bg-amber-500/15 text-amber-500 border-amber-500/30"; // PENDING / default
  };

  const fetchThreadMessages = async (threadId: string) => {
    if (!threadId) return;
    setLoadingThread(true);
    setThreadMessages([]);
    try {
      const response = await fetch(`/api/agentmail/thread/${threadId}`);
      if (response.ok) {
        const data = await response.json();
        setThreadMessages(data.messages || []);
      } else {
        console.error("Failed to fetch thread:", await response.text());
      }
    } catch (error) {
      console.error("Error fetching thread messages:", error);
    } finally {
      setLoadingThread(false);
    }
  };

  const handleEmailClick = (email: any) => {
    setSelectedEmail(email);
    setEmailSheetOpen(true);
    if (email.metadata?.threadId) {
      fetchThreadMessages(email.metadata.threadId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="text-base md:text-lg">
            {subTest.name || "Untitled Sub-Test"}
          </CardTitle>
          <CardDescription>
            Created: {subTest.createdAt?.toLocaleDateString()}
            {subTest.updatedAt && subTest.updatedAt !== subTest.createdAt && (
              <span className="ml-2">
                • Updated: {subTest.updatedAt.toLocaleDateString()}
              </span>
            )}
          </CardDescription>
        </div>
        <CardAction>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="cursor-pointer"
              onClick={() => callSubTest(subTest.id)}
            >
              <Phone className="h-4 w-4" />
              <span className="hidden sm:inline">Call</span>
            </Button>
            <Button size="sm" onClick={() => emailSubTest(subTest.id)}>
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditOpen(true)}
            >
              <PencilLine className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setTestDialogOpen(true)}
            >
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Test Model</span>
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {subTest.description && (
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                Description
              </h4>
              <p className="text-sm">{subTest.description}</p>
            </div>
          )}
          {subTest.expected && (
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                Expected Result
              </h4>
              <p className="text-sm">{subTest.expected}</p>
            </div>
          )}
          {!subTest.description && !subTest.expected && (
            <p className="text-sm text-muted-foreground italic">
              No additional details available for this sub-test.
            </p>
          )}
        </div>
      </CardContent>
      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sub-Test</DialogTitle>
          </DialogHeader>
          <EditSubTestForm
            subTest={{
              id: subTest.id,
              testCaseId: subTest.testCaseId || 0,
              name: subTest.name,
              description: subTest.description,
              expected: subTest.expected,
            }}
            onSaved={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Model Test Dialog */}
      <Dialog
        open={testDialogOpen}
        onOpenChange={(open) => {
          setTestDialogOpen(open);
          if (open && runHistory.length === 0 && !loadingHistory) {
            fetchRunHistory();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Model on Sub-Test</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Pick a model and run it against this sub-test. We&apos;ll keep a
                running ROUGE-1 score based on the expected result.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Model
              </label>
              <Select
                value={selectedModel}
                onValueChange={(value) => setSelectedModel(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {modelOptions.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {subTest.expected && (
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-muted-foreground">
                  Expected Result (reference)
                </h4>
                <p className="text-sm">{subTest.expected}</p>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <Button
                size="sm"
                onClick={handleRunModelTest}
                disabled={isTesting}
              >
                {isTesting ? "Running..." : "Run Test"}
              </Button>
              <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                {runScores.length > 0 && (
                  <div>
                    <span className="font-semibold">ROUGE-1 (running): </span>
                    {(
                      (runScores.reduce((sum, s) => sum + s, 0) /
                        runScores.length) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                )}
                {evaluation && evaluation.semanticSimilarity !== null && (
                  <div>
                    <span className="font-semibold">Semantic similarity: </span>
                    {((evaluation.semanticSimilarity || 0) * 100).toFixed(1)}%
                  </div>
                )}
                {evaluation && evaluation.compositeScore !== null && (
                  <div>
                    <span className="font-semibold">Composite score: </span>
                    {((evaluation.compositeScore || 0) * 100).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>

            {conversation.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">
                  Conversation Transcript (max 10 messages)
                </h4>
                <div className="max-h-64 overflow-y-auto rounded-md border bg-muted/40 p-2 space-y-2">
                  {conversation.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`text-sm p-2 rounded-md ${
                        msg.role === "assistant"
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-background border border-border"
                      }`}
                    >
                      <div className="text-xs font-semibold text-muted-foreground mb-1">
                        {msg.role === "assistant" ? "Agent" : "User"}
                      </div>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {evaluation && evaluation.judge && (
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-muted-foreground">
                  LLM Judge Summary
                </h4>
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold">Auto verdict: </span>
                  {evaluation.judge.succeeded ? "Succeeded" : "Failed"} ·{" "}
                  <span className="font-semibold">Task confidence: </span>
                  {(evaluation.judge.taskCompletionConfidence * 100).toFixed(1)}
                  % · <span className="font-semibold">Safety: </span>
                  {(evaluation.judge.safetyScore * 100).toFixed(1)}%
                  {typeof evaluation.judge.faithfulnessScore === "number" && (
                    <>
                      {" "}
                      · <span className="font-semibold">Faithfulness: </span>
                      {(evaluation.judge.faithfulnessScore * 100).toFixed(1)}%
                    </>
                  )}
                </p>
                <p className="text-xs whitespace-pre-wrap">
                  {evaluation.judge.reasoning}
                </p>
                {evaluation.judge.failureReasons &&
                  evaluation.judge.failureReasons.length > 0 && (
                    <ul className="list-disc list-inside text-xs text-muted-foreground mt-1">
                      {evaluation.judge.failureReasons.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  )}
              </div>
            )}

            {conversation.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <h4 className="font-semibold text-sm text-muted-foreground">
                  Human Label
                </h4>
                <p className="text-xs text-muted-foreground">
                  Override or confirm the automatic judgment for this run.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant={humanLabel === "correct" ? "default" : "outline"}
                    onClick={() => handleSaveLabel("correct")}
                    disabled={savingLabel}
                  >
                    Mark Correct
                  </Button>
                  <Button
                    size="sm"
                    variant={humanLabel === "incorrect" ? "default" : "outline"}
                    onClick={() => handleSaveLabel("incorrect")}
                    disabled={savingLabel}
                  >
                    Mark Incorrect
                  </Button>
                  {savingLabel && (
                    <span className="text-xs text-muted-foreground">
                      Saving...
                    </span>
                  )}
                  {humanLabel && !savingLabel && (
                    <span className="text-xs text-muted-foreground">
                      Label:{" "}
                      <span className="font-semibold capitalize">
                        {humanLabel}
                      </span>
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Notes (optional)
                  </label>
                  <textarea
                    className="w-full min-h-[60px] text-xs border rounded-md px-2 py-1 bg-background"
                    value={labelNotes}
                    onChange={(e) => setLabelNotes(e.target.value)}
                    placeholder="Add any comments about why this run was correct or incorrect..."
                  />
                </div>
              </div>
            )}

            {Object.keys(comparisonResults).length > 1 && (
              <div className="space-y-2 pt-3 border-t">
                <h4 className="font-semibold text-sm text-muted-foreground">
                  Model Comparison
                </h4>
                <p className="text-xs text-muted-foreground">
                  Latest runs for each model on this sub-test, side by side.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {modelOptions
                    .filter((m) => comparisonResults[m.id])
                    .map((model) => {
                      const run = comparisonResults[model.id]!;
                      const evalData = run.evaluation;
                      const judge = evalData?.judge;
                      return (
                        <div
                          key={model.id}
                          className="border rounded-md p-2 bg-muted/30 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs font-semibold">
                              {model.label}
                            </div>
                            {run.rouge1 !== undefined && (
                              <div className="text-[10px] text-muted-foreground">
                                <span className="font-semibold">ROUGE-1:</span>{" "}
                                {(run.rouge1 * 100).toFixed(1)}%
                              </div>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground space-y-0.5">
                            {evalData &&
                              evalData.semanticSimilarity !== null && (
                                <div>
                                  <span className="font-semibold">
                                    Semantic:
                                  </span>{" "}
                                  {(
                                    (evalData.semanticSimilarity || 0) * 100
                                  ).toFixed(1)}
                                  %
                                </div>
                              )}
                            {evalData && evalData.compositeScore !== null && (
                              <div>
                                <span className="font-semibold">
                                  Composite:
                                </span>{" "}
                                {((evalData.compositeScore || 0) * 100).toFixed(
                                  1
                                )}
                                %
                              </div>
                            )}
                            {judge && (
                              <div>
                                <span className="font-semibold">Verdict:</span>{" "}
                                {judge.succeeded ? "Succeeded" : "Failed"}
                              </div>
                            )}
                          </div>
                          <div className="max-h-36 overflow-y-auto border rounded-md bg-background/70 p-2 space-y-1">
                            {run.messages.map((msg, idx) => (
                              <div
                                key={idx}
                                className={`text-[11px] p-1 rounded ${
                                  msg.role === "assistant"
                                    ? "bg-primary/10 border border-primary/20"
                                    : "bg-muted border border-border/40"
                                }`}
                              >
                                <div className="text-[10px] font-semibold text-muted-foreground mb-0.5">
                                  {msg.role === "assistant" ? "Agent" : "User"}
                                </div>
                                <div className="whitespace-pre-wrap">
                                  {msg.content}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="space-y-2 pt-3 border-t">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-sm text-muted-foreground">
                  Run History
                </h4>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[11px]"
                  onClick={fetchRunHistory}
                  disabled={loadingHistory}
                >
                  {loadingHistory ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
              {runHistory.length === 0 && !loadingHistory && (
                <p className="text-xs text-muted-foreground">
                  No previous runs recorded yet for this sub-test.
                </p>
              )}
              {runHistory.length > 0 && (
                <div className="max-h-40 overflow-y-auto border rounded-md bg-muted/40">
                  <table className="w-full border-collapse text-[11px]">
                    <thead className="bg-muted/60">
                      <tr>
                        <th className="px-2 py-1 text-left font-semibold">
                          Time
                        </th>
                        <th className="px-2 py-1 text-left font-semibold">
                          Model
                        </th>
                        <th className="px-2 py-1 text-right font-semibold">
                          Comp.
                        </th>
                        <th className="px-2 py-1 text-right font-semibold">
                          Sem.
                        </th>
                        <th className="px-2 py-1 text-left font-semibold">
                          Verdict
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {runHistory.map((run, idx) => {
                        const evalData = run.evaluation;
                        const judge = evalData?.judge;
                        return (
                          <tr
                            key={run.runId || `${run.timestamp}-${idx}`}
                            className="border-t border-border/60"
                          >
                            <td className="px-2 py-1 align-top">
                              {new Date(run.timestamp).toLocaleString()}
                            </td>
                            <td className="px-2 py-1 align-top">{run.model}</td>
                            <td className="px-2 py-1 align-top text-right">
                              {evalData &&
                              evalData.compositeScore !== null &&
                              typeof evalData.compositeScore === "number"
                                ? `${(evalData.compositeScore * 100).toFixed(
                                    1
                                  )}%`
                                : "—"}
                            </td>
                            <td className="px-2 py-1 align-top text-right">
                              {evalData &&
                              evalData.semanticSimilarity !== null &&
                              typeof evalData.semanticSimilarity === "number"
                                ? `${(
                                    evalData.semanticSimilarity * 100
                                  ).toFixed(1)}%`
                                : "—"}
                            </td>
                            <td className="px-2 py-1 align-top">
                              {judge
                                ? judge.succeeded
                                  ? "Succeeded"
                                  : "Failed"
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Calls Section */}
      <div className="border-t">
        <div className="p-4">
          <button
            onClick={() => setShowCalls(!showCalls)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {showCalls ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            Calls ({callCount})
          </button>

          {showCalls && (
            <div className="mt-3">
              {loadingCalls ? (
                <div className="text-sm text-muted-foreground">
                  Loading calls...
                </div>
              ) : callCount === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No calls found for this sub-test.
                </div>
              ) : (
                <div className="space-y-2">
                  {calls.map((call) => (
                    <CallItem
                      key={call.id}
                      call={call}
                      subTestId={subTest.id}
                      onCallDeleted={() => {
                        // Refresh the calls list after deletion
                        fetchCalls();
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Emails Section */}
      <div className="border-t">
        <div className="p-4">
          <button
            onClick={() => {
              const next = !emailsOpen;
              setEmailsOpen(next);
              if (next && emails.length === 0) {
                fetchEmails();
              }
            }}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {emailsOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            Emails{emailsCount !== null ? ` (${emailsCount})` : ""}
          </button>

          {emailsOpen && (
            <div className="mt-3">
              {loadingEmails ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : emails.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No emails found for this sub-test.
                </div>
              ) : (
                <div className="space-y-2">
                  {emails.map((email) => (
                    <button
                      key={email.id}
                      className="w-full text-left text-sm border rounded-md p-3 hover:bg-accent/40 transition-colors"
                      onClick={() => handleEmailClick(email)}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <Badge
                          className={getEmailStatusBadgeClass(email.status)}
                        >
                          {email.status}
                        </Badge>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {email.createdAt
                            ? new Date(email.createdAt).toLocaleString()
                            : ""}
                        </span>
                      </div>
                      {email.metadata?.threadId && (
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          Thread:{" "}
                          <span className="font-mono">
                            {email.metadata.threadId}
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Email Details Sheet */}
      <Sheet
        open={emailSheetOpen}
        onOpenChange={(open) => {
          setEmailSheetOpen(open);
          if (!open) {
            setThreadMessages([]);
          }
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl flex flex-col [&>button]:z-50"
        >
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-4">
              <SheetHeader className="mb-6">
                <SheetTitle>Email Details</SheetTitle>
              </SheetHeader>
              {selectedEmail && (
                <div className="space-y-6">
                  {/* Status and Info Section */}
                  <div className="flex items-center justify-between pb-3 border-b">
                    <div className="flex items-center gap-3">
                      <Badge
                        className={getEmailStatusBadgeClass(
                          selectedEmail.status
                        )}
                      >
                        {selectedEmail.status === "SUCCESS" && (
                          <CheckCircle2 className="h-3 w-3 mr-1.5" />
                        )}
                        {selectedEmail.status === "FAILED" && (
                          <XCircle className="h-3 w-3 mr-1.5" />
                        )}
                        {selectedEmail.status !== "SUCCESS" &&
                          selectedEmail.status !== "FAILED" && (
                            <AlertCircle className="h-3 w-3 mr-1.5" />
                          )}
                        {selectedEmail.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {selectedEmail.createdAt
                          ? new Date(selectedEmail.createdAt).toLocaleString()
                          : ""}
                      </span>
                    </div>
                  </div>

                  {/* Thread ID */}
                  {selectedEmail.metadata?.threadId && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        Thread ID
                      </label>
                      <p className="font-mono text-xs break-all bg-muted/50 p-2.5 rounded-md">
                        {selectedEmail.metadata.threadId}
                      </p>
                    </div>
                  )}

                  {/* Email Thread */}
                  {selectedEmail.metadata?.threadId && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Thread
                        </h3>
                        {loadingThread && (
                          <span className="text-xs text-muted-foreground">
                            Loading...
                          </span>
                        )}
                      </div>
                      {loadingThread ? (
                        <div className="space-y-2">
                          <Skeleton className="h-24 w-full" />
                          <Skeleton className="h-24 w-full" />
                        </div>
                      ) : threadMessages.length > 0 ? (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                          {threadMessages.map((message: any, index: number) => {
                            const isAgentMail =
                              message.from?.includes("@agentmail.to");
                            return (
                              <div
                                key={message.messageId || index}
                                className={`border rounded-lg p-4 ${
                                  isAgentMail
                                    ? "bg-primary/5 border-primary/20"
                                    : "bg-muted/30"
                                }`}
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <User className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs font-medium">
                                      {isAgentMail ? "Agent" : "Customer"}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {message.from}
                                    </span>
                                  </div>
                                  {message.timestamp && (
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(
                                        message.timestamp
                                      ).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                {message.subject && (
                                  <div className="mb-3">
                                    <span className="text-xs font-medium">
                                      Subject: {message.subject}
                                    </span>
                                  </div>
                                )}
                                <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                  {message.text ||
                                    message.preview ||
                                    "No content"}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-6">
                          No messages found in thread
                        </p>
                      )}
                    </div>
                  )}

                  {/* Evaluation Results */}
                  {selectedEmail.metadata?.messageData && (
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="text-sm font-semibold mb-1">
                        Evaluation Results
                      </h3>

                      {typeof selectedEmail.metadata.messageData.succeeded ===
                        "boolean" && (
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <span className="text-sm font-medium">Succeeded</span>
                          <div className="flex items-center gap-2">
                            {selectedEmail.metadata.messageData.succeeded ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm font-medium">
                              {selectedEmail.metadata.messageData.succeeded
                                ? "Yes"
                                : "No"}
                            </span>
                          </div>
                        </div>
                      )}

                      {selectedEmail.metadata.messageData.summary && (
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">
                            Summary
                          </label>
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-sm leading-relaxed">
                              {selectedEmail.metadata.messageData.summary}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedEmail.metadata.messageData
                        .divergenceExplanation &&
                        selectedEmail.metadata.messageData
                          .divergenceExplanation !== "None" && (
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">
                              Divergence
                            </label>
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                              <p className="text-sm leading-relaxed">
                                {
                                  selectedEmail.metadata.messageData
                                    .divergenceExplanation
                                }
                              </p>
                            </div>
                          </div>
                        )}

                      {selectedEmail.metadata.messageData.suggestedFix &&
                        selectedEmail.metadata.messageData.suggestedFix !==
                          "None" && (
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">
                              Suggested Fix
                            </label>
                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                              <p className="text-sm leading-relaxed">
                                {
                                  selectedEmail.metadata.messageData
                                    .suggestedFix
                                }
                              </p>
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
