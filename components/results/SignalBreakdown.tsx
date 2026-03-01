"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { PersonSignals } from "@/types/analysis";

const RADAR_COLORS = [
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#f43f5e",
  "#0ea5e9",
  "#f97316",
];

interface SignalEntry {
  name: string;
  scores: PersonSignals;
}

interface SignalBreakdownProps {
  entries: SignalEntry[];
}

export function SignalBreakdown({ entries }: SignalBreakdownProps) {
  const data = [
    {
      axis: "Spatial",
      ...Object.fromEntries(
        entries.map((e, i) => [`p${i}`, e.scores.spatial_presence])
      ),
    },
    {
      axis: "Posture",
      ...Object.fromEntries(
        entries.map((e, i) => [`p${i}`, e.scores.posture_dominance])
      ),
    },
    {
      axis: "Facial",
      ...Object.fromEntries(
        entries.map((e, i) => [`p${i}`, e.scores.facial_intensity])
      ),
    },
    {
      axis: "Attention",
      ...Object.fromEntries(
        entries.map((e, i) => [`p${i}`, e.scores.attention_capture])
      ),
    },
  ];

  return (
    <div className="card p-5">
      <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mb-4">
        Signal Breakdown
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke="#1f1f1f" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "#52525b", fontSize: 11, fontWeight: 500 }}
          />
          <Tooltip
            contentStyle={{
              background: "#111",
              border: "1px solid #1f1f1f",
              borderRadius: 8,
              color: "#f5f5f5",
              fontSize: 11,
            }}
          />
          {entries.map((entry, i) => (
            <Radar
              key={entry.name}
              name={entry.name}
              dataKey={`p${i}`}
              stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
              fill={RADAR_COLORS[i % RADAR_COLORS.length]}
              fillOpacity={0.15}
              strokeWidth={1.5}
              animationBegin={i * 200}
              animationDuration={800}
            />
          ))}
          <Legend
            wrapperStyle={{ fontSize: 11, color: "#71717a", paddingTop: 8 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
