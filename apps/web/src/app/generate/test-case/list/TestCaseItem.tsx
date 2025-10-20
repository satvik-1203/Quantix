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
import { Edit, Save, X, Trash2, ChevronRight } from "lucide-react";
import Link from "next/link";

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
      window.location.reload(); // Simple refresh to show updated data
    } catch (error) {
      console.error("Failed to update test case:", error);
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
      window.location.reload(); // Simple refresh to update the list
    } catch (error) {
      console.error("Failed to delete test case:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{testCase.name}</CardTitle>
                <CardDescription>
                  Created: {testCase.createdAt?.toLocaleDateString()}
                  {testCase.updatedAt &&
                    testCase.updatedAt !== testCase.createdAt && (
                      <span className="ml-2">
                        • Updated: {testCase.updatedAt.toLocaleDateString()}
                      </span>
                    )}
                </CardDescription>
              </div>
              {!isEditing && (
                <Link
                  href={`/generate/test-case/${testCase.id}/sub-tests` as any}
                >
                  <Button variant="ghost" size="sm">
                    View Sub-Tests
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
          {!isEditing && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isDeleting}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Test Case</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete "{testCase.name}"? This
                      action cannot be undone.
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
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
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
        ) : (
          <div className="space-y-4">
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
                Email Address
              </h4>
              <p className="text-sm">{testCase.email}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
