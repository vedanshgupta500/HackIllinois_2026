import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface AgentContextBody {
  sessionId?: string;
  contextText?: string;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "ELEVENLABS_API_KEY is missing" }, { status: 500 });
    }

    const body = (await req.json()) as AgentContextBody;
    const sessionId = body.sessionId?.trim();
    const contextText = body.contextText?.trim();

    if (!sessionId || !contextText) {
      return NextResponse.json(
        { ok: false, error: "Invalid payload. Expected { sessionId, contextText }" },
        { status: 400 }
      );
    }

    console.log("[AgentContext] Inject request", {
      sessionId,
      contextLength: contextText.length,
    });

    const encodedSessionId = encodeURIComponent(sessionId);
    const baseUrl = `https://api.elevenlabs.io/v1/convai/conversations/${encodedSessionId}`;
    const endpoints: Array<{ method: "POST" | "PATCH"; url: string; body: Record<string, unknown> }> = [
      {
        method: "POST",
        url: `${baseUrl}/context`,
        body: { context: contextText, analysis_context: contextText },
      },
      {
        method: "POST",
        url: `${baseUrl}/messages`,
        body: {
          role: "system",
          type: "contextual_update",
          message: contextText,
          text: contextText,
        },
      },
      {
        method: "POST",
        url: `${baseUrl}/events`,
        body: {
          type: "contextual_update",
          role: "system",
          message: contextText,
          text: contextText,
        },
      },
      {
        method: "PATCH",
        url: `${baseUrl}/metadata`,
        body: { metadata: { ANALYSIS_CONTEXT: contextText } },
      },
    ];

    const attempts: Array<{ url: string; method: string; status: number; ok: boolean; body: string }> = [];

    for (const endpoint of endpoints) {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(endpoint.body),
        cache: "no-store",
      });

      const responseBody = await response.text();

      attempts.push({
        url: endpoint.url,
        method: endpoint.method,
        status: response.status,
        ok: response.ok,
        body: responseBody.slice(0, 280),
      });

      console.log("[AgentContext] Attempt", {
        sessionId,
        method: endpoint.method,
        url: endpoint.url,
        status: response.status,
        ok: response.ok,
      });

      if (response.ok) {
        return NextResponse.json({ ok: true, sessionId });
      }
    }

    console.error("[AgentContext] Injection failed", { sessionId, attempts });
    return NextResponse.json(
      { ok: false, error: "ElevenLabs rejected all context injection attempts", attempts },
      { status: 502 }
    );
  } catch (error) {
    console.error("[AgentContext] Unexpected error", error);
    return NextResponse.json(
      { ok: false, error: "Unexpected error while injecting context", details: String(error) },
      { status: 500 }
    );
  }
}
