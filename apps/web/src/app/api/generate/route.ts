import type { NextRequest } from "next/server";

export const runtime = "nodejs";

type FieldDef = { name: string; type: "number" | "string" | "date" };

type GenerateRequest = {
  fields: FieldDef[];
  distribution?: string;
  params?: Record<string, number>;
  count: number;
  context?: Record<string, unknown>;
};

function toCsv(rows: Array<Record<string, any>>): string {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (val: any) => {
    const s = String(val ?? "");
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

function parsePositiveInt(n: unknown, fallback = 100, max = 10000): number {
  const v = typeof n === "number" ? n : parseInt(String(n ?? ""), 10);
  if (!Number.isFinite(v) || v <= 0) return fallback;
  return Math.min(v, max);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateRequest;
    const fields =
      Array.isArray(body.fields) && body.fields.length > 0
        ? body.fields
        : [{ name: "value", type: "number" as const }];
    const count = parsePositiveInt(body.count, 100, 5000);

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      // Fallback: return minimal CSV header-only to signal lack of LLM
      const emptyRows = Array.from({ length: 0 }).map(() => ({}));
      const headersOnly = fields.reduce<Record<string, string>>((acc, f) => {
        acc[f.name] = "";
        return acc;
      }, {});
      const csv = toCsv([headersOnly]);
      return new Response(csv, {
        status: 200,
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "x-generation-mode": "fallback-no-llm",
        },
      });
    }

    const fieldSpec = fields.map((f) => `${f.name}:${f.type}`).join(", ");

    const guidance = `You are a data synthesis agent. Produce STRICT JSON ONLY: an array of exactly ${count} objects. Each object MUST have keys: ${fields
      .map((f) => f.name)
      .join(", ")}. Types: { ${fieldSpec} }.
Values must be realistic and coherent given common domain patterns. Dates must be ISO8601 strings. Numbers must be numeric (not strings).
Do not include any explanations, markdown, or extra text. Output JSON array only.`;

    // Optional schema/distribution hint
    const hint = body.distribution
      ? `Primary distribution hint: ${
          body.distribution
        } with params ${JSON.stringify(body.params || {})}.`
      : "";

    const messages = [
      { role: "system", content: "You output strictly valid JSON. No prose." },
      { role: "user", content: `${guidance}\n${hint}` },
    ];

    const resp = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-specdec",
          messages,
          temperature: 0.2,
          max_tokens: Math.min(100000, Math.max(2000, count * 30)),
        }),
      }
    );

    if (!resp.ok) {
      return new Response("", {
        status: 502,
        headers: { "content-type": "text/csv; charset=utf-8" },
      });
    }

    const data = await resp.json();
    let content = data?.choices?.[0]?.message?.content ?? "";

    // Sanitize: strip markdown fences and extract JSON array
    content = String(content || "").trim();
    if (content.startsWith("```)")) {
      // unlikely but guard broken prefix
      content = content.replace(/^```[a-zA-Z]*\n?|```$/g, "");
    }
    if (content.startsWith("```")) {
      content = content.replace(/^```[a-zA-Z]*\n?/, "").replace(/```\s*$/, "");
    }
    const firstBracket = content.indexOf("[");
    const lastBracket = content.lastIndexOf("]");
    if (
      firstBracket !== -1 &&
      lastBracket !== -1 &&
      lastBracket > firstBracket
    ) {
      content = content.slice(firstBracket, lastBracket + 1);
    }

    let rows: any[] = [];
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) rows = parsed;
    } catch {}

    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response("", {
        status: 500,
        headers: { "content-type": "text/csv; charset=utf-8" },
      });
    }

    // Normalize rows: ensure field order and stringify dates
    const normalized = rows.slice(0, count).map((r) => {
      const out: Record<string, any> = {};
      for (const f of fields) {
        let v = (r ?? {})[f.name];
        if (f.type === "date") {
          if (typeof v === "number") {
            v = new Date(v).toISOString();
          } else if (typeof v === "string") {
            const d = new Date(v);
            v = Number.isFinite(d.getTime()) ? d.toISOString() : v;
          }
        }
        out[f.name] = v;
      }
      return out;
    });

    const csv = toCsv(normalized);
    return new Response(csv, {
      status: 200,
      headers: { "content-type": "text/csv; charset=utf-8" },
    });
  } catch (err) {
    return new Response("", {
      status: 500,
      headers: { "content-type": "text/csv; charset=utf-8" },
    });
  }
}
