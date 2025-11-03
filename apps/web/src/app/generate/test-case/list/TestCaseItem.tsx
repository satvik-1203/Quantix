"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateTestCase, deleteTestCase } from "../action";
import {
  Edit,
  Save,
  X,
  Trash2,
  Phone,
  Mail,
  Tag,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Test case name must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  kindOfTestCases: z.string().min(2, {
    message: "Please describe the kind of test cases you're looking for.",
  }),
  testPhoneNumber: z.string().regex(/^\+?[\d\s\-\(\)]{10,}$/, {
    message: "Please enter a valid phone number.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

interface TestCase {
  id: number;
  name: string | null;
  description: string | null;
  kindOfTestCases: string | null;
  testPhoneNumber: string | null;
  email: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export default function TestCaseItem({ testCase }: { testCase: TestCase }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: testCase.name || "",
      description: testCase.description || "",
      kindOfTestCases: testCase.kindOfTestCases || "",
      testPhoneNumber: testCase.testPhoneNumber || "",
      email: testCase.email || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await updateTestCase(testCase.id, values);
      setIsEditing(false);
      toast.success("Test case updated successfully!");
      window.location.reload(); // Simple refresh to show updated data
    } catch (error) {
      console.error("Failed to update test case:", error);
      toast.error("Failed to update test case");
    } finally {
      setIsLoading(false);
    }
  }

  const handleCancel = () => {
    form.reset({
      name: testCase.name || "",
      description: testCase.description || "",
      kindOfTestCases: testCase.kindOfTestCases || "",
      testPhoneNumber: testCase.testPhoneNumber || "",
      email: testCase.email || "",
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTestCase(testCase.id);
      setIsDeleteDialogOpen(false);
      toast.success("Test case deleted successfully!");
      window.location.reload(); // Simple refresh to update the list
    } catch (error) {
      console.error("Failed to delete test case:", error);
      toast.error("Failed to delete test case");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="group hover:bg-muted/50 transition-colors overflow-hidden">
      {!isEditing ? (
        <Link
          href={`/generate/test-case/${testCase.id}/sub-tests`}
          className="block cursor-pointer"
        >
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center gap-3 mb-1">
                  <CardTitle className="text-base font-medium line-clamp-1 break-words">
                    {testCase.name || "Untitled Test Case"}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditing(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsDeleteDialogOpen(true);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="text-xs">
                  {testCase.createdAt?.toLocaleDateString()}
                  {testCase.updatedAt &&
                    testCase.updatedAt !== testCase.createdAt && (
                      <span className="ml-2">
                        • Updated {testCase.updatedAt.toLocaleDateString()}
                      </span>
                    )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 overflow-hidden">
            <div className="space-y-2">
              {testCase.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 break-words">
                  {testCase.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {testCase.testPhoneNumber && (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Phone className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate max-w-[200px]">{testCase.testPhoneNumber}</span>
                  </div>
                )}
                {testCase.email && (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Mail className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate max-w-[200px]">{testCase.email}</span>
                  </div>
                )}
                {testCase.kindOfTestCases && (
                  <div className="flex items-center gap-1.5 min-w-0 max-w-full">
                    <Tag className="h-3 w-3 flex-shrink-0" />
                    <span className="break-words line-clamp-2">{testCase.kindOfTestCases}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Link>
      ) : (
        <>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0 overflow-hidden">
                <CardTitle className="text-base font-medium line-clamp-1 break-words">
                  {testCase.name || "Untitled Test Case"}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 overflow-hidden">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Case Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter test case name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voice Bot Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the voice bot you want to test..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="kindOfTestCases"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kind of Test Cases</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Functional testing, Performance testing, Edge cases..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="testPhoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="test@example.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Saving..." : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
          </CardContent>
        </>
      )}
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Test Case</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{testCase.name}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
