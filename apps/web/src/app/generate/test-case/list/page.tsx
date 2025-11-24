import { getAllTestCases } from "../action";
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
import TestCaseItem from "./TestCaseItem";

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

export default async function TestCasesPage({
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
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 rounded-xl border bg-gradient-to-b from-muted/40 to-background p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Test Cases
              </h1>
              <p className="text-muted-foreground mt-2">
                Create, search, and manage voice bot test suites
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="secondary" className="h-7 px-3 text-sm">
                {count}
              </Badge>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-7 px-3 text-[11px]"
              >
                <Link href="/generate/test-case/analytics">View Analytics</Link>
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <form className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full items-center gap-3">
                <Input
                  name="q"
                  defaultValue={query}
                  placeholder="Search by name, description, or email"
                  className="w-full"
                />
                <select
                  name="sort"
                  defaultValue={sort}
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="recent">Newest</option>
                  <option value="updated">Recently Updated</option>
                  <option value="name">Name (A–Z)</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit" variant="default">
                  Apply
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/generate/test-case/list">Reset</Link>
                </Button>
                <Button asChild>
                  <Link href="/generate/test-case">New Test</Link>
                </Button>
              </div>
            </form>
          </div>
        </div>

        {count === 0 ? (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>No test cases yet</CardTitle>
              <CardDescription>
                Create your first test case to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button asChild>
                <Link href="/generate/test-case">Create Test Case</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sorted.map((testCase: TestCase) => (
              <TestCaseItem key={testCase.id} testCase={testCase} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
