"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Sparkles, FileSpreadsheet, Download } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  generateCsvHeaders,
  generateCsvSample,
  generateMainCsv,
} from "../action";

interface Props {}

type SampleRow = Record<string, string>;

// Temporary hard-coded data for testing so you don't need to click generate.
// Sourced from apps/web/csv-debug/csv-main-2025-12-03T21-21-19-717Z.json
const MOCK_PROMPT =
  "- Create customer-receptionist email chats where the customer is requesting to book a venue for a party reservation.";

const MOCK_HEADERS: string[] = [
  "thead_id",
  "email",
  "subject",
  "body",
  "from",
  "to",
  "cc",
  "bcc",
  "date",
];

const MOCK_ROWS: SampleRow[] = [
  {
    thead_id: "1001",
    email: "jane.doe@email.com",
    subject: "Party Reservation Inquiry",
    body: "Hi, I'd like to book a venue for a birthday party on July 15th. Is that date available?",
    from: "Jane Doe",
    to: "reception@eventspace.com",
    cc: "",
    bcc: "",
    date: "2024-06-01",
  },
  {
    thead_id: "1002",
    email: "michael.smith@email.com",
    subject: "Venue Booking Request",
    body: "Hello, I want to reserve your hall for a graduation party next Saturday. Please let me know the process.",
    from: "Michael Smith",
    to: "reception@eventspace.com",
    cc: "",
    bcc: "",
    date: "2024-06-02",
  },
  {
    thead_id: "1003",
    email: "lisa.m@email.com",
    subject: "Availability for Engagement Party",
    body: "Hi, is your main room free for an engagement party on August 10th?",
    from: "Lisa Martin",
    to: "reception@eventspace.com",
    cc: "",
    bcc: "",
    date: "2024-06-03",
  },
  {
    thead_id: "1004",
    email: "daniel.lee@email.com",
    subject: "Request to Book Venue",
    body: "Good morning, I am interested in booking a space for a family reunion on July 28th. What are the rates?",
    from: "Daniel Lee",
    to: "reception@eventspace.com",
    cc: "",
    bcc: "",
    date: "2024-06-04",
  },
  {
    thead_id: "1005",
    email: "emily.harris@email.com",
    subject: "Birthday Party Reservation",
    body: "Hello, can I reserve your venue for a birthday party for about 30 guests on June 20th?",
    from: "Emily Harris",
    to: "reception@eventspace.com",
    cc: "",
    bcc: "",
    date: "2024-06-05",
  },
  {
    thead_id: "1006",
    email: "robert.jones@email.com",
    subject: "Booking Inquiry for Party",
    body: "Hi, I would like to know if your venue is available for a party on July 22nd. Please advise.",
    from: "Robert Jones",
    to: "reception@eventspace.com",
    cc: "",
    bcc: "",
    date: "2024-06-06",
  },
  {
    thead_id: "1007",
    email: "sophia.wang@email.com",
    subject: "Venue Booking for Kids Party",
    body: "Good afternoon, do you have availability for a kids party on June 25th?",
    from: "Sophia Wang",
    to: "reception@eventspace.com",
    cc: "",
    bcc: "",
    date: "2024-06-07",
  },
  {
    thead_id: "1008",
    email: "andrew.kim@email.com",
    subject: "Reserve Venue for Party",
    body: "Hello, I am planning a surprise party for my friend and would like to book your venue on July 5th.",
    from: "Andrew Kim",
    to: "reception@eventspace.com",
    cc: "",
    bcc: "",
    date: "2024-06-08",
  },
  {
    thead_id: "1009",
    email: "natalie.brown@email.com",
    subject: "Party Hall Reservation",
    body: "Hi, is your party hall available on August 2nd for an anniversary celebration?",
    from: "Natalie Brown",
    to: "reception@eventspace.com",
    cc: "",
    bcc: "",
    date: "2024-06-09",
  },
  {
    thead_id: "1010",
    email: "david.hernandez@email.com",
    subject: "Request to Reserve Venue",
    body: "Good day, I would like to reserve your venue for a small party on July 18th. Please confirm.",
    from: "David Hernandez",
    to: "reception@eventspace.com",
    cc: "",
    bcc: "",
    date: "2024-06-10",
  },
  {
    thead_id: "1011",
    email: "amanda.clark@email.com",
    subject: "Booking for Birthday Event",
    body: "Hello, can you let me know if I can book your venue for a birthday event on June 30th?",
    from: "Amanda Clark",
    to: "reception@eventspace.com",
    cc: "",
    bcc: "",
    date: "2024-06-11",
  },
  {
    thead_id: "1012",
    email: "kevin.morris@email.com",
    subject: "Venue Reservation Request",
    body: "Hi, I am interested in booking your event space for a party on July 8th.",
    from: "Kevin Morris",
    to: "reception@eventspace.com",
    cc: "",
    bcc: "",
    date: "2024-06-12",
  },
  {
    thead_id: "1013",
    email: "laura.evans@email.com",
    subject: "Party Space Booking",
    body: "Good morning, is your party space available for a gathering on August 12th?",
    from: "Laura Evans",
    to: "reception@eventspace.com",
    cc: "",
    bcc: "",
    date: "2024-06-13",
  },
  {
    thead_id: "1014",
    email: "brian.taylor@email.com",
    subject: "Inquiry: Venue for Party",
    body: "Hello, I would like to book your venue for a party on July 25th. Please share details.",
    from: "Brian Taylor",
    to: "reception@eventspace.com",
    cc: "",
    bcc: "",
    date: "2024-06-14",
  },
  {
    thead_id: "1015",
    email: "olivia.martin@email.com",
    subject: "Booking Request for Party",
    body: "Hi, can I reserve your hall for a birthday party on June 28th?",
    from: "Olivia Martin",
    to: "reception@eventspace.com",
    cc: "",
    bcc: "",
    date: "2024-06-15",
  },
  {
    thead_id: "1016",
    email: "ethan.jackson@email.com",
    subject: "Venue Booking for Celebration",
    body: "Good afternoon, I am hoping to book your venue for a celebration on July 12th.",
    from: "Ethan Jackson",
    to: "reception@eventspace.com",
    cc: "",
    bcc: "",
    date: "2024-06-16",
  },
  {
    thead_id: "1017",
    email: "mia.rodriguez@email.com",
    subject: "Reserve Venue for Birthday",
    body: "Hello, is your venue available for a birthday party on August 5th?",
    from: "Mia Rodriguez",
    to: "reception@eventspace.com",
    cc: "",
    bcc: "",
    date: "2024-06-17",
  },
  {
    thead_id: "1018",
    email: "jacob.wilson@email.com",
    subject: "Party Reservation Inquiry",
    body: "Hi, I want to reserve your space for a party on July 20th. Please let me know if it's available.",
    from: "Jacob Wilson",
    to: "reception@eventspace.com",
    cc: "",
    bcc: "",
    date: "2024-06-18",
  },
  {
    thead_id: "1019",
    email: "ava.thomas@email.com",
    subject: "Venue Inquiry for Party",
    body: "Good morning, can I book your venue for a family party on June 22nd?",
    from: "Ava Thomas",
    to: "reception@eventspace.com",
    cc: "",
    bcc: "",
    date: "2024-06-19",
  },
  {
    thead_id: "1020",
    email: "william.moore@email.com",
    subject: "Booking Venue for Event",
    body: "Hello, I am interested in booking your venue for a party on July 29th. Please provide details.",
    from: "William Moore",
    to: "reception@eventspace.com",
    cc: "",
    bcc: "",
    date: "2024-06-20",
  },
];

const CreateForm: React.FC<Props> = () => {
  const [prompt, setPrompt] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [newHeader, setNewHeader] = useState("");
  const [shapeDescription, setShapeDescription] = useState("");
  const [rowCount, setRowCount] = useState(20);
  const [isGeneratingShape, setIsGeneratingShape] = useState(false);
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const [sampleRows, setSampleRows] = useState<SampleRow[]>([]);
  const [isGeneratingMain, setIsGeneratingMain] = useState(false);
  const [mainCsv, setMainCsv] = useState<string | null>(null);
  const [mainRows, setMainRows] = useState<SampleRow[] | null>(null);
  const [activeView, setActiveView] = useState<"sample" | "generated" | null>(
    null
  );

  const handleLoadExample = () => {
    setPrompt(MOCK_PROMPT);
    setHeaders(MOCK_HEADERS);
    setSampleRows([]);
    setMainCsv(null);
    setMainRows(null);
    setRowCount(20);
    setActiveView(null);
  };

  const addHeader = () => {
    if (newHeader.trim() && !headers.includes(newHeader.trim())) {
      setHeaders([...headers, newHeader.trim()]);
      setNewHeader("");
    }
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addHeader();
    }
  };

  const handleGenerateShape = async () => {
    if (!shapeDescription.trim()) {
      return;
    }

    setIsGeneratingShape(true);
    try {
      const generatedHeaders = await generateCsvHeaders(
        shapeDescription,
        headers
      );
      setHeaders(generatedHeaders);
      setShapeDescription("");
      setShowAiGenerator(false);
    } catch (error) {
      console.error("Failed to generate headers:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate CSV headers. Please try again.",
        {
          description: "Make sure your description is clear and try again.",
        }
      );
    } finally {
      setIsGeneratingShape(false);
    }
  };

  const handleSampleGenerate = async () => {
    if (!headers.length) {
      toast.error("Add at least one column header before generating a sample.", {
        description: "Please add column headers in Step 2 above.",
      });
      return;
    }

    setIsGeneratingSample(true);
    try {
      const result = await generateCsvSample({
        description: prompt,
        headers,
        rowCount,
      });

      setSampleRows(result.rows || []);
      // Clear any previously generated full CSV when the sample changes
      setMainCsv(null);
      setMainRows(null);
      setActiveView("sample");
    } catch (error) {
      console.error("Failed to generate sample CSV:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate sample CSV. Please try again.",
        {
          description: "Check your prompt and headers, then try again.",
        }
      );
    } finally {
      setIsGeneratingSample(false);
    }
  };

  const handleGenerateMainCsv = async () => {
    if (!headers.length) {
      toast.error(
        "Add at least one column header before generating the full CSV.",
        {
          description: "Please add column headers in Step 2 above.",
        }
      );
      return;
    }

    setIsGeneratingMain(true);
    try {
      const result = await generateMainCsv({
        description: prompt,
        headers,
        rowCount,
      });

      setMainCsv(result.csv);
      setMainRows(result.rows || null);
      setActiveView("generated");

      // Optionally you could trigger a download here.
      // For now, surface a simple message and log details for debugging.
      if (result.debugFilePath) {
        console.log(
          "[CreateForm] Main CSV generated. Debug JSON written to:",
          result.debugFilePath
        );
      } else {
        console.log("[CreateForm] Main CSV generated (no debug file path).");
      }
    } catch (error) {
      console.error("Failed to generate main CSV:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate main CSV. Please try again.",
        {
          description: "Check your prompt and headers, then try again.",
        }
      );
    } finally {
      setIsGeneratingMain(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!mainCsv) return;

    const blob = new Blob([mainCsv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `generated-csv-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const hasSample = sampleRows.length > 0;
  const hasGenerated = !!(mainRows && mainRows.length > 0);
  const resolvedActiveView: "sample" | "generated" | null =
    activeView ?? (hasGenerated ? "generated" : hasSample ? "sample" : null);
  const showSample = hasSample && resolvedActiveView === "sample";
  const showGenerated = hasGenerated && resolvedActiveView === "generated";

  return (
    <div className="space-y-8 w-full">
      <Card className="border-dashed bg-muted/40">
        <CardContent className="py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Quick start
            </p>
            <p className="text-sm text-muted-foreground">
              Not sure where to start? Load a prefilled example and tweak from
              there.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleLoadExample}
          >
            <Sparkles className="size-4" />
            Use example dataset
          </Button>
        </CardContent>
      </Card>

      {/* Generation Prompt */}
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Step 1
          </p>
          <Label htmlFor="prompt" className="text-base font-semibold">
            Generation prompt
          </Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Describe what type of data you want to generate. The clearer your
          description, the better the CSV.
        </p>
        <Textarea
          id="prompt"
          placeholder="e.g., Generate realistic customer support email threads about booking a venue for events..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-28 resize-none"
        />
      </div>

      {/* CSV Data Shape */}
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Step 2
          </p>
          <Label className="text-base font-semibold">CSV data shape</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Define the column headers for your CSV, or let AI suggest them based
          on a short description.
        </p>

        {/* Current Headers */}
        <div className="min-h-10">
          {headers.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No headers yet. Add your first column below or use{" "}
              <span className="font-medium not-italic">Generate with AI</span>.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {headers.map((header, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20"
                >
                  {header}
                  <button
                    type="button"
                    onClick={() => removeHeader(index)}
                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Add Header Input */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Add column header (e.g., email, subject, created_at)..."
            value={newHeader}
            onChange={(e) => setNewHeader(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={addHeader}
            disabled={!newHeader.trim()}
            className="w-full sm:w-auto"
          >
            <Plus className="size-4" />
            Add
          </Button>
        </div>

        {/* AI Shape Generation */}
        {!showAiGenerator ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAiGenerator(true)}
            className="w-full border-dashed"
          >
            <Sparkles className="size-4" />
            Generate headers with AI
          </Button>
        ) : (
          <Card className="border-dashed border-2 bg-muted/30">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Sparkles className="size-4" />
                  AI header suggestions
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAiGenerator(false);
                    setShapeDescription("");
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
              <Textarea
                placeholder="Describe the fields you need, e.g., 'Thread-level email metadata including subject, sender, recipient, timestamps, and routing info.'"
                value={shapeDescription}
                onChange={(e) => setShapeDescription(e.target.value)}
                className="min-h-20 resize-none bg-background"
                autoFocus
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleGenerateShape}
                disabled={!shapeDescription.trim() || isGeneratingShape}
                className="w-full"
              >
                <Sparkles className="size-4" />
                {isGeneratingShape ? "Generating..." : "Generate headers"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Number of Rows */}
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Step 3
          </p>
          <Label htmlFor="rowCount" className="text-base font-semibold">
            Number of rows
          </Label>
        </div>
        <p className="text-sm text-muted-foreground">
          How many rows of data to generate. For best results, keep this under
          200 rows per generation.
        </p>
        <Input
          id="rowCount"
          type="number"
          min={1}
          max={1000}
          value={Number.isNaN(rowCount) ? "" : rowCount}
          onChange={(e) => setRowCount(Number(e.target.value) || 0)}
          className="w-32"
        />
      </div>

      {/* Generate Buttons */}
      <div className="pt-4 border-t flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            size="lg"
            onClick={handleSampleGenerate}
            className="w-full sm:w-auto"
            disabled={
              isGeneratingSample || headers.length === 0 || rowCount <= 0
            }
          >
            <FileSpreadsheet className="size-5" />
            {isGeneratingSample
              ? "Generating sample..."
              : "Generate sample CSV"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Preview a few rows to validate your prompt and headers before
            generating the full dataset.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            size="lg"
            onClick={handleGenerateMainCsv}
            className="w-full sm:w-auto"
            disabled={isGeneratingMain || headers.length === 0 || rowCount <= 0}
          >
            <FileSpreadsheet className="size-5" />
            {isGeneratingMain ? "Generating full CSV..." : "Generate full CSV"}
          </Button>
          <p className="text-xs text-muted-foreground text-left sm:text-right">
            Generates the full CSV using the number of rows above. You can
            download it as a file once it&apos;s ready.
          </p>
        </div>
      </div>

      {(hasSample || hasGenerated) && (
        <div className="mt-4 space-y-4">
          {hasSample && hasGenerated && (
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex rounded-md border bg-muted p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveView("sample")}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    resolvedActiveView === "sample"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sample preview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView("generated")}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    resolvedActiveView === "generated"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Generated CSV
                </button>
              </div>

              {resolvedActiveView === "generated" && mainCsv && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadCsv}
                >
                  <Download className="size-4 mr-2" />
                  Download CSV
                </Button>
              )}
            </div>
          )}

          {showSample && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sample data preview</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-hidden">
                <div className="h-80 overflow-y-auto overflow-x-auto w-full">
                  <div className="min-w-full">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          {headers.map((header) => (
                            <TableHead key={header}>{header}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sampleRows.slice(0, 5).map((row, idx) => (
                          <TableRow key={idx}>
                            {headers.map((header) => (
                              <TableCell key={header}>
                                {row[header] ?? ""}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                {sampleRows.length > 5 && (
                  <p className="px-4 py-2 text-xs text-muted-foreground border-t">
                    Showing first 5 of {sampleRows.length} generated rows.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {showGenerated && mainRows && mainRows.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">Generated CSV</CardTitle>
                  {mainCsv && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadCsv}
                    >
                      <Download className="size-4 mr-2" />
                      Download CSV
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border overflow-hidden w-full">
                  <div className="h-96 overflow-y-auto overflow-x-auto w-full">
                    <div className="min-w-full">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                            {headers.map((header) => (
                              <TableHead key={header}>{header}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mainRows.map((row, idx) => (
                            <TableRow key={idx}>
                              {headers.map((header) => (
                                <TableCell key={header}>
                                  {row[header] ?? ""}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                {mainCsv && (
                  <div className="rounded-md border bg-muted/40 p-3 h-64 overflow-y-auto overflow-x-auto w-full">
                    <pre className="text-xs font-mono whitespace-pre">
                      {mainCsv}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default CreateForm;
