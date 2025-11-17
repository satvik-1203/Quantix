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

    // Show initial progress message
    const progressToast = toast.loading(
      "Generating test cases with AI... This may take 10-30 seconds."
    );

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
      const resp = await fetch(`${baseUrl}/api/generate-test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ testCaseId }),
      });

      if (resp.ok) {
        const data = await resp
          .json()
          .catch(() => ({ traceId: null as string | null }));
        const traceId = data?.traceId ?? null;

        toast.success("Sub-tests generated successfully!", {
          id: progressToast,
          action:
            traceId && typeof traceId === "string"
              ? {
                  label: "View RAG trace",
                  onClick: () => {
                    router.push(`/rag/trace/${traceId}`);
                  },
                }
              : undefined,
        });
        router.refresh();
      } else {
        const errorData = await resp
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.error || errorData.message || "Failed to generate sub-tests"
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate sub-tests. Please try again.";
      toast.error(errorMessage, { id: progressToast });
      console.error("Generate sub-tests error:", error);
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
