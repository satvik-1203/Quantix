"use client";

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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createTestCase } from "./action";

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
});

export default function TestCaseGeneratorPage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      kindOfTestCases: "",
      testPhoneNumber: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    // TODO: Handle form submission
    createTestCase(values);
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Test Case Generator</CardTitle>
            <CardDescription>
              Generate test cases with specific distributions and parameters for
              your voice bot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Case Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter test case name" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for your test case scenario.
                      </FormDescription>
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
                      <FormDescription>
                        Provide details about the voice bot's purpose,
                        functionality, and expected behavior.
                      </FormDescription>
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
                      <FormDescription>
                        Describe the type of test cases you're looking for.
                      </FormDescription>
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
                      <FormDescription>
                        Phone number to use for testing the voice bot
                        interactions.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  Generate Test Cases
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
