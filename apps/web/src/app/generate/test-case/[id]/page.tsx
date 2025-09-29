import { getAllTestCases } from "../action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import TestCaseItem from "./TestCaseItem";

export default async function TestCasesPage({ params }: { params: { id: string } }) {
  const testCases = await getAllTestCases();

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Test Cases</h1>
            <p className="text-muted-foreground mt-2">
              Manage your voice bot test cases
            </p>
          </div>
          <Link href="/generate/test-case">
            <Button>New Test</Button>
          </Link>
        </div>

        {testCases.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold mb-2">No test cases yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first test case to get started
                </p>
                <Link href="/generate/test-case">
                  <Button>Create Test Case</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {testCases.map((testCase) => (
              <TestCaseItem key={testCase.id} testCase={testCase} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}