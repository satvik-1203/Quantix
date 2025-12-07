"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PencilLine } from "lucide-react";
import EditTestCaseForm from "./EditTestCaseForm";

interface TestCase {
  id: number;
  name: string | null;
  description: string | null;
  kindOfTestCases: string | null;
  testPhoneNumber: string | null;
  email: string | null;
  createdAt: Date | null;
}

export default function TestCaseDetailsCard({
  testCase,
}: {
  testCase: TestCase;
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Test Case Details</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              <PencilLine className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {testCase.description && (
              <div className="md:col-span-2">
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                  Description
                </h4>
                <p className="text-sm leading-relaxed">
                  {testCase.description}
                </p>
              </div>
            )}
            {testCase.kindOfTestCases && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                  Kind of Test Cases
                </h4>
                <p className="text-sm">{testCase.kindOfTestCases}</p>
              </div>
            )}
            {testCase.testPhoneNumber && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                  Test Phone Number
                </h4>
                <p className="text-sm font-mono">{testCase.testPhoneNumber}</p>
              </div>
            )}
            {testCase.email && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                  Email Address
                </h4>
                <p className="text-sm">{testCase.email}</p>
              </div>
            )}
            {testCase.createdAt && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                  Created
                </h4>
                <p className="text-sm">
                  {testCase.createdAt.toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Test Case</DialogTitle>
          </DialogHeader>
          <EditTestCaseForm
            testCase={testCase}
            onSaved={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

