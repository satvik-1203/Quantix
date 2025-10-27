"use client";
import { useTransition } from "react";
import { updateSubTest } from "./actions";
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
import { updateSubTestSchema, type UpdateSubTestInput } from "./schema";

interface Props {
  subTest: {
    id: number;
    testCaseId: number;
    name: string | null;
    description: string | null;
    expected: string | null;
  };
  onSaved?: () => void;
}

export default function EditSubTestForm({ subTest, onSaved }: Props) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateSubTestInput>({
    resolver: zodResolver(updateSubTestSchema),
    defaultValues: {
      id: subTest.id,
      testCaseId: subTest.testCaseId,
      name: subTest.name || "",
      description: subTest.description || "",
      expected: subTest.expected || "",
    },
    mode: "onChange",
  });

  const onSubmit = (values: UpdateSubTestInput) => {
    const fd = new FormData();
    fd.set("id", String(values.id));
    fd.set("testCaseId", String(values.testCaseId));
    fd.set("name", values.name || "");
    fd.set("description", values.description || "");
    fd.set("expected", values.expected || "");

    startTransition(async () => {
      try {
        await updateSubTest(fd);
        toast.success("Sub-test updated");
        onSaved?.();
      } catch (err: any) {
        const message = err?.message || "Failed to update sub-test";
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
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
