"use client";

import { useEffect, useState } from "react";
import type { PersonAnalysis } from "@/types/analysis";

const SIGNALS = [
  { key: "spatial_presence" as const, label: "Spatial Presence" },
  { key: "posture_dominance" as const, label: "Posture" },
  { key: "facial_intensity" as const, label: "Facial Intensity" },
  { key: "attention_capture" as const, label: "Attention Capture" },
];

interface SplitPersonCardProps {
  person: PersonAnalysis;
  isWinner: boolean;
  colorScheme: "violet" | "amber";
}

export function SplitPersonCard({ person, isWinner, colorScheme }: SplitPersonCardProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const accentColor = colorScheme === "violet" ? "violet" : "amber";
  const barColor =
    colorScheme === "violet" ? "bg-violet-500" : "bg-amber-500";
  const ringColor =
    colorScheme === "violet"
      ? "ring-violet-500 shadow-violet-500/20"
      : "ring-amber-500 shadow-amber-500/20";
  const scoreColor =
    colorScheme === "violet" ? "text-violet-400" : "text-amber-400";
  const badgeBg =
    colorScheme === "violet"
      ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
      : "bg-amber-500/20 border-amber-500/40 text-amber-300";

  return (
    <div
      className={`
        relative flex-1 min-w-0 bg-zinc-900 rounded-2xl p-5 transition-all duration-300
        ${isWinner ? `ring-2 ${ringColor} shadow-lg` : "opacity-80"}
      `}
      style={
        isWinner
          ? {
              animation: "pulse-ring 2s ease-in-out infinite",
            }
          : undefined
      }
    >
      {/* Winner badge */}
      {isWinner && (
        <div
          className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full border text-xs font-bold uppercase tracking-wider ${badgeBg}`}
        >
          Dominant
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-zinc-400 text-xs uppercase tracking-widest font-medium">
            {person.position === "left"
              ? "Left · "
              : person.position === "right"
              ? "Right · "
              : "Center · "}
            {person.label}
          </p>
          <p className={`text-3xl font-black mt-0.5 ${scoreColor}`}>
            {person.composite_score}
          </p>
          <p className="text-zinc-600 text-xs">/100 composite</p>
        </div>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black ${
            colorScheme === "violet"
              ? "bg-violet-500/20 text-violet-300"
              : "bg-amber-500/20 text-amber-300"
          }`}
        >
          {person.label === "Person A" ? "A" : "B"}
        </div>
      </div>

      {/* Signal bars */}
      <div className="space-y-3">
        {SIGNALS.map((signal) => {
          const value = person.signals[signal.key];
          return (
            <div key={signal.key}>
              <div className="flex justify-between mb-1">
                <span className="text-zinc-400 text-xs">{signal.label}</span>
                <span className={`text-xs font-semibold ${scoreColor}`}>
                  {value}
                </span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor} rounded-full signal-bar`}
                  style={{ width: animated ? `${value}%` : "0%" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Accent line bottom */}
      <div
        className={`absolute bottom-0 left-4 right-4 h-0.5 rounded-full opacity-40 ${
          colorScheme === "violet" ? "bg-violet-500" : "bg-amber-500"
        }`}
      />
    </div>
  );
}
