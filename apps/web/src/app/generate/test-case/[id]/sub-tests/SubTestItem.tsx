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

interface SubTest {
  id: number;
  name: string | null;
  description: string | null;
  testCaseId: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  expected: string | null;
}

export default function SubTestItem({ subTest }: { subTest: SubTest }) {
  const callSubTest = async (subTestId: number) => {
    // await callSubTest(subTestId);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/call-subtest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subTestId }),
      });
      toast.success("Sub-test called successfully");
    } catch (error) {
      toast.error("Failed to call sub-test");
    }
  };

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
    </Card>
  );
}
