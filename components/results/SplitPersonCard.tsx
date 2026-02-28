"use client";

import { useEffect, useState } from "react";
import type { PersonAnalysis } from "@/types/analysis";
import { PERSON_COLORS, cn } from "@/lib/utils";

const SIGNALS = [
  { key: "spatial_presence"  as const, label: "Spatial"   },
  { key: "posture_dominance" as const, label: "Posture"   },
  { key: "facial_intensity"  as const, label: "Facial"    },
  { key: "attention_capture" as const, label: "Attention" },
];

interface PersonCardProps {
  person: PersonAnalysis;
  colorIndex: number;
}

export function SplitPersonCard({ person, colorIndex }: PersonCardProps) {
  const [ready, setReady] = useState(false);
  const colors = PERSON_COLORS[colorIndex % PERSON_COLORS.length];
  const isWinner = person.rank === 1;

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={cn(
        "card p-4 relative transition-all duration-200",
        isWinner && "border-violet-800/60 shadow-sm shadow-violet-950"
      )}
    >
      {isWinner && (
        <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full bg-violet-950 border border-violet-800 text-violet-300 text-[10px] font-medium uppercase tracking-wider">
          #1 · Dominant
        </span>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4 pt-1">
        <div>
          <p className="text-zinc-500 text-xs">{person.position}</p>
          <p className="text-zinc-100 text-sm font-semibold mt-0.5">{person.label}</p>
        </div>
        <div className="text-right">
          <p className={cn("text-2xl font-semibold tabular-nums", colors.text)}>
            {person.composite_score}
          </p>
          <p className="text-zinc-700 text-xs">/100</p>
        </div>
      </div>

      {/* Signal bars */}
      <div className="space-y-2.5">
        {SIGNALS.map((s) => {
          const val = person.signals[s.key];
          return (
            <div key={s.key}>
              <div className="flex justify-between mb-1">
                <span className="text-zinc-500 text-xs">{s.label}</span>
                <span className={cn("text-xs font-medium tabular-nums", colors.text)}>{val}</span>
              </div>
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full signal-bar", colors.bar)}
                  style={{ width: ready ? `${val}%` : "0%" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
