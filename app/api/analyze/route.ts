import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import {
  buildUserPrompt,
  SYSTEM_PROMPT,
  DISCLAIMER,
  recalculateScore,
} from "@/lib/analyze";
import {
  analyzeFeaturesWithTensorFlow,
  type TensorFlowAnalysisResult,
} from "@/lib/tensorflowAnalyze";
import { compressBase64ImageServer, getBase64ImageSize } from "@/lib/imageCompression";
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

    let base64Data = body.image.startsWith("data:")
      ? body.image.split(",")[1]
      : body.image;

    if (base64Data.length > MAX_BASE64_LENGTH) {
      return NextResponse.json(
        { success: false, error: "Image too large. Please use an image under 5MB.", code: "INVALID_IMAGE" },
        { status: 413 }
      );
    }

    // Compress image to reduce processing time and API costs
    console.log(
      `[/api/analyze] Original image size: ${getBase64ImageSize(base64Data).toFixed(2)} MB`
    );
    
    base64Data = compressBase64ImageServer(base64Data);
    
    console.log(
      `[/api/analyze] Compressed image size: ${getBase64ImageSize(base64Data).toFixed(2)} MB`
    );

    // Extract TensorFlow features in parallel with Claude analysis
    let tensorflowResults: TensorFlowAnalysisResult[] = [];

    try {
      console.log("[/api/analyze] Preparing TensorFlow feature extraction...");
      
      // TensorFlow analysis is optional and can be extended
      // For now, it provides heuristic estimates that Claude refines
      tensorflowResults = await analyzeFeaturesWithTensorFlow(
        null, // Image tensor - can be implemented with actual models
        512, // Approximate width
        512  // Approximate height
      );
      
      console.log(
        `[/api/analyze] TensorFlow prepared analysis for signal enhancement`
      );
    } catch (tfError) {
      console.warn("[/api/analyze] TensorFlow analysis failed:", tfError);
      // Continue with Claude analysis even if TensorFlow fails
    }

    // Run Claude vision analysis
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

    // Get TensorFlow signal enhancements if available
    let tensorflowEnhancement: Record<string, { spatial_presence: number; posture_dominance: number; facial_intensity: number; attention_capture: number; } | null> = {
      person_a: null,
      person_b: null,
    };
    if (tensorflowResults.length >= 2) {
      console.log(
        "[/api/analyze] Enhancing signals with TensorFlow predictions"
      );
      tensorflowEnhancement.person_a = tensorflowResults[0]?.signals;
      tensorflowEnhancement.person_b = tensorflowResults[1]?.signals;
    }

    // Server-side score recalculation — never trust Claude's arithmetic
    const paSignals = pa.signals as {
      spatial_presence: number;
      posture_dominance: number;
      facial_intensity: number;
      attention_capture: number;
    };
    const pbSignals = pb.signals as {
      spatial_presence: number;
      posture_dominance: number;
      facial_intensity: number;
      attention_capture: number;
    };

    // Optionally blend TensorFlow predictions with Claude's scores
    if (tensorflowEnhancement.person_a) {
      console.log("[/api/analyze] Blending TensorFlow with Claude signals");
      paSignals.spatial_presence = Math.round(
        (paSignals.spatial_presence * 0.6 +
          tensorflowEnhancement.person_a.spatial_presence * 0.4)
      );
      paSignals.posture_dominance = Math.round(
        (paSignals.posture_dominance * 0.6 +
          tensorflowEnhancement.person_a.posture_dominance * 0.4)
      );
      paSignals.facial_intensity = Math.round(
        (paSignals.facial_intensity * 0.6 +
          tensorflowEnhancement.person_a.facial_intensity * 0.4)
      );
    }

    if (tensorflowEnhancement.person_b) {
      pbSignals.spatial_presence = Math.round(
        (pbSignals.spatial_presence * 0.6 +
          tensorflowEnhancement.person_b.spatial_presence * 0.4)
      );
      pbSignals.posture_dominance = Math.round(
        (pbSignals.posture_dominance * 0.6 +
          tensorflowEnhancement.person_b.posture_dominance * 0.4)
      );
      pbSignals.facial_intensity = Math.round(
        (pbSignals.facial_intensity * 0.6 +
          tensorflowEnhancement.person_b.facial_intensity * 0.4)
      );
    }

    const scoreA = recalculateScore(paSignals);
    const scoreB = recalculateScore(pbSignals);
    const margin = Math.round(Math.abs(scoreA - scoreB) * 10) / 10;

    // Server-side winner determination (ignore Claude's winner field)
    const isTie = margin < 3;
    const winner: "person_a" | "person_b" | "tie" =
      isTie ? "tie" : scoreA > scoreB ? "person_a" : "person_b";

    const result: AnalysisResult = {
      people: [
        {
          label: "Person A",
          position: (pa.position as "left" | "right" | "center") ?? "left",
          signals: paSignals,
          composite_score: scoreA,
          rank: winner === "person_a" ? 1 : winner === "person_b" ? 2 : 1,
        },
        {
          label: "Person B",
          position: (pb.position as "left" | "right" | "center") ?? "right",
          signals: pbSignals,
          composite_score: scoreB,
          rank: winner === "person_b" ? 1 : winner === "person_a" ? 2 : 1,
        },
      ],
      winner_index: winner === "person_a" ? 0 : winner === "person_b" ? 1 : 0,
      is_tie: isTie,
      explanation: (parsed.explanation as string) ?? "",
      disclaimer: DISCLAIMER, // always overwrite with our canonical string
      processing_time_ms: Date.now() - startTime,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    if (err?.status === 429) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit reached. Try again in a moment.",
          code: "RATE_LIMIT",
        },
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
