import { getDeletedTestCases } from "../generate/test-case/action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import DeletedTestCaseItem from "./DeletedTestCaseItem";
import { Trash2, ArrowLeft } from "lucide-react";

type DeletedTestCase = {
  id: number;
  name: string | null;
  description: string | null;
  kindOfTestCases: string | null;
  testPhoneNumber: string | null;
  email: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  deletedAt: Date | null;
};

export default async function TrashPage() {
  const deletedTestCases = await getDeletedTestCases();
  const count = deletedTestCases.length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Test Cases
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Trash</h1>
              <p className="text-sm text-muted-foreground">
                {count} {count === 1 ? "item" : "items"} in trash
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-900">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-orange-900 dark:text-orange-100">
              Items in trash are hidden from your main test case list. You can
              restore them or delete them permanently.
            </p>
          </CardContent>
        </Card>

        {/* Deleted Test Cases List */}
        {count === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-12 pb-12">
              <div className="text-center max-w-md mx-auto">
                <Trash2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="text-lg mb-2">Trash is empty</CardTitle>
                <CardDescription className="mb-6">
                  Deleted test cases will appear here. You can restore them within
                  30 days before they are permanently deleted.
                </CardDescription>
                <Button asChild variant="outline">
                  <Link href="/">Go to Test Cases</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {deletedTestCases.map((testCase: DeletedTestCase) => (
              <DeletedTestCaseItem key={testCase.id} testCase={testCase} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
