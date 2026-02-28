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
import type { AnalysisResult } from "@/types/analysis";

interface RadarChartViewProps {
  result: AnalysisResult;
}

export function RadarChartView({ result }: RadarChartViewProps) {
  const data = [
    {
      axis: "Spatial",
      A: result.person_a.signals.spatial_presence,
      B: result.person_b.signals.spatial_presence,
    },
    {
      axis: "Posture",
      A: result.person_a.signals.posture_dominance,
      B: result.person_b.signals.posture_dominance,
    },
    {
      axis: "Facial",
      A: result.person_a.signals.facial_intensity,
      B: result.person_b.signals.facial_intensity,
    },
    {
      axis: "Attention",
      A: result.person_a.signals.attention_capture,
      B: result.person_b.signals.attention_capture,
    },
  ];

  return (
    <div className="bg-zinc-900 rounded-2xl p-5">
      <p className="text-zinc-400 text-sm font-medium mb-4 text-center">
        Signal Breakdown
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="#27272a" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "#71717a", fontSize: 12, fontWeight: 500 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
              borderRadius: "8px",
              color: "#fafafa",
              fontSize: "12px",
            }}
          />
          <Radar
            name="Person A"
            dataKey="A"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.25}
            strokeWidth={2}
            animationBegin={0}
            animationDuration={800}
          />
          <Radar
            name="Person B"
            dataKey="B"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.25}
            strokeWidth={2}
            animationBegin={200}
            animationDuration={800}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", color: "#a1a1aa" }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
