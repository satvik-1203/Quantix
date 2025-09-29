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

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      const fallback: JudgeResponse = {
        scores: {
          overall: 0.5,
          realism: 0.5,
          us_constraints: 0.5,
          schema_consistency: 0.5,
          anomalies: 0.5,
        },
        findings: ["LLM judge unavailable; returning neutral baseline."],
        recommendations: ["Set GROQ_API_KEY to enable LLM-based judging."],
      };
      return new Response(JSON.stringify(fallback), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-judge-mode": "fallback-no-llm",
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
- anomalies: duplicates, outliers, missing values; higher score if fewer problems.
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
    let parsed: JudgeResponse | null = null;
    try {
      parsed = JSON.parse(String(content || ""));
    } catch {}

    if (!parsed || !parsed.scores) {
      return new Response(JSON.stringify({ error: "parse-error" }), {
        status: 500,
        headers: {
          "content-type": "application/json",
          "x-judge-mode": "parse-error",
        },
      });
    }

    return new Response(JSON.stringify(parsed), {
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
