import React from "react";
import NewCsv from "./components/NewCsv";

interface Props {}

const page: React.FC<Props> = () => {
  return (
    <div className="px-4 sm:px-8 py-8 w-full max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            CSV Generator
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Describe the data you want, define the columns, and let the AI
            generate a CSV you can download and plug into your workflows.
          </p>
        </div>
        <NewCsv />
      </div>

      <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-6 sm:px-6">
        <h2 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          How it works
        </h2>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li>
            <span className="font-semibold text-foreground">1.</span> Start a
            new CSV and write a short prompt describing the dataset you need.
          </li>
          <li>
            <span className="font-semibold text-foreground">2.</span> Define or
            generate the column headers for your CSV.
          </li>
          <li>
            <span className="font-semibold text-foreground">3.</span> Preview a
            sample, then generate and download the full CSV.
          </li>
        </ol>
      </div>
    </div>
  );
};

export default page;
