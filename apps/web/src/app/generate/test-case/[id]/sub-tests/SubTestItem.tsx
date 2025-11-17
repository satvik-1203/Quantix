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
