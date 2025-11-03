"use client";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props extends React.ComponentProps<typeof Button> {
  testCaseId: number;
}

const GenerateSubTestsButton: React.FC<Props> = ({
  testCaseId,
  ...buttonProps
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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
        router.refresh();
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
    <Button
      onClick={handleGenerateSubTests}
      disabled={isLoading}
      size="sm"
      {...buttonProps}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Wand2 className="h-4 w-4 mr-2" />
      )}
      Generate Sub-Tests
    </Button>
  );
};

export default GenerateSubTestsButton;
