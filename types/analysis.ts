export interface PersonSignals {
  spatial_presence: number;   // 0-100: % of frame area occupied
  posture_dominance: number;  // 0-100: upright, expansive, forward-facing
  facial_intensity: number;   // 0-100: gaze direction, expression strength
  attention_capture: number;  // 0-100: compositional gaze magnet
}

export interface PersonAnalysis {
  label: "Person A" | "Person B";
  position: "left" | "right" | "center";
  signals: PersonSignals;
  composite_score: number; // server-recalculated from signals
}

export interface AnalysisResult {
  person_a: PersonAnalysis;
  person_b: PersonAnalysis;
  winner: "person_a" | "person_b" | "tie";
  confidence: number;      // 0-100, decisiveness of the gap
  margin: number;          // absolute score difference
  explanation: string;     // 1-2 sentence analytical narrative
  disclaimer: string;      // canonical ethical disclaimer (server-enforced)
  processing_time_ms?: number;
}

export interface AnalyzeRequest {
  image: string; // base64 data URL or raw base64
  mimeType: "image/jpeg" | "image/png" | "image/webp";
}

export type AnalyzeResponse =
  | { success: true; data: AnalysisResult }
  | {
      success: false;
      error: string;
      code:
        | "NOT_TWO_PEOPLE"
        | "POOR_QUALITY"
        | "INVALID_IMAGE"
        | "AI_ERROR"
        | "RATE_LIMIT";
    };
