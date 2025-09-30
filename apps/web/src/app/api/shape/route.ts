import type { NextRequest } from "next/server";

export const runtime = "nodejs";

type ShapeRequest = {
  industry?: string;
  dataNeed?: string;
  recordVolume?: string;
  sensitive?: boolean;
  notes?: string;
};

type ShapeResponse = {
  distribution: string;
  params: Partial<{
    mean: number;
    stddev: number;
    min: number;
    max: number;
    lambda: number;
  }>;
  fields: Array<{ name: string; type: string }>;
  source: "groq" | "heuristic" | "error";
  explanation?: string;
};

function heuristicShape(input: ShapeRequest): ShapeResponse {
  const text = `${input.industry ?? ""} ${input.dataNeed ?? ""} ${
    input.notes ?? ""
  }`.toLowerCase();
  let distribution = "Gaussian (Normal)";
  const params: ShapeResponse["params"] = {};
  let fields: ShapeResponse["fields"] | undefined;

  // Cybersecurity (logs / alerts)
  if (
    text.includes("cyber") ||
    text.includes("security") ||
    text.includes("siem") ||
    text.includes("ids") ||
    text.includes("ips") ||
    text.includes("threat") ||
    text.includes("alert")
  ) {
    distribution = "Exponential"; // inter-arrival or dwell times
    params.lambda = 0.5;
    fields = [
      { name: "event_id", type: "string" },
      { name: "timestamp", type: "date" },
      { name: "source_ip", type: "string" },
      { name: "dest_ip", type: "string" },
      { name: "source_port", type: "number" },
      { name: "dest_port", type: "number" },
      { name: "protocol", type: "string" },
      { name: "action", type: "string" },
      { name: "rule", type: "string" },
      { name: "inter_arrival_seconds", type: "number" },
      { name: "severity", type: "number" },
    ];
  }
  // Transaction-like requests (consumer spending / credit cards)
  else if (
    text.includes("transaction") ||
    text.includes("credit card") ||
    text.includes("merchant") ||
    text.includes("spend") ||
    text.includes("purchase") ||
    text.includes("pos")
  ) {
    distribution = "Log-normal"; // amounts are typically right-skewed
    params.mean = 3.5; // log-mean ~ $33 average
    params.stddev = 1.0; // moderate skew
    fields = [
      { name: "txn_id", type: "string" },
      { name: "timestamp", type: "date" },
      { name: "merchant", type: "string" },
      { name: "category", type: "string" },
      { name: "amount", type: "number" },
      { name: "currency", type: "string" },
      { name: "card_last4", type: "string" },
      { name: "channel", type: "string" },
      { name: "city", type: "string" },
      { name: "country", type: "string" },
    ];
  }
  // E-commerce orders
  else if (
    text.includes("e-commerce") ||
    text.includes("ecommerce") ||
    text.includes("order") ||
    text.includes("cart") ||
    text.includes("checkout")
  ) {
    distribution = "Log-normal"; // prices are skewed
    params.mean = 3.2;
    params.stddev = 0.9;
    fields = [
      { name: "order_id", type: "string" },
      { name: "timestamp", type: "date" },
      { name: "customer_id", type: "string" },
      { name: "product_id", type: "string" },
      { name: "sku", type: "string" },
      { name: "quantity", type: "number" },
      { name: "price", type: "number" },
      { name: "currency", type: "string" },
      { name: "channel", type: "string" },
      { name: "country", type: "string" },
    ];
  }
  // Healthcare encounters (de-identified)
  else if (
    text.includes("health") ||
    text.includes("ehr") ||
    text.includes("hospital") ||
    text.includes("patient") ||
    text.includes("claims")
  ) {
    distribution = "Log-normal"; // length-of-stay/cost often skewed
    params.mean = 1.0;
    params.stddev = 0.8;
    fields = [
      { name: "encounter_id", type: "string" },
      { name: "timestamp", type: "date" },
      { name: "patient_id", type: "string" },
      { name: "department", type: "string" },
      { name: "diagnosis_code", type: "string" },
      { name: "procedure_code", type: "string" },
      { name: "length_of_stay", type: "number" },
      { name: "charge", type: "number" },
      { name: "age", type: "number" },
      { name: "sex", type: "string" },
    ];
  }
  // Telecommunications CDRs
  else if (
    text.includes("telecom") ||
    text.includes("cdr") ||
    text.includes("call detail") ||
    text.includes("call") ||
    text.includes("sms")
  ) {
    distribution = "Exponential"; // duration
    params.lambda = 0.2;
    fields = [
      { name: "call_id", type: "string" },
      { name: "timestamp_start", type: "date" },
      { name: "duration_seconds", type: "number" },
      { name: "from_number", type: "string" },
      { name: "to_number", type: "string" },
      { name: "cell_tower", type: "string" },
      { name: "city", type: "string" },
      { name: "country", type: "string" },
      { name: "call_type", type: "string" },
    ];
  }
  // Benchmark / testing generic
  else if (text.includes("benchmark") || text.includes("test")) {
    distribution = "Uniform";
    params.min = 0;
    params.max = 1;
  }
  // Counts/events generic
  else if (
    text.includes("events") ||
    text.includes("counts") ||
    text.includes("traffic") ||
    text.includes("poisson")
  ) {
    distribution = "Poisson";
    params.lambda = 5;
  }
  // Time-to/wait generic
  else if (
    text.includes("time to") ||
    text.includes("wait") ||
    text.includes("decay") ||
    text.includes("exponential")
  ) {
    distribution = "Exponential";
    params.lambda = 1.2;
  }
  // Growth / skew generic
  else if (
    text.includes("create new intelligence") ||
    text.includes("growth") ||
    text.includes("skew")
  ) {
    distribution = "Log-normal";
    params.mean = 0;
    params.stddev = 1;
  } else {
    distribution = "Gaussian (Normal)";
    params.mean = 0;
    params.stddev = 1;
  }

  return {
    distribution,
    params,
    fields: fields ?? [{ name: "value", type: "number" }],
    source: "heuristic",
    explanation: fields
      ? "Heuristic recognized the domain and proposed realistic fields."
      : "Heuristic mapping from purpose/outcome to a reasonable base distribution.",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ShapeRequest;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      const result: ShapeResponse = {
        distribution: "Gaussian (Normal)",
        params: { mean: 0, stddev: 1 },
        fields: [{ name: "value", type: "number" }],
        source: "error",
        explanation:
          "GROQ_API_KEY is missing. Set the environment variable to enable LLM-based inference.",
      };
      return new Response(JSON.stringify(result), {
        status: 400,
        headers: {
          "content-type": "application/json",
          "x-shape-mode": "error-missing-api-key",
          "x-error-reason": "Missing GROQ_API_KEY",
        },
      });
    }

    // Use Groq Chat Completions API (OpenAI-compatible)
    const prompt = `You are a data synthesis expert. Given: industry=${body.industry}, purpose=${body.dataNeed}, volume=${body.recordVolume}, sensitive=${body.sensitive}, notes=${body.notes}.

Return a STRICT JSON object with keys: distribution, params, fields, explanation.
- distribution: ONE of ["Gaussian (Normal)", "Uniform", "Poisson", "Exponential", "Log-normal", "Custom mixture"]. Choose the primary distribution governing numeric magnitudes in this dataset.
- params: object including only numeric fields among {mean,stddev,min,max,lambda} appropriate for the chosen distribution.
- fields: array of objects { name, type } where type ∈ {number|string|date}. Include realistic domain columns.

Per-column guidance (very important): choose names and implied distributions consistent with real-world data, for example:
- amount, price, charge, revenue: positive, right-skewed (Log-normal or Gamma). Avoid negatives.
- quantity, count, events: non-negative counts (Poisson or Negative Binomial). If you choose Poisson, set lambda.
- duration_seconds, inter_arrival_seconds, dwell_time: positive continuous; inter-arrival often Exponential; durations may be Log-normal.
- timestamp, timestamp_start, date: ISO8601 strings; consider realistic ranges.
- category, merchant, channel, department, city, country, protocol, action: categorical strings; frequency should be imbalanced (multinomial/Zipf-like) not uniform.
- ids (id, txn_id, order_id, encounter_id, call_id, event_id): strings or numbers; downstream generator will set sequential numeric ids 0..N-1 if numeric.
- currency must be "USD" if present; country "US"; cities must be US cities.

Your output must be valid JSON only (no markdown, no backticks).`;

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
          messages: [
            {
              role: "system",
              content: "You output strictly valid JSON. No prose.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 400,
        }),
      }
    );

    if (!resp.ok) {
      const result: ShapeResponse = {
        distribution: "Gaussian (Normal)",
        params: { mean: 0, stddev: 1 },
        fields: [{ name: "value", type: "number" }],
        source: "error",
        explanation: `LLM request failed with status ${resp.status}. Using safe default.`,
      };
      return new Response(JSON.stringify(result), {
        status: 502,
        headers: {
          "content-type": "application/json",
          "x-shape-mode": "error-llm-bad-response",
          "x-error-status": String(resp.status),
        },
      });
    }

    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content ?? "";

    // Robust JSON extraction: strip fences, extract first valid JSON object
    function extractJson(text: string): any | null {
      let t = text.trim();
      // strip markdown fences
      if (t.startsWith("```")) {
        t = t
          .replace(/^```[a-zA-Z]*\n?/, "")
          .replace(/```\s*$/, "")
          .trim();
      }
      // if it's already valid JSON
      try {
        return JSON.parse(t);
      } catch {}
      // try to locate first {...} block
      const first = t.indexOf("{");
      const last = t.lastIndexOf("}");
      if (first !== -1 && last !== -1 && last > first) {
        const slice = t.slice(first, last + 1);
        try {
          return JSON.parse(slice);
        } catch {}
      }
      return null;
    }

    const parsed: any = extractJson(raw);
    if (!parsed) {
      const result: ShapeResponse = {
        distribution: "Gaussian (Normal)",
        params: { mean: 0, stddev: 1 },
        fields: [{ name: "value", type: "number" }],
        source: "error",
        explanation: "LLM returned unparseable content. Using safe default.",
      };
      return new Response(JSON.stringify(result), {
        status: 502,
        headers: {
          "content-type": "application/json",
          "x-shape-mode": "error-unparseable-json",
        },
      });
    }

    const result: ShapeResponse = {
      distribution: parsed?.distribution ?? "Gaussian (Normal)",
      params: parsed?.params ?? {},
      fields: parsed?.fields ?? [{ name: "value", type: "number" }],
      source: "groq",
      explanation: parsed?.explanation ?? undefined,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-shape-mode": "groq",
      },
    });
  } catch (err) {
    const result: ShapeResponse = {
      distribution: "Gaussian (Normal)",
      params: { mean: 0, stddev: 1 },
      fields: [{ name: "value", type: "number" }],
      source: "error",
      explanation: "Failed to infer shape; returned safe default.",
    };
    return new Response(JSON.stringify(result), {
      status: 500,
      headers: {
        "content-type": "application/json",
        "x-shape-mode": "error-exception",
      },
    });
  }
}
