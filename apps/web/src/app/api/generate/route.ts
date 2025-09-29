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

    const wantsCountry = fields.some((f) => f.name.toLowerCase() === "country");
    const wantsCity = fields.some((f) => f.name.toLowerCase() === "city");
    const wantsCurrency = fields.some(
      (f) => f.name.toLowerCase() === "currency"
    );
    const wantsMerchant = fields.some(
      (f) => f.name.toLowerCase() === "merchant"
    );

    const usCityHint = wantsCity
      ? "Cities must be within the United States (e.g., New York, San Francisco, Austin, Seattle, Chicago, Los Angeles, Boston)."
      : "";
    const usCountryHint = wantsCountry
      ? 'Set country exactly to "US" for all rows.'
      : "";
    const usdHint = wantsCurrency ? 'Set currency to "USD" for all rows.' : "";
    const merchantHint = wantsMerchant
      ? "Merchant should be a realistic U.S. merchant name (e.g., Amazon, Walmart, Target, Starbucks, Uber, Apple Store, Costco, Home Depot)."
      : "";

    const guidance = `You are a data synthesis agent.\nReturn a SINGLE JSON OBJECT ONLY in the following shape:\n{ "rows": [ { /* object 1 */ }, { /* object 2 */ }, ... ] }\nWhere rows is an array of EXACTLY ${count} objects.\nEach row MUST include keys: ${fields
      .map((f) => f.name)
      .join(
        ", "
      )}.\nTypes: { ${fieldSpec} }.\nDates must be ISO8601 strings. Numbers must be numeric (not strings).\n${usCityHint}\n${usCountryHint}\n${usdHint}\n${merchantHint}\nAdditionally, if any id-like field exists (id, txn_id, order_id, encounter_id, call_id, event_id), assign ids strictly sequentially from 0 to ${
      count - 1
    } with no gaps or duplicates. Rows may share non-id values, but ids must be unique and sequential.\nNo markdown, no code fences, no prose.`;

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
          model: "llama-3.3-70b-versatile",
          messages,
          temperature: 0.2,
          max_tokens: Math.min(6000, Math.max(1500, count * 40)),
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!resp.ok) {
      let reason = "";
      try {
        reason = await resp.text();
      } catch {}
      return new Response("", {
        status: 502,
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "x-generation-mode": "llm-error",
          "x-error-status": String(resp.status),
          "x-error-reason": reason?.slice(0, 256) || "",
        },
      });
    }

    const data = await resp.json();
    let content = data?.choices?.[0]?.message?.content ?? "";

    let rows: any[] = [];
    try {
      const parsed = JSON.parse(String(content || ""));
      if (parsed && Array.isArray(parsed.rows)) {
        rows = parsed.rows;
      } else if (Array.isArray(parsed)) {
        rows = parsed;
      }
    } catch {
      // Best-effort fallback: strip fences and extract JSON array
      content = String(content || "").trim();
      if (content.startsWith("```)")) {
        content = content.replace(/^```[a-zA-Z]*\n?|```$/g, "");
      }
      if (content.startsWith("```")) {
        content = content
          .replace(/^```[a-zA-Z]*\n?/, "")
          .replace(/```\s*$/, "");
      }
      const firstBracket = content.indexOf("[");
      const lastBracket = content.lastIndexOf("]");
      if (
        firstBracket !== -1 &&
        lastBracket !== -1 &&
        lastBracket > firstBracket
      ) {
        const slice = content.slice(firstBracket, lastBracket + 1);
        try {
          const arr = JSON.parse(slice);
          if (Array.isArray(arr)) rows = arr;
        } catch {}
      }
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response("", {
        status: 500,
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "x-generation-mode": "llm-parse-error",
        },
      });
    }

    // Enforce exact count: truncate or cycle to reach requested count
    if (rows.length > count) {
      rows = rows.slice(0, count);
    } else if (rows.length < count && rows.length > 0) {
      const base = rows.slice();
      let i = 0;
      while (rows.length < count) {
        rows.push(base[i % base.length]);
        i++;
      }
    }

    // Normalize rows: ensure field order and stringify dates
    const idFieldNames = fields
      .map((f) => f.name)
      .filter((n) => {
        const nm = n.toLowerCase();
        return nm === "id" || nm.endsWith("id");
      });
    const normalized = rows.slice(0, count).map((r, i) => {
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
      // Force sequential ids 0..count-1 for any id-like fields
      idFieldNames.forEach((name) => {
        out[name] = i;
      });
      return out;
    });

    const csv = toCsv(normalized);
    return new Response(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "x-generation-mode": "llm",
      },
    });
  } catch (err) {
    return new Response("", {
      status: 500,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "x-generation-mode": "api-exception",
        "x-error-message": (err as Error)?.message?.slice(0, 256) || "",
      },
    });
  }
}
