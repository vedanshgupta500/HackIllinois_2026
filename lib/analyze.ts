export interface PersonSignals {
  spatial_presence: number;
  posture_dominance: number;
  facial_intensity: number;
  attention_capture: number;
}

export const SYSTEM_PROMPT = `You are a visual composition analyst specializing in frame dominance assessment.
Analyze photographs containing 2–6 people and score each person's visual dominance — NOT attractiveness, beauty, or social status.

Visual dominance is determined by four measurable photographic signals:
1. SPATIAL PRESENCE: How much of the frame the person occupies (area, depth, centrality, foreground vs. background)
2. POSTURE DOMINANCE: Body orientation (upright vs. slouched, expansive vs. contracted, facing camera vs. turned away)
3. FACIAL INTENSITY: Eye contact direction, expression strength, face visibility and orientation toward camera
4. ATTENTION CAPTURE: Compositional elements directing viewer gaze (contrast, lighting, rule-of-thirds placement, leading lines)

Score each signal 0–100 per person INDEPENDENTLY against the ideal maximum.

Composite score formula (compute yourself, round to 1 decimal):
  composite = (spatial_presence × 0.30) + (posture_dominance × 0.25) + (facial_intensity × 0.25) + (attention_capture × 0.20)

Rank people 1 = most dominant, 2 = second most dominant, etc.

Respond ONLY with valid JSON. No markdown fences, no prose outside the JSON.`;

export const DISCLAIMER =
  "Analysis based on photographic composition signals only — spatial presence, posture, facial orientation, and attention capture. Does not reflect personal worth, attractiveness, or social status.";

const PERSON_SCHEMA = {
  label: "Person N",
  position: "<descriptive position: left / center / right / foreground / background>",
  signals: {
    spatial_presence: "<integer 0-100>",
    posture_dominance: "<integer 0-100>",
    facial_intensity: "<integer 0-100>",
    attention_capture: "<integer 0-100>",
  },
  composite_score: "<float 1 decimal>",
  rank: "<integer, 1 = most dominant>",
};

const RESPONSE_SCHEMA = {
  people: [PERSON_SCHEMA, { "...": "one entry per person detected" }],
  winner_index: "<0-based index into people[] of the rank-1 person>",
  is_tie: "<true if top 2 composite scores are within 3 points, false otherwise>",
  explanation:
    "<2-3 sentences referencing specific visual signals. Neutral analytical tone. No mention of attractiveness.>",
  disclaimer: "",
};

export function buildUserPrompt(): string {
  return `Analyze the provided photograph. Identify every person visible (2–6 people).

Label them Person 1, Person 2, ... in left-to-right order (or foreground-to-background if stacked).

EDGE CASES — respond with error JSON if:
- Fewer than 2 identifiable people: {"error": "NO_PEOPLE", "message": "<describe>"}
- More than 6 people: {"error": "TOO_MANY_PEOPLE", "message": "<describe>"}
- Image quality too poor (extreme blur/darkness, faces fully obscured): {"error": "POOR_QUALITY", "message": "<describe>"}

Otherwise respond with JSON matching this schema. The people array length must equal the actual number of people you detect:
${JSON.stringify(RESPONSE_SCHEMA, null, 2)}`;
}

export function recalculateScore(signals: PersonSignals): number {
  return (
    Math.round(
      (signals.spatial_presence * 0.3 +
        signals.posture_dominance * 0.25 +
        signals.facial_intensity * 0.25 +
        signals.attention_capture * 0.2) *
        10
    ) / 10
  );
}
