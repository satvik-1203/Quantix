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

type SubTest = {
  id: number;
  name: string | null;
  description: string | null;
  testCaseId: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  expected: string | null;
};
import GenerateSubTestsButton from "./GenerateSubTestsButton";
import CreateSubTestDialog from "./CreateSubTestDialog";

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
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/generate/test-case/list">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Test Cases
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              Sub-Tests for "{testCase.name}"
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage sub-tests for this test case
            </p>
          </div>
        </div>

        {/* Test Case Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Case Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                  Description
                </h4>
                <p className="text-sm">{testCase.description}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                  Kind of Test Cases
                </h4>
                <p className="text-sm">{testCase.kindOfTestCases}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                  Test Phone Number
                </h4>
                <p className="text-sm">{testCase.testPhoneNumber}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                  Created
                </h4>
                <p className="text-sm">
                  {testCase.createdAt?.toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sub-Tests Section */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">
                Sub-Tests ({subTests.length})
              </h2>
              <p className="text-muted-foreground">
                Individual test scenarios for this test case
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <GenerateSubTestsButton testCaseId={testCaseId} />
          </div>
        </div>

        <div className="mb-6 flex justify-end">
          <CreateSubTestDialog testCaseId={testCaseId} />
        </div>

        {subTests.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold mb-2">No sub-tests yet</h3>
                <p className="text-muted-foreground mb-4">
                  No sub-tests have been created for this test case yet.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {subTests.map((subTest: SubTest) => (
              <SubTestItem key={subTest.id} subTest={subTest} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
