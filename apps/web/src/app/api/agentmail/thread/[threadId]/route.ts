import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;
    
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

    const response = await fetch(`${serverUrl}/api/agentmail/thread/${threadId}`);
    
    if (!response.ok) {
      const error = await response.text();
      return new Response(
        JSON.stringify({ error: "Failed to fetch thread", detail: error }),
        {
          status: response.status,
          headers: { "content-type": "application/json" },
        }
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to fetch thread messages",
        detail: (error as Error)?.message,
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    );
  }
}

