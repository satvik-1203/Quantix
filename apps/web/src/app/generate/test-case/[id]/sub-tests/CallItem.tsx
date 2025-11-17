"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { PhoneCallEvaluationDisplay } from "./PhoneCallEvaluationDisplay";
import { CheckCircle2, XCircle, FileText, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Judgment {
  succeeded: boolean;
  explanation?: string;
  divergenceExplanation?: string;
  suggestedFix?: string;
  conversationQuality?: "excellent" | "good" | "fair" | "poor";
  callDurationAppropriate?: boolean;
}

interface CallEvaluation {
  status: "SUCCESS" | "FAILED" | "PENDING";
  judgment?: Judgment;
  evaluatedAt?: Date;
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
  evaluation?: CallEvaluation | null;
}

interface CallItemProps {
  call: Call;
  subTestId: number;
  onCallDeleted?: () => void;
}

export default function CallItem({
  call,
  subTestId,
  onCallDeleted,
}: CallItemProps) {
  const [showTranscriptDialog, setShowTranscriptDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-500/15 text-green-400 border border-green-500/30";
      case "failed":
        return "bg-red-500/15 text-red-400 border border-red-500/30";
      case "in-progress":
        return "bg-blue-500/15 text-blue-400 border border-blue-500/30";
      default:
        return "bg-foreground/10 text-foreground/80 border border-foreground/20";
    }
  };

  const formatCost = (cost?: number) => {
    if (!cost) return "N/A";
    return `$${cost.toFixed(4)}`;
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

      const response = await fetch(
        `${apiUrl}/api/call-subtest/delete/${call.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete call");
      }

      toast.success("Call deleted successfully");
      setShowDeleteDialog(false);

      // Refresh the calls list
      if (onCallDeleted) {
        onCallDeleted();
      }
    } catch (error) {
      console.error("Error deleting call:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete call"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="mb-3">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium">
            Call {call.id.slice(0, 8)}...
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(call.status)}>{call.status}</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              title="Delete call"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Started</p>
            <p className="font-medium">
              {formatDistanceToNow(new Date(call.startedAt), {
                addSuffix: true,
              })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Cost</p>
            <p className="font-medium">{formatCost(call.cost)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Phone</p>
            <p className="font-medium">{call.customer?.number || "N/A"}</p>
          </div>
        </div>

        {call.summary && (
          <div className="mt-3 pt-3 border-t border-border/60">
            <p className="text-muted-foreground text-xs mb-1">Summary</p>
            <p className="text-sm leading-relaxed">{call.summary}</p>
          </div>
        )}

        {call.transcript && (
          <div className="mt-3 pt-3 border-t border-border/60">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTranscriptDialog(true)}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              View Full Transcript
            </Button>
          </div>
        )}

        {/* Evaluation Results - Display inline if available */}
        {call.evaluation?.judgment &&
          call.evaluation.judgment.explanation &&
          typeof call.evaluation.judgment.succeeded === "boolean" && (
            <div className="mt-3 pt-3 border-t border-border/60 space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Evaluation Results</h3>
                <PhoneCallEvaluationDisplay
                  callId={call.id}
                  subTestId={subTestId}
                  onEvaluationComplete={() => {
                    if (onCallDeleted) {
                      onCallDeleted();
                    }
                  }}
                />
              </div>

              {/* Success Status */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm font-medium">Result</span>
                <div className="flex items-center gap-2">
                  {call.evaluation.judgment.succeeded ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium">
                    {call.evaluation.judgment.succeeded ? "Passed" : "Failed"}
                  </span>
                </div>
              </div>

              {/* Explanation */}
              {call.evaluation.judgment.explanation && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Summary
                  </label>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm leading-relaxed">
                      {call.evaluation.judgment.explanation}
                    </p>
                  </div>
                </div>
              )}

              {/* Divergence Explanation - Only show if failed */}
              {!call.evaluation.judgment.succeeded &&
                call.evaluation.judgment.divergenceExplanation &&
                call.evaluation.judgment.divergenceExplanation !== "None" && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Where It Went Wrong
                    </label>
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <p className="text-sm leading-relaxed">
                        {call.evaluation.judgment.divergenceExplanation}
                      </p>
                    </div>
                  </div>
                )}

              {/* Suggested Fix - Only show if failed */}
              {!call.evaluation.judgment.succeeded &&
                call.evaluation.judgment.suggestedFix &&
                call.evaluation.judgment.suggestedFix !== "None" && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Suggested Fix
                    </label>
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-sm leading-relaxed">
                        {call.evaluation.judgment.suggestedFix}
                      </p>
                    </div>
                  </div>
                )}
            </div>
          )}

        {/* Evaluate Call Button - Only show for completed calls WITHOUT evaluation */}
        {call.status === "ended" &&
          (!call.evaluation?.judgment ||
            !call.evaluation.judgment.explanation ||
            typeof call.evaluation.judgment.succeeded !== "boolean") && (
            <div className="mt-3 pt-3 border-t border-border/60">
              <PhoneCallEvaluationDisplay
                callId={call.id}
                subTestId={subTestId}
                onEvaluationComplete={() => {
                  // Refresh the calls list to show the new evaluation
                  if (onCallDeleted) {
                    onCallDeleted();
                  }
                }}
              />
            </div>
          )}
      </CardContent>

      {/* Transcript Dialog */}
      <Dialog
        open={showTranscriptDialog}
        onOpenChange={setShowTranscriptDialog}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Call Transcript</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <div className="text-sm text-muted-foreground">
              Call ID: {call.id.slice(0, 16)}...
            </div>
            <div className="bg-muted/30 p-4 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap leading-relaxed font-sans">
                {call.transcript}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Call?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this call? This will remove the
              call record and evaluation data from the database.
            </p>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground mb-1">Call ID</p>
              <p className="text-xs font-mono break-all">{call.id}</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
