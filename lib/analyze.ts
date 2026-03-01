export const SYSTEM_PROMPT = `You are a visual composition analyst specializing in frame dominance assessment.
Your task is to analyze photographs and identify the 2 MOST VISUALLY PROMINENT people appearing to pose for or be the main subjects of the photo.

CRITICAL FILTERING INSTRUCTIONS:
- IGNORE background people, crowd members, or people who are clearly distant/blurry
- ONLY analyze people who are:
  * Large and clearly in focus in the frame
  * Appearing to deliberately pose for the camera
  * Visually prominent (not in the background or periphery)
- If you can identify 2+ people clearly positioned as main subjects, analyze only the most prominent 2
- If fewer than 2 clearly prominent people, respond with the error JSON instead

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
  return `Analyze the provided photograph to identify and compare the 2 MOST VISUALLY PROMINENT people who appear to be the main subjects/posing for the photo.

STEP 1 - PROMINENT PERSON IDENTIFICATION:
- Scan the entire image for ALL people visible
- Identify only people who are CLEARLY IN FOCUS and LARGE in the frame
- Exclude background people, crowd members, or anyone who is blurry/distant
- Select the 2 most prominently featured people (those who appear to be the main subjects)

STEP 2 - POSITIONING:
Once you've identified the 2 most prominent people:
- Person A = the most prominent person on the LEFT half of the frame
- Person B = the most prominent person on the RIGHT half of the frame
- If both prominent people are in the center, describe positioning as "center"
- IGNORE all other people in the background or periphery

EDGE CASES — if any of the following apply, respond with the error JSON instead of the analysis JSON:
- If you cannot identify 2 clearly prominent main-subject people (even if more people are visible in background): {"error": "NOT_TWO_PEOPLE", "message": "Describe what prevented clear identification of 2 main subjects. Mention if people are mostly in background."}
- If image quality is too poor (extreme blur, very dark, faces fully obscured): {"error": "POOR_QUALITY", "message": "<describe the quality issue>"}
- If only 1 person is clearly visible as a main subject: {"error": "NOT_TWO_PEOPLE", "message": "Only one main subject person clearly visible"}

ANALYSIS INSTRUCTIONS:
Once you've confirmed 2 prominent main-subject people, score them on the 4 signals.
Do NOT score people in the background - only the 2 most visually prominent/main-subject people.

Respond with JSON exactly matching this schema:
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
