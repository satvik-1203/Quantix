"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  Phone,
  Clock,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface PhoneCallEvaluationProps {
  callId: string;
  subTestId: number;
  onEvaluationComplete?: () => void;
}

interface Judgment {
  succeeded: boolean;
  explanation: string;
  divergenceExplanation: string;
  suggestedFix: string;
  conversationQuality?: "excellent" | "good" | "fair" | "poor";
  callDurationAppropriate?: boolean;
}

interface TranscriptMessage {
  role: string;
  message: string;
  time?: number;
}

interface EvaluationResult {
  success: boolean;
  callId: string;
  judgment: Judgment;
  transcript: TranscriptMessage[];
  callDuration?: number;
}

export function PhoneCallEvaluationDisplay({
  callId,
  subTestId,
  onEvaluationComplete,
}: PhoneCallEvaluationProps) {
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const runEvaluation = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
      console.log("[PhoneCallEvaluation] Calling API:", `${apiUrl}/api/call-subtest/evaluate/${callId}`);
      
      const response = await fetch(
        `${apiUrl}/api/call-subtest/evaluate/${callId}`,
        { method: "POST" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Evaluation failed");
      }

      const data: EvaluationResult = await response.json();
      console.log("[PhoneCallEvaluation] Received data:", data);
      console.log("[PhoneCallEvaluation] Judgment:", data.judgment);
      setEvaluation(data);
      setShowDialog(true);
      toast.success(
        `Evaluation complete: ${data.judgment.succeeded ? "PASSED" : "FAILED"}`
      );
      
      // Notify parent to refresh the calls list
      if (onEvaluationComplete) {
        onEvaluationComplete();
      }
    } catch (error) {
      console.error("Evaluation error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to evaluate call"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const getQualityColor = (quality?: string) => {
    switch (quality) {
      case "excellent":
        return "bg-green-500";
      case "good":
        return "bg-blue-500";
      case "fair":
        return "bg-yellow-500";
      case "poor":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <>
      <Button
        onClick={runEvaluation}
        disabled={loading}
        size="sm"
        variant="outline"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        {loading ? "Evaluating..." : "Evaluate Call"}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Call Evaluation Results</DialogTitle>
          </DialogHeader>

          {evaluation && (
            <div className="space-y-6">
              {/* Status Banner */}
              <Card
                className={
                  evaluation.judgment.succeeded
                    ? "border-green-500 bg-green-50 dark:bg-green-950"
                    : "border-red-500 bg-red-50 dark:bg-red-950"
                }
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    {evaluation.judgment.succeeded ? (
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-600" />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">
                        {evaluation.judgment.succeeded
                          ? "✅ Test Passed"
                          : "❌ Test Failed"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Call ID: {evaluation.callId.slice(0, 16)}...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Call Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Duration
                        </p>
                        <p className="font-semibold">
                          {formatDuration(evaluation.callDuration)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Messages
                        </p>
                        <p className="font-semibold">
                          {evaluation.transcript.length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {evaluation.judgment.conversationQuality && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Quality
                          </p>
                          <Badge
                            className={getQualityColor(
                              evaluation.judgment.conversationQuality
                            )}
                          >
                            {evaluation.judgment.conversationQuality}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Judge Explanation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">📝 Explanation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">
                    {evaluation.judgment.explanation}
                  </p>
                </CardContent>
              </Card>

              {/* Divergence (if failed) */}
              {!evaluation.judgment.succeeded &&
                evaluation.judgment.divergenceExplanation && (
                  <Card className="border-orange-500">
                    <CardHeader>
                      <CardTitle className="text-base">
                        🔍 Where It Went Wrong
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">
                        {evaluation.judgment.divergenceExplanation}
                      </p>
                    </CardContent>
                  </Card>
                )}

              {/* Suggested Fix (if failed) */}
              {!evaluation.judgment.succeeded &&
                evaluation.judgment.suggestedFix && (
                  <Card className="border-blue-500">
                    <CardHeader>
                      <CardTitle className="text-base">
                        💡 Suggested Fix
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">
                        {evaluation.judgment.suggestedFix}
                      </p>
                    </CardContent>
                  </Card>
                )}

              {/* Transcript */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    📞 Call Transcript
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {evaluation.transcript.map((message, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          message.role === "assistant"
                            ? "bg-blue-50 dark:bg-blue-950"
                            : "bg-gray-50 dark:bg-gray-900"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Badge
                            variant={
                              message.role === "assistant"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {message.role === "assistant"
                              ? "Agent"
                              : "Customer"}
                          </Badge>
                          {message.time !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              {message.time.toFixed(1)}s
                            </span>
                          )}
                        </div>
                        <p className="text-sm mt-2">{message.message}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

