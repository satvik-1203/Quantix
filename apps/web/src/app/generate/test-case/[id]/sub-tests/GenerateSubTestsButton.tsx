"use client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

interface Props {
  testCaseId: number;
}

const GenerateSubTestsButton: React.FC<Props> = ({ testCaseId }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateSubTests = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/generate-test`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: testCaseId }),
        }
      );

      if (resp.ok) {
        toast.success("Sub-tests generated successfully!");
      } else {
        throw new Error("Failed to generate sub-tests");
      }
    } catch (error) {
      toast.error("Failed to generate sub-tests. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleGenerateSubTests} disabled={isLoading}>
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      Generate Sub-Tests
    </Button>
  );
};

export default GenerateSubTestsButton;
