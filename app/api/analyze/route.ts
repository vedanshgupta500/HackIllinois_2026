import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import {
  buildUserPrompt,
  SYSTEM_PROMPT,
  DISCLAIMER,
  recalculateScore,
  type PersonSignals,
} from "@/lib/analyze";
import type { AnalyzeRequest, AnalysisResult, PersonAnalysis } from "@/types/analysis";
import { incrementScanCount } from "@/lib/scanCounter";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const MAX_BASE64_LENGTH = 5 * 1024 * 1024 * 1.37;

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body: AnalyzeRequest = await req.json();

    if (!body.image || !body.mimeType) {
      return NextResponse.json(
        { success: false, error: "Missing image or mimeType", code: "INVALID_IMAGE" },
        { status: 400 }
      );
    }

    const base64Data = body.image.startsWith("data:")
      ? body.image.split(",")[1]
      : body.image;

    if (base64Data.length > MAX_BASE64_LENGTH) {
      return NextResponse.json(
        { success: false, error: "Image too large. Please use an image under 5MB.", code: "INVALID_IMAGE" },
        { status: 413 }
      );
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: body.mimeType, data: base64Data },
            },
            { type: "text", text: buildUserPrompt() },
          ],
        },
      ],
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json(
        { success: false, error: "No response from AI", code: "AI_ERROR" },
        { status: 502 }
      );
    }

    const cleaned = textContent.text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/g, "")
      .trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[/api/analyze] JSON parse failed:", textContent.text);
      return NextResponse.json(
        { success: false, error: "Failed to parse AI response", code: "AI_ERROR" },
        { status: 502 }
      );
    }

    if (parsed.error) {
      const codeMap: Record<string, string> = {
        NO_PEOPLE: "NO_PEOPLE",
        TOO_MANY_PEOPLE: "TOO_MANY_PEOPLE",
        POOR_QUALITY: "POOR_QUALITY",
      };
      return NextResponse.json(
        {
          success: false,
          error: (parsed.message as string) || "Analysis not possible for this image",
          code: codeMap[parsed.error as string] ?? "AI_ERROR",
        },
        { status: 422 }
      );
    }

    const rawPeople = parsed.people as Array<Record<string, unknown>>;
    if (!Array.isArray(rawPeople) || rawPeople.length < 2) {
      return NextResponse.json(
        { success: false, error: "Unexpected AI response format", code: "AI_ERROR" },
        { status: 502 }
      );
    }

    const people: PersonAnalysis[] = rawPeople.map((p, i) => {
      const signals = p.signals as PersonSignals;
      return {
        label: (p.label as string) || `Person ${i + 1}`,
        position: (p.position as string) || "unknown",
        signals,
        composite_score: recalculateScore(signals),
        rank: 0,
      };
    });

    people.sort((a, b) => b.composite_score - a.composite_score);
    people.forEach((p, i) => { p.rank = i + 1; });

    const is_tie =
      people.length >= 2 &&
      Math.abs(people[0].composite_score - people[1].composite_score) < 3;

    const analysisResult: AnalysisResult = {
      people,
      winner_index: 0,
      is_tie,
      explanation: (parsed.explanation as string) ?? "",
      disclaimer: DISCLAIMER,
      processing_time_ms: Date.now() - startTime,
    };

    incrementScanCount();

    return NextResponse.json({ success: true, data: analysisResult });
  } catch (error: unknown) {
    const err = error as { status?: number };
    if (err?.status === 429) {
      return NextResponse.json(
        { success: false, error: "Rate limit reached. Try again in a moment.", code: "RATE_LIMIT" },
        { status: 429 }
      );
    }
    console.error("[/api/analyze]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "AI_ERROR" },
      { status: 500 }
    );
  }
}
