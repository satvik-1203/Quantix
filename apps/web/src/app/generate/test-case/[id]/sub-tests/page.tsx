import { getSubTestsByTestCaseId, getTestCaseById } from "../../action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SubTestItem from "./SubTestItem";
import GenerateSubTestsButton from "./GenerateSubTestsButton";
import CreateSubTestDialog from "./CreateSubTestDialog";
import TestCaseDetailsCard from "./TestCaseDetailsCard";

type SubTest = {
  id: number;
  name: string | null;
  description: string | null;
  testCaseId: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  expected: string | null;
};

export default async function SubTestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const testCaseId = Number.parseInt(id, 10);
  const [subTests, testCase] = await Promise.all([
    getSubTestsByTestCaseId(testCaseId),
    getTestCaseById(testCaseId),
  ]);

  if (!testCase) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Test Case Not Found</h1>
          <Link href="/generate/test-case/list">
            <Button>Back to Test Cases</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>
            <h1 className="text-xl font-semibold">
              {testCase.name || "Untitled Test Case"}
            </h1>
          </div>
          <div className="flex gap-2">
            <GenerateSubTestsButton testCaseId={testCaseId} />
            <CreateSubTestDialog testCaseId={testCaseId} />
          </div>
        </div>

        {/* Test Case Info Card */}
        <TestCaseDetailsCard testCase={testCase} />

        {/* Sub-Tests Section */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold">
            Sub-Tests <span className="text-sm text-muted-foreground font-normal">({subTests.length})</span>
          </h2>
        </div>

        {/* List */}
        {subTests.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <CardTitle className="text-base mb-2">No sub-tests yet</CardTitle>
                <CardDescription className="mb-4">
                  Generate AI sub-tests or create one manually.
                </CardDescription>
                <div className="flex items-center justify-center gap-2">
                  <GenerateSubTestsButton testCaseId={testCaseId} />
                  <CreateSubTestDialog testCaseId={testCaseId} />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {subTests.map((subTest: SubTest) => (
              <SubTestItem key={subTest.id} subTest={subTest} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
