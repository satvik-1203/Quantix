"use server";

import * as ai from "ai";
import { openai } from "@ai-sdk/openai";
import { z, type ZodTypeAny } from "zod";
import { promises as fs } from "fs";
import path from "path";

// ----- Header generation -----

export async function generateCsvHeaders(
  description: string,
  existingHeaders: string[] = []
): Promise<string[]> {
  console.log("[generateCsvHeaders] Starting with:", {
    description,
    existingHeaders,
  });

  if (!description.trim()) {
    console.log(
      "[generateCsvHeaders] Empty description, returning existing headers"
    );
    return existingHeaders;
  }

  const apiKey =
    process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_PRIVATE;

  if (!apiKey) {
    console.error("[generateCsvHeaders] OPENAI_API_KEY is not configured");
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = openai("gpt-4.1");
  console.log("[generateCsvHeaders] Using model: gpt-4.1");

  const schema = z.object({
    headers: z
      .array(z.string())
      .describe(
        "An array of simple CSV column header names. Examples of good headers: 'name', 'email', 'age', 'price', 'date', 'first_name', 'last_name', 'phone_number'. Avoid verbose headers like 'customer_full_name' (use 'name' or 'first_name'/'last_name'), 'email_address_string' (use 'email'), 'user_age_in_years' (use 'age'). Keep it simple - single words preferred, snake_case only when necessary to distinguish similar fields."
      ),
  });

  const promptLines: string[] = [
    "ROLE:",
    "You are a CSV header suggestion assistant. You generate simple, clear column names for a CSV file.",
    "",
    "INPUT:",
    `- Description: "${description}"`,
    existingHeaders.length > 0
      ? `- Existing headers (keep and do not change): ${existingHeaders.join(
          ", "
        )}`
      : "- Existing headers: none",
    "",
    "REQUIREMENTS:",
    "- Propose CSV column headers that match the description.",
    "- Keep headers as simple and human-readable as possible.",
    "- Suggest only additional headers that are not already in the existing header list.",
    '- Output must be a JSON object matching the schema { "headers": string[] } and contain no extra prose.',
    "",
    "EXAMPLES (GOOD, preferred):",
    '- Single words: "name", "email", "age", "price", "date", "status", "id", "city", "country"',
    '- Simple two-word: "first_name", "last_name", "phone_number", "zip_code", "order_id"',
    '- Common short forms: "id", "url", "sku", "qty"',
    "",
    "EXAMPLES (AVOID, too complex or verbose):",
    '- "customer_full_name" → use "name" or "first_name"/"last_name"',
    '- "email_address_string" → use "email"',
    '- "user_age_in_years" → use "age"',
    '- "product_price_in_usd" → use "price"',
    '- "transaction_timestamp_date" → use "date" or "timestamp"',
    '- "customer_account_identifier" → use "id" or "account_id"',
    "",
    "RULES:",
    "1. Prefer single-word headers whenever possible.",
    '2. Use snake_case only when needed to distinguish similar fields (e.g., "first_name" vs "last_name").',
    '3. Avoid redundant words (don\'t say "email_address" when "email" is clear).',
    "4. Use common, intuitive names that a typical analyst would expect.",
    "5. Only add complexity if the description explicitly requires multiple distinct but related fields.",
    "6. Never repeat an existing header name (case-insensitive).",
    "",
    'Return a JSON object with a "headers" array containing only the new headers to add.',
  ];

  const prompt = promptLines.join("\n");

  console.log("[generateCsvHeaders] Prompt:", prompt);

  try {
    console.log("[generateCsvHeaders] Calling AI API...");
    const { object } = await ai.generateObject({
      model,
      schema,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const generatedHeaders = object.headers || [];
    console.log("[generateCsvHeaders] Generated headers:", generatedHeaders);

    // Normalize headers: trim, lowercase for comparison, but keep original case
    const normalizedExisting = existingHeaders.map((h) =>
      h.toLowerCase().trim()
    );
    const newHeaders = generatedHeaders
      .map((h: string) => h.trim())
      .filter((h: string) => {
        const normalized = h.toLowerCase();
        return h.length > 0 && !normalizedExisting.includes(normalized);
      });

    console.log(
      "[generateCsvHeaders] New headers after filtering:",
      newHeaders
    );

    // Combine existing headers with new ones, avoiding duplicates
    const allHeaders = [...existingHeaders];
    for (const header of newHeaders) {
      const normalized = header.toLowerCase();
      if (!allHeaders.some((h) => h.toLowerCase() === normalized)) {
        allHeaders.push(header);
      }
    }

    console.log("[generateCsvHeaders] Final headers:", allHeaders);
    return allHeaders;
  } catch (error) {
    console.error("[generateCsvHeaders] Error generating CSV headers:", error);
    throw new Error(
      `Failed to generate CSV headers: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// ----- Sample CSV generation -----

type CsvRow = Record<string, string>;

function toCsv(rows: CsvRow[], headers: string[]): string {
  if (!rows || rows.length === 0 || headers.length === 0) return "";

  const escape = (val: string) => {
    const s = String(val ?? "");
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };

  const lines: string[] = [];
  lines.push(headers.join(","));

  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h] ?? "")).join(","));
  }

  return lines.join("\n");
}

// Deterministic mock data generator for local testing (avoids repeated AI calls)
function generateMockRows(headers: string[], rowCount: number): CsvRow[] {
  const safeRowCount = Math.min(Math.max(rowCount || 20, 1), 200);

  const trimmedHeaders = headers
    .map((h) => h.trim())
    .filter((h) => h.length > 0);

  const rows: CsvRow[] = [];
  for (let i = 1; i <= safeRowCount; i++) {
    const row: CsvRow = {};
    for (const header of trimmedHeaders) {
      // Simple, readable placeholder values that are stable across runs
      row[header] = `${header} ${i}`;
    }
    rows.push(row);
  }

  return rows;
}

export async function generateCsvSample(params: {
  description: string;
  headers: string[];
  rowCount: number;
}): Promise<{ rows: CsvRow[]; csv: string }> {
  const { description, headers, rowCount } = params;

  if (!headers || headers.length === 0) {
    throw new Error(
      "Add at least one column header before generating a sample."
    );
  }

  const trimmedDescription = description.trim();
  const safeDescription =
    trimmedDescription.length > 0
      ? trimmedDescription
      : "Generate realistic but synthetic CSV rows.";

  const apiKey =
    process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_PRIVATE;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = openai("gpt-4.1");

  const safeRowCount = Math.min(Math.max(rowCount || 20, 1), 200);

  const fieldShape: Record<string, ZodTypeAny> = {};
  for (const header of headers) {
    const trimmed = header.trim();
    if (!trimmed) continue;
    fieldShape[trimmed] = z
      .string()
      .describe('Value for column "' + trimmed + '" in one CSV row.');
  }

  const rowSchema = z.object(fieldShape);
  const schema = z.object({
    rows: z.array(rowSchema).min(1).max(safeRowCount),
  });

  const prompt =
    "ROLE:\n" +
    "You are a CSV data generator. You create realistic, synthetic rows for a CSV file.\n\n" +
    "INPUT:\n" +
    '- Description: "' +
    safeDescription +
    '"\n' +
    "- Headers: " +
    headers.join(", ") +
    "\n" +
    "- Desired row count: " +
    safeRowCount +
    "\n\n" +
    "REQUIREMENTS:\n" +
    "- Produce useful, realistic sample rows that match the headers.\n" +
    "- Every row must include ALL headers as keys.\n" +
    "- Values should be short, human-readable, and safe (no real PII).\n" +
    "- Use plain text values only (no JSON, no nested objects).\n" +
    "- Match the intent of the description (e.g., if it's about customers, make the data look like customer data).\n\n" +
    "OUTPUT:\n" +
    '- Return a JSON object of the form: { "rows": Array<Row> } where each Row has exactly these keys: ' +
    headers.join(", ") +
    ".\n" +
    "- Do not include any explanation or prose, only JSON.";

  const { object } = await ai.generateObject({
    model,
    schema,
    messages: [
      {
        role: "system",
        content: "You output strictly valid JSON only. No explanations.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.6,
  });

  const rows = (object.rows || []) as CsvRow[];
  const limitedRows =
    rows.length > safeRowCount ? rows.slice(0, safeRowCount) : rows;
  const csv = toCsv(limitedRows, headers);

  return { rows: limitedRows, csv };
}

// ----- Main/full CSV generation (for download/debugging) -----

export async function generateMainCsv(params: {
  description: string;
  headers: string[];
  rowCount: number;
}): Promise<{ rows: CsvRow[]; csv: string; debugFilePath: string }> {
  const { description, headers, rowCount } = params;

  // In non-production environments, short-circuit to deterministic mock data so
  // we don't have to keep regenerating via the AI for every test run.
  let result: { rows: CsvRow[]; csv: string };
  // In production, reuse the same generation logic as the sample, but respect
  // the requested rowCount.
  result = await generateCsvSample({
    description,
    headers,
    rowCount,
  });

  // For debugging: write the full response (params + rows + csv) to a JSON file.
  // This writes to a local folder in the app server environment and is mainly
  // intended for local development.
  try {
    const debugDir = path.join(process.cwd(), "csv-debug");
    await fs.mkdir(debugDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const debugFilePath = path.join(debugDir, `csv-main-${timestamp}.json`);

    const payload = {
      params: {
        description,
        headers,
        rowCount,
      },
      rows: result.rows,
      csv: result.csv,
    };

    await fs.writeFile(debugFilePath, JSON.stringify(payload, null, 2), "utf8");

    return { ...result, debugFilePath };
  } catch (error) {
    console.error("[generateMainCsv] Failed to write debug JSON file:", error);
    // Even if writing fails, still return the generated CSV so the user can proceed.
    return { ...result, debugFilePath: "" };
  }
}
