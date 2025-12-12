"use client";
import { useTransition } from "react";
import { updateTestCase } from "../../action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import * as z from "zod";
import { useRouter } from "next/navigation";

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

type FormValues = z.infer<typeof formSchema>;

interface Props {
  testCase: {
    id: number;
    name: string | null;
    description: string | null;
    kindOfTestCases: string | null;
    testPhoneNumber: string | null;
    email: string | null;
  };
  onSaved?: () => void;
}

export default function EditTestCaseForm({ testCase, onSaved }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: testCase.name || "",
      description: testCase.description || "",
      kindOfTestCases: testCase.kindOfTestCases || "",
      testPhoneNumber: testCase.testPhoneNumber || "",
      email: testCase.email || "",
    },
    mode: "onChange",
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        await updateTestCase(testCase.id, values);
        toast.success("Test case updated successfully");
        onSaved?.();
        router.refresh();
      } catch (err: any) {
        const message = err?.message || "Failed to update test case";
        toast.error(message);
      }
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Test case name" {...field} />
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Description"
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
                <Textarea
                  placeholder="Kind of test cases"
                  className="min-h-[80px]"
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
                <Input placeholder="+1234567890" {...field} />
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
                <Input type="email" placeholder="email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            disabled={!form.formState.isValid || isPending}
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}




