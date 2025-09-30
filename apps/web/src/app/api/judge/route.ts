import type { NextRequest } from "next/server";

export const runtime = "nodejs";

type JudgeRequest = {
  csv: string;
  context?: Record<string, unknown>;
};

type JudgeResponse = {
  scores: {
    overall: number;
    realism: number;
    us_constraints: number;
    schema_consistency: number;
    anomalies: number; // inverted: higher means fewer anomalies
  };
  findings: string[];
  recommendations: string[];
};

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((l) => l.split(","));
  return { headers, rows };
}

function kolmogorovSmirnov(
  sample: number[],
  cdf: (x: number) => number
): number {
  if (sample.length === 0) return 1;
  const sorted = [...sample].sort((a, b) => a - b);
  let d = 0;
  const n = sorted.length;
  for (let i = 0; i < n; i++) {
    const x = sorted[i];
    const f = cdf(x);
    const empLo = i / n;
    const empHi = (i + 1) / n;
    d = Math.max(d, Math.abs(empLo - f), Math.abs(empHi - f));
  }
  return d; // smaller is better
}

function meanStd(sample: number[]): { mean: number; std: number } {
  if (sample.length === 0) return { mean: 0, std: 1 };
  const m = sample.reduce((a, b) => a + b, 0) / sample.length;
  const v =
    sample.reduce((a, b) => a + (b - m) * (b - m), 0) /
    Math.max(1, sample.length - 1);
  return { mean: m, std: Math.max(Math.sqrt(v), 1e-9) };
}

function guessExpectedCDFForColumn(
  name: string
): ((x: number) => number) | null {
  const key = name.toLowerCase();
  // Amount-like -> log-normal with mean=log(30), std=1
  if (/(amount|price|charge|revenue|cost)/.test(key)) {
    const mu = Math.log(30);
    const sigma = 1;
    return (x: number) => {
      if (x <= 0) return 0;
      const z = (Math.log(x) - mu) / sigma;
      return 0.5 * (1 + erf(z / Math.SQRT2));
    };
  }
  // Duration/inter-arrival -> exponential with lambda=1/60
  if (/(duration|inter_?arrival|wait|dwell)/.test(key)) {
    const lambda = 1 / 60;
    return (x: number) => (x < 0 ? 0 : 1 - Math.exp(-lambda * x));
  }
  // Counts -> Poisson approx by normal CDF with lambda=5 (simple check)
  if (/(count|quantity|events)/.test(key)) {
    const lambda = 5;
    const mu = lambda;
    const sigma = Math.sqrt(lambda);
    return (x: number) => 0.5 * (1 + erf((x - mu) / (sigma * Math.SQRT2)));
  }
  return null;
}

// Error function approximation
function erf(x: number): number {
  // Abramowitz and Stegun formula 7.1.26
  const a1 = 0.254829592,
    a2 = -0.284496736,
    a3 = 1.421413741,
    a4 = -1.453152027,
    a5 = 1.061405429,
    p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const t = 1 / (1 + p * Math.abs(x));
  const y =
    1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as JudgeRequest;
    const csv = (body?.csv ?? "").slice(0, 2_000_000); // 2MB safety cap

    if (!csv || csv.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Missing csv" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Deterministic, column-wise checks first
    const parsed = parseCsv(csv);
    const findings: string[] = [];
    const numericColumns: number[] = [];
    const headerLower = parsed.headers.map((h) => h.toLowerCase());
    // Identify numeric columns by sampling values
    for (let c = 0; c < parsed.headers.length; c++) {
      let numericCount = 0;
      for (let r = 0; r < Math.min(50, parsed.rows.length); r++) {
        const v = Number(parsed.rows[r][c]);
        if (!Number.isNaN(v) && Number.isFinite(v)) numericCount++;
      }
      if (
        numericCount >=
        Math.max(5, Math.floor(Math.min(50, parsed.rows.length) * 0.5))
      ) {
        numericColumns.push(c);
      }
    }

    let ksPenalty = 0;
    for (const colIdx of numericColumns) {
      const name = parsed.headers[colIdx];
      const cdf = guessExpectedCDFForColumn(name);
      if (!cdf) continue;
      const sample: number[] = [];
      for (let r = 0; r < parsed.rows.length; r++) {
        const v = Number(parsed.rows[r][colIdx]);
        if (!Number.isNaN(v) && Number.isFinite(v)) sample.push(v);
      }
      if (sample.length < 10) continue;
      const d = kolmogorovSmirnov(sample, cdf);
      if (d > 0.25) {
        ksPenalty += 0.05;
        findings.push(
          `Column ${name} deviates from expected distribution (KS=${d.toFixed(
            2
          )}).`
        );
      }
    }

    // If no LLM, return deterministic-only result
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      const base = 0.8 - ksPenalty;
      const fallback = {
        scores: {
          overall: Math.max(0, Math.min(1, base)),
          realism: Math.max(0, Math.min(1, base)),
          us_constraints: 0.5,
          schema_consistency: 0.8,
          anomalies: Math.max(0, Math.min(1, 1 - ksPenalty)),
        },
        findings: findings.length
          ? findings
          : ["Deterministic checks only (no LLM)."],
        recommendations: [
          "Review columns flagged for distribution mismatch.",
          "Provide more rows for better distribution fit.",
          "Set GROQ_API_KEY to enable richer LLM analysis.",
        ],
      };
      return new Response(JSON.stringify(fallback), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-judge-mode": "deterministic-only",
        },
      });
    }

    const guidance = `You are a strict data quality judge. You will receive a CSV snippet. Evaluate it and return a single JSON object with keys: 
{
  "scores": {
    "overall": number (0..1),
    "realism": number (0..1),
    "us_constraints": number (0..1),
    "schema_consistency": number (0..1),
    "anomalies": number (0..1) // higher is better (fewer anomalies)
  },
  "findings": string[] (concise bullet points),
  "recommendations": string[] (specific, actionable)
}
Scoring guidance:
- realism: are values plausible (amount ranges, timestamps, categories, merchant names)?
- us_constraints: are country/cities/currency consistent with USA (country=US, currency=USD, cities in US)?
- schema_consistency: headers vs rows alignment, data types consistent across rows.
- anomalies: outliers, missing values; higher score if fewer problems. IMPORTANT: Do NOT claim or penalize for duplicate transactions if an id-like field (e.g., id, txn_id, order_id, encounter_id, call_id, event_id) is present and the ids are unique and strictly sequential (0..N-1). Treat such rows as unique regardless of identical non-id values.
Compute overall as a sensible blend of the others. Output strictly valid JSON; no markdown.`;

    const messages = [
      { role: "system", content: "You output strictly valid JSON. No prose." },
      { role: "user", content: guidance },
      { role: "user", content: `CSV:\n\n${csv}` },
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
          temperature: 0.1,
          max_tokens: 2000,
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!resp.ok) {
      let reason = "";
      try {
        reason = await resp.text();
      } catch {}
      return new Response(
        JSON.stringify({ error: "llm-error", detail: reason.slice(0, 512) }),
        {
          status: 502,
          headers: {
            "content-type": "application/json",
            "x-judge-mode": "llm-error",
          },
        }
      );
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    let parsedLlm: JudgeResponse | null = null;
    try {
      parsedLlm = JSON.parse(String(content || ""));
    } catch {}

    if (!parsedLlm || !parsedLlm.scores) {
      return new Response(JSON.stringify({ error: "parse-error" }), {
        status: 500,
        headers: {
          "content-type": "application/json",
          "x-judge-mode": "parse-error",
        },
      });
    }

    // Blend LLM with deterministic checks
    const blended = { ...parsedLlm } as any;
    blended.scores.overall = Math.max(
      0,
      Math.min(1, blended.scores.overall - ksPenalty)
    );
    blended.findings = [...(parsedLlm.findings || []), ...findings];

    return new Response(JSON.stringify(blended), {
      status: 200,
      headers: { "content-type": "application/json", "x-judge-mode": "llm" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error)?.message || "unknown" }),
      {
        status: 500,
        headers: {
          "content-type": "application/json",
          "x-judge-mode": "api-exception",
        },
      }
    );
  }
}
