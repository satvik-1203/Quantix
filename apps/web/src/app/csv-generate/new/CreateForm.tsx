"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Sparkles, FileSpreadsheet, Download } from "lucide-react";
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
  "- Create customer-receptionist email chats where the customer is requesting to book a venue for a party reservation. ";

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
  const [prompt, setPrompt] = useState(MOCK_PROMPT);
  const [headers, setHeaders] = useState<string[]>(MOCK_HEADERS);
  const [newHeader, setNewHeader] = useState("");
  const [shapeDescription, setShapeDescription] = useState("");
  const [rowCount, setRowCount] = useState(20);
  const [isGeneratingShape, setIsGeneratingShape] = useState(false);
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const [sampleRows, setSampleRows] = useState<SampleRow[]>(MOCK_ROWS);
  const [isGeneratingMain, setIsGeneratingMain] = useState(false);
  const [mainCsv, setMainCsv] = useState<string | null>(null);
  const [mainRows, setMainRows] = useState<SampleRow[] | null>(MOCK_ROWS);

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
      alert(
        error instanceof Error
          ? error.message
          : "Failed to generate CSV headers. Please try again."
      );
    } finally {
      setIsGeneratingShape(false);
    }
  };

  const handleSampleGenerate = async () => {
    if (!headers.length) {
      alert("Add at least one column header before generating a sample.");
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
    } catch (error) {
      console.error("Failed to generate sample CSV:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to generate sample CSV. Please try again."
      );
    } finally {
      setIsGeneratingSample(false);
    }
  };

  const handleGenerateMainCsv = async () => {
    if (!headers.length) {
      alert("Add at least one column header before generating the full CSV.");
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
      alert(
        error instanceof Error
          ? error.message
          : "Failed to generate main CSV. Please try again."
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

  return (
    <div className="space-y-8 w-full">
      {/* Generation Prompt */}
      <div className="space-y-3">
        <Label htmlFor="prompt" className="text-base font-semibold">
          Generation Prompt
        </Label>
        <p className="text-sm text-muted-foreground">
          Describe what type of data you want to generate
        </p>
        <Textarea
          id="prompt"
          placeholder="e.g., Generate realistic customer data for an e-commerce platform including demographics and purchase history..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-24 resize-none"
        />
      </div>

      {/* CSV Data Shape */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">CSV Data Shape</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Define the column headers for your CSV
          </p>
        </div>

        {/* Current Headers */}
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

        {/* Add Header Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Add column header..."
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
            Generate with AI
          </Button>
        ) : (
          <Card className="border-dashed border-2 bg-muted/30">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Sparkles className="size-4" />
                  AI Shape Generator
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
                placeholder="Describe the shape you want, e.g., 'I need columns for a user profile with contact info, preferences, and activity metrics'"
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
                {isGeneratingShape ? "Generating..." : "Generate Shape"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Number of Rows */}
      <div className="space-y-3">
        <Label htmlFor="rowCount" className="text-base font-semibold">
          Number of Rows
        </Label>
        <p className="text-sm text-muted-foreground">
          How many rows of data to generate
        </p>
        <Input
          id="rowCount"
          type="number"
          min={1}
          max={1000}
          value={rowCount}
          onChange={(e) => setRowCount(Number(e.target.value))}
          className="w-32"
        />
      </div>

      {/* Generate Buttons */}
      <div className="pt-4 border-t flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            size="lg"
            onClick={handleSampleGenerate}
            className="w-full sm:w-auto"
            disabled={isGeneratingSample || headers.length === 0}
          >
            <FileSpreadsheet className="size-5" />
            {isGeneratingSample
              ? "Generating Sample..."
              : "Generate Sample CSV"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Preview a few rows to validate your prompt and headers.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            size="lg"
            onClick={handleGenerateMainCsv}
            className="w-full sm:w-auto"
            disabled={isGeneratingMain || headers.length === 0}
          >
            <FileSpreadsheet className="size-5" />
            {isGeneratingMain ? "Generating Full CSV..." : "Generate Full CSV"}
          </Button>
          <p className="text-xs text-muted-foreground text-left sm:text-right">
            Generate the full CSV using the number of rows above.
          </p>
        </div>
      </div>

      {sampleRows.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Sample Data Preview</CardTitle>
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
                          <TableCell key={header}>{row[header] ?? ""}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {mainRows && mainRows.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
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
                            <TableCell key={header}>{row[header] ?? ""}</TableCell>
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
  );
};

export default CreateForm;
