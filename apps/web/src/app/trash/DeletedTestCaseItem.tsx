"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trash2, Calendar, Mail, Phone } from "lucide-react";
import {
  restoreTestCase,
  permanentDeleteTestCase,
} from "../generate/test-case/action";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

export default function DeletedTestCaseItem({
  testCase,
}: {
  testCase: DeletedTestCase;
}) {
  const router = useRouter();
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await restoreTestCase(testCase.id);
      router.refresh();
    } catch (error) {
      console.error("Failed to restore test case:", error);
    } finally {
      setIsRestoring(false);
    }
  };

  const handlePermanentDelete = async () => {
    setIsDeleting(true);
    try {
      await permanentDeleteTestCase(testCase.id);
      router.refresh();
    } catch (error) {
      console.error("Failed to permanently delete test case:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Unknown";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTimeAgo = (date: Date | null) => {
    if (!date) return "";
    const now = new Date();
    const deletedDate = new Date(date);
    const diffInMs = now.getTime() - deletedDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "today";
    if (diffInDays === 1) return "1 day ago";
    return `${diffInDays} days ago`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow border-destructive/20 bg-destructive/5">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium text-base truncate">
                {testCase.name || "Untitled Test Case"}
              </h3>
              {testCase.kindOfTestCases && (
                <Badge variant="outline" className="text-xs">
                  {testCase.kindOfTestCases}
                </Badge>
              )}
            </div>

            {testCase.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {testCase.description}
              </p>
            )}

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {testCase.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span className="truncate max-w-[200px]">{testCase.email}</span>
                </div>
              )}
              {testCase.testPhoneNumber && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span>{testCase.testPhoneNumber}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  Deleted {getTimeAgo(testCase.deletedAt)} on{" "}
                  {formatDate(testCase.deletedAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRestore}
              disabled={isRestoring || isDeleting}
              className="border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700 dark:border-green-500 dark:text-green-500 dark:hover:bg-green-950"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              {isRestoring ? "Restoring..." : "Restore"}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isRestoring || isDeleting}
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Forever
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    test case "{testCase.name || "Untitled"}" and all of its sub-tests
                    from the database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handlePermanentDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Deleting..." : "Delete Forever"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
