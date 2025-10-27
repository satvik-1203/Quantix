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
                    <CallItem key={call.id} call={call} />
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
                      onClick={() => {
                        setSelectedEmail(email);
                        setEmailSheetOpen(true);
                      }}
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
      <Sheet open={emailSheetOpen} onOpenChange={setEmailSheetOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Email Details</SheetTitle>
          </SheetHeader>
          {selectedEmail && (
            <div className="p-4 space-y-5 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    className={getEmailStatusBadgeClass(selectedEmail.status)}
                  >
                    {selectedEmail.status}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {selectedEmail.createdAt
                    ? new Date(selectedEmail.createdAt).toLocaleString()
                    : ""}
                </span>
              </div>

              {selectedEmail.metadata?.threadId && (
                <div>
                  <p className="text-xs text-muted-foreground">Thread</p>
                  <p className="font-mono break-all">
                    {selectedEmail.metadata.threadId}
                  </p>
                </div>
              )}

              {selectedEmail.metadata?.messageData && (
                <div className="space-y-4">
                  {typeof selectedEmail.metadata.messageData.succeeded ===
                    "boolean" && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Succeeded
                      </span>
                      <span className="font-medium">
                        {selectedEmail.metadata.messageData.succeeded
                          ? "Yes"
                          : "No"}
                      </span>
                    </div>
                  )}

                  {selectedEmail.metadata.messageData.summary && (
                    <div>
                      <p className="text-xs text-muted-foreground">Summary</p>
                      <p className="leading-relaxed">
                        {selectedEmail.metadata.messageData.summary}
                      </p>
                    </div>
                  )}

                  {selectedEmail.metadata.messageData.divergenceExplanation && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Divergence
                      </p>
                      <p className="leading-relaxed">
                        {
                          selectedEmail.metadata.messageData
                            .divergenceExplanation
                        }
                      </p>
                    </div>
                  )}

                  {selectedEmail.metadata.messageData.suggestedFix && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Suggested Fix
                      </p>
                      <p className="leading-relaxed">
                        {selectedEmail.metadata.messageData.suggestedFix}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}
