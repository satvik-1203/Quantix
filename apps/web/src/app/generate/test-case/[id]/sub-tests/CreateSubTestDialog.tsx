"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CreateSubTestForm from "./CreateSubTestForm";

interface Props {
  testCaseId: number;
}

export default function CreateSubTestDialog({ testCaseId }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Add Sub-Test
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Sub-Test</DialogTitle>
          <DialogDescription>
            Add a new scenario manually for this test case.
          </DialogDescription>
        </DialogHeader>
        <CreateSubTestForm
          testCaseId={testCaseId}
          onCreated={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
