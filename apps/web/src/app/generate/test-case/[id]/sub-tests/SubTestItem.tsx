"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import CallItem from "./CallItem";
import { ChevronDown, ChevronRight } from "lucide-react";

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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex flex-1  justify-between items-start">
            <div>
              <CardTitle className="text-xl">
                {subTest.name || "Untitled Sub-Test"}
              </CardTitle>
              <CardDescription>
                Created: {subTest.createdAt?.toLocaleDateString()}
                {subTest.updatedAt &&
                  subTest.updatedAt !== subTest.createdAt && (
                    <span className="ml-2">
                      • Updated: {subTest.updatedAt.toLocaleDateString()}
                    </span>
                  )}
              </CardDescription>
            </div>
            <div>
              <Button
                className="cursor-pointer"
                onClick={() => callSubTest(subTest.id)}
              >
                Call Sub-Test
              </Button>
            </div>
          </div>
        </div>
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
    </Card>
  );
}
