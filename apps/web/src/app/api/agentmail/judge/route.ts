import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const threadId = body?.threadId as string | undefined;
    if (!threadId) {
      return new Response(JSON.stringify({ error: "Thread ID is required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!serverUrl) {
      return new Response(
        JSON.stringify({ error: "Server URL not configured" }),
        {
          status: 500,
          headers: { "content-type": "application/json" },
        }
      );
    }

    const response = await fetch(`${serverUrl}/api/agentmail/judge`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ threadId }),
    });

    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error)?.message || "unknown" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    );
  }
}
