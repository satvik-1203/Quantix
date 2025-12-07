import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateForm from "./CreateForm";

interface Props {}

const page: React.FC<Props> = () => {
  return (
    <div className="px-4 sm:px-8 py-6 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/csv-generate">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to CSV generator</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Create a CSV dataset
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Describe the dataset you want, define the column headers, preview a
          few rows, and then generate a full CSV ready for download.
        </p>
      </div>

      <div className="w-full">
        <CreateForm />
      </div>
    </div>
  );
};

export default page;
