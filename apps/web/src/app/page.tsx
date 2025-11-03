import { getAllTestCases } from "./generate/test-case/action";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import TestCaseItem from "./generate/test-case/list/TestCaseItem";
import CreateTestCaseDialog from "@/components/CreateTestCaseDialog";
import { Search } from "lucide-react";

type TestCase = {
  id: number;
  name: string | null;
  description: string | null;
  kindOfTestCases: string | null;
  testPhoneNumber: string | null;
  email: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

type SearchParams = {
  q?: string;
  sort?: "recent" | "updated" | "name";
};

export default async function Home({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const params = searchParams ?? {};
  const query = (params.q ?? "").trim();
  const sort = (params.sort as SearchParams["sort"]) ?? "recent";

  const all = await getAllTestCases();

  const filtered = all.filter((t: TestCase) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      (t.name ?? "").toLowerCase().includes(q) ||
      (t.description ?? "").toLowerCase().includes(q) ||
      (t.kindOfTestCases ?? "").toLowerCase().includes(q) ||
      (t.email ?? "").toLowerCase().includes(q)
    );
  });

  const toDate = (d: unknown): number => {
    if (!d) return 0;
    const date = d instanceof Date ? d : new Date(String(d));
    return date.getTime() || 0;
  };

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "name") {
      return (a.name ?? "").localeCompare(b.name ?? "");
    }
    if (sort === "updated") {
      return toDate(b.updatedAt) - toDate(a.updatedAt);
    }
    return toDate(b.createdAt) - toDate(a.createdAt);
  });

  const count = sorted.length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Test Cases</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {count} {count === 1 ? "test case" : "test cases"}
            </p>
          </div>
          <CreateTestCaseDialog />
        </div>

        {/* Search and Filter */}
        <div className="mb-6">
          <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={query}
                placeholder="Search by name, description, or email..."
                className="w-full pl-9"
              />
            </div>
            <select
              name="sort"
              defaultValue={sort}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="recent">Newest First</option>
              <option value="updated">Recently Updated</option>
              <option value="name">Name (A–Z)</option>
            </select>
            <Button type="submit" variant="default" size="sm">
              Apply
            </Button>
            {query && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/">Clear</Link>
              </Button>
            )}
          </form>
        </div>

        {/* Test Cases List */}
        {count === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-12 pb-12">
              <div className="text-center max-w-md mx-auto">
                <CardTitle className="text-lg mb-2">No test cases yet</CardTitle>
                <CardDescription className="mb-6">
                  Create your first test case to get started.
                </CardDescription>
                <CreateTestCaseDialog>
                  <Button>Create Test Case</Button>
                </CreateTestCaseDialog>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {sorted.map((testCase: TestCase) => (
              <TestCaseItem key={testCase.id} testCase={testCase} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
