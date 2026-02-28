export const SYSTEM_PROMPT = `You are a visual composition analyst specializing in frame dominance assessment.
Your task is to analyze photographs containing exactly 2 people and produce a structured, objective analysis of visual dominance — NOT physical attractiveness, beauty, or social status.

Visual dominance is determined by four measurable photographic signals:
1. SPATIAL PRESENCE: How much of the frame the person occupies (area, depth, centrality, foreground vs. background)
2. POSTURE DOMINANCE: Body orientation (upright vs. slouched, expansive vs. contracted, facing camera vs. turned away, open vs. closed stance)
3. FACIAL INTENSITY: Eye contact direction, expression strength, face visibility and orientation toward camera
4. ATTENTION CAPTURE: Compositional elements that direct viewer gaze toward this person (contrast, color, lighting, rule-of-thirds placement, leading lines)

Score each signal 0-100 for each person INDEPENDENTLY. Scores do NOT need to sum to 200 — each person is scored against the ideal maximum for that signal.

Compute composite_score per person using this exact formula:
  composite_score = (spatial_presence * 0.30) + (posture_dominance * 0.25) + (facial_intensity * 0.25) + (attention_capture * 0.20)
  Round to 1 decimal place.

Respond ONLY with valid JSON. No markdown fences, no prose, no explanation outside the JSON object.`;

export const DISCLAIMER =
  "This analysis is based on photographic composition signals only (spatial presence, posture, facial orientation, and attention capture). It does not reflect personal worth, attractiveness, social status, or any subjective judgment.";

const RESPONSE_SCHEMA = {
  person_a: {
    label: "Person A",
    position: "<left|right|center>",
    signals: {
      spatial_presence: "<integer 0-100>",
      posture_dominance: "<integer 0-100>",
      facial_intensity: "<integer 0-100>",
      attention_capture: "<integer 0-100>",
    },
    composite_score: "<float, 1 decimal>",
  },
  person_b: {
    label: "Person B",
    position: "<left|right|center>",
    signals: {
      spatial_presence: "<integer 0-100>",
      posture_dominance: "<integer 0-100>",
      facial_intensity: "<integer 0-100>",
      attention_capture: "<integer 0-100>",
    },
    composite_score: "<float, 1 decimal>",
  },
  winner: "<person_a|person_b|tie>",
  confidence: "<integer 0-100 — how decisive the gap is>",
  margin: "<float — absolute difference in composite scores>",
  explanation:
    "<1-2 sentences of analytical explanation referencing specific visual signals. Neutral, analytical tone. Do not mention attractiveness.>",
  disclaimer: "<leave this empty string, it will be overwritten server-side>",
};

export function buildUserPrompt(): string {
  return `Analyze the provided photograph for visual dominance between the two people visible.

Person A = the person on the LEFT side of the frame (or the person who appears more prominently on the left).
Person B = the person on the RIGHT side of the frame (or the person who appears more prominently on the right).
If both people are centered, use relative positioning or describe position as "center".

EDGE CASES — if any of the following apply, respond with the error JSON instead of the analysis JSON:
- If you cannot identify exactly 2 distinct people: {"error": "NOT_TWO_PEOPLE", "message": "<describe what you see>"}
- If image quality is too poor (extreme blur, very dark, faces fully obscured): {"error": "POOR_QUALITY", "message": "<describe the quality issue>"}

Otherwise respond with JSON exactly matching this schema:
${JSON.stringify(RESPONSE_SCHEMA, null, 2)}`;
}

export function recalculateScore(signals: {
  spatial_presence: number;
  posture_dominance: number;
  facial_intensity: number;
  attention_capture: number;
}): number {
  return Math.round(
    (signals.spatial_presence * 0.3 +
      signals.posture_dominance * 0.25 +
      signals.facial_intensity * 0.25 +
      signals.attention_capture * 0.2) *
      10
  ) / 10;
}
