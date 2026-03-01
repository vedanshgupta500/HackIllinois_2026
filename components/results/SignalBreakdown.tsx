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
  "#2563EB",
  "#64748B",
  "#059669",
  "#EA580C",
  "#6366F1",
  "#E11D48",
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
      <p className="text-gray-400 text-xs font-medium uppercase tracking-widest mb-4">
        Signal Breakdown
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke="#E5E7EB" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "#9CA3AF", fontSize: 11, fontWeight: 500 }}
          />
          <Tooltip
            contentStyle={{
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              color: "#111111",
              fontSize: 11,
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
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
            wrapperStyle={{ fontSize: 11, color: "#6B7280", paddingTop: 8 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
