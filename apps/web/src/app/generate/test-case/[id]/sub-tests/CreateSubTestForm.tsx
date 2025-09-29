"use client";
import { useTransition } from "react";
import { createSubTest } from "./actions";
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
import { createSubTestSchema, type CreateSubTestInput } from "./schema";

interface Props {
  testCaseId: number;
  onCreated?: () => void;
}

export default function CreateSubTestForm({ testCaseId, onCreated }: Props) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateSubTestInput>({
    resolver: zodResolver(createSubTestSchema),
    defaultValues: {
      testCaseId,
      name: "",
      description: "",
      expected: "",
    },
    mode: "onChange",
  });

  const onSubmit = (values: CreateSubTestInput) => {
    const fd = new FormData();
    fd.set("name", values.name || "");
    fd.set("description", values.description || "");
    fd.set("expected", values.expected || "");
    fd.set("testCaseId", String(values.testCaseId));

    startTransition(async () => {
      try {
        await createSubTest(fd);
        form.reset({ testCaseId, name: "", description: "", expected: "" });
        toast.success("Sub-test created");
        onCreated?.();
      } catch (err: any) {
        const message = err?.message || "Failed to create sub-test";
        toast.error(message);
      }
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-3"
        noValidate
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Title (optional)" {...field} />
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
                <Textarea placeholder="Description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="expected"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected Result</FormLabel>
              <FormControl>
                <Textarea placeholder="Expected Result" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={!form.formState.isValid || isPending}>
            {isPending ? "Saving..." : "Add Sub-Test"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
