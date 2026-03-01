import type { PersonSignals } from "@/types/analysis";

export interface AgentContextPerson {
  faceId: string;
  name: string;
  rank: number;
  totalScore: number;
  scores: PersonSignals;
}

export interface AgentContextResults {
  persons: AgentContextPerson[];
  winnerFaceId: string;
  isTie?: boolean;
  processingTime?: number;
  explanation?: string;
}

const SIGNAL_LABELS: Array<{ key: keyof PersonSignals; label: string }> = [
  { key: "spatial_presence", label: "Spatial Presence" },
  { key: "posture_dominance", label: "Posture Dominance" },
  { key: "facial_intensity", label: "Facial Intensity" },
  { key: "attention_capture", label: "Attention Capture" },
];

export function buildAgentContext(
  persons: AgentContextPerson[],
  names: Record<string, string> = {},
  processingTime?: number,
  explanation?: string,
  isTie?: boolean,
  maxChars = 2000
): string {
  const ranked = [...persons].sort((a, b) => a.rank - b.rank || b.totalScore - a.totalScore);
  const winner = ranked[0];

  const lines: string[] = ["ANALYSIS CONTEXT", ""];

  if (winner) {
    const winnerName = names[winner.faceId] || winner.name;
    lines.push(
      `Headline: ${isTie ? "Top result is a tie" : `${winnerName} is the winner`} | ` +
        `winner=${winnerName} | rank=#${winner.rank} | total=${winner.totalScore.toFixed(1)}/100`
    );
  } else {
    lines.push("Headline: winner unavailable");
  }

  lines.push(`Tie status: ${isTie ? "true" : "false"}`);

  if (typeof processingTime === "number") {
    lines.push(`Processing time: ${(processingTime / 1000).toFixed(1)}s`);
  }

  lines.push("", "People:");

  for (const person of ranked) {
    const displayName = names[person.faceId] || person.name;
    lines.push(
      `- ${displayName} (faceId=${person.faceId}) | rank=#${person.rank} | total=${person.totalScore.toFixed(1)}/100 | ` +
        `spatial=${person.scores.spatial_presence}, posture=${person.scores.posture_dominance}, ` +
        `facial=${person.scores.facial_intensity}, attention=${person.scores.attention_capture}`
    );
  }

  if (winner) {
    const winnerName = names[winner.faceId] || winner.name;
    const entries = SIGNAL_LABELS.map(({ key, label }) => ({
      key,
      label,
      value: winner.scores[key],
    })).sort((a, b) => b.value - a.value);

    const strengths = entries.slice(0, 2).map((entry) => `${entry.label} (${entry.value})`);
    const upgrades = [...entries]
      .reverse()
      .slice(0, 2)
      .map((entry) => `${entry.label} (${entry.value})`);

    lines.push(
      "",
      `${winnerName} strengths: ${strengths.join(", ")}`,
      `${winnerName} upgrades: ${upgrades.join(", ")}`
    );
  }

  const condensedExplanation = condenseExplanation(explanation, 520);
  if (condensedExplanation) {
    lines.push("", `Summary: ${condensedExplanation}`);
  }

  const joined = lines.join("\n");
  if (joined.length <= maxChars) return joined;
  return `${joined.slice(0, maxChars - 1).trim()}…`;
}

export function buildAgentContextFromResults(results: AgentContextResults): string {
  const names = Object.fromEntries(results.persons.map((person) => [person.faceId, person.name]));
  return buildAgentContext(
    results.persons,
    names,
    results.processingTime,
    results.explanation,
    results.isTie,
    2000
  );
}

function condenseExplanation(explanation: string | undefined, maxChars: number): string {
  if (!explanation) return "";
  const compact = explanation.replace(/\s+/g, " ").trim();
  if (!compact) return "";
  if (compact.length <= maxChars) return compact;
  return `${compact.slice(0, maxChars - 1).trim()}…`;
}
