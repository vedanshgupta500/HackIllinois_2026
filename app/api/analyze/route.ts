import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import {
  buildUserPrompt,
  SYSTEM_PROMPT,
  DISCLAIMER,
  recalculateScore,
} from "@/lib/analyze";
import type { AnalyzeRequest, AnalysisResult } from "@/types/analysis";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// 5MB base64 → ~3.75MB raw image
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
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: body.mimeType,
                data: base64Data,
              },
            },
            {
              type: "text",
              text: buildUserPrompt(),
            },
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

    // Strip markdown fences Claude occasionally adds despite instructions
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

    // Handle Claude-reported edge cases
    if (parsed.error) {
      const codeMap: Record<string, string> = {
        NOT_TWO_PEOPLE: "NOT_TWO_PEOPLE",
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

    // Validate structure
    const pa = parsed.person_a as Record<string, unknown>;
    const pb = parsed.person_b as Record<string, unknown>;
    if (!pa?.signals || !pb?.signals) {
      return NextResponse.json(
        { success: false, error: "Unexpected AI response format", code: "AI_ERROR" },
        { status: 502 }
      );
    }

    // Server-side score recalculation — never trust Claude's arithmetic
    const paSignals = pa.signals as { spatial_presence: number; posture_dominance: number; facial_intensity: number; attention_capture: number };
    const pbSignals = pb.signals as { spatial_presence: number; posture_dominance: number; facial_intensity: number; attention_capture: number };

    const scoreA = recalculateScore(paSignals);
    const scoreB = recalculateScore(pbSignals);
    const margin = Math.round(Math.abs(scoreA - scoreB) * 10) / 10;

    // Server-side winner determination (ignore Claude's winner field)
    const winner: "person_a" | "person_b" | "tie" =
      margin < 3 ? "tie" : scoreA > scoreB ? "person_a" : "person_b";

    const result: AnalysisResult = {
      person_a: {
        label: "Person A",
        position: (pa.position as "left" | "right" | "center") ?? "left",
        signals: paSignals,
        composite_score: scoreA,
      },
      person_b: {
        label: "Person B",
        position: (pb.position as "left" | "right" | "center") ?? "right",
        signals: pbSignals,
        composite_score: scoreB,
      },
      winner,
      confidence: typeof parsed.confidence === "number" ? Math.min(100, Math.max(0, parsed.confidence)) : 70,
      margin,
      explanation: (parsed.explanation as string) ?? "",
      disclaimer: DISCLAIMER, // always overwrite with our canonical string
      processing_time_ms: Date.now() - startTime,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
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
