export interface PersonSignals {
  spatial_presence: number;   // 0-100: frame area occupied
  posture_dominance: number;  // 0-100: upright, expansive, forward-facing
  facial_intensity: number;   // 0-100: gaze direction, expression strength
  attention_capture: number;  // 0-100: compositional gaze magnet
}

export interface PersonAnalysis {
  label: string;              // "Person 1", "Person 2", etc.
  position: string;           // descriptive: "left", "center-right", etc.
  signals: PersonSignals;
  composite_score: number;    // server-recalculated
  rank: number;               // 1 = most dominant
}

export interface AnalysisResult {
  people: PersonAnalysis[];   // 2–6 people, sorted by rank ascending
  winner_index: number;       // index into people[] of rank-1 person
  is_tie: boolean;
  explanation: string;
  disclaimer: string;         // canonical string, server-enforced
  processing_time_ms?: number;
}

export interface AnalyzeRequest {
  image: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
}

export type AnalyzeResponse =
  | { success: true; data: AnalysisResult }
  | {
      success: false;
      error: string;
      code:
        | "NO_PEOPLE"
        | "TOO_MANY_PEOPLE"
        | "POOR_QUALITY"
        | "INVALID_IMAGE"
        | "AI_ERROR"
        | "RATE_LIMIT";
    };
