"use client";

import { useState, useEffect } from "react";
import type { Face, PersonSignals } from "@/types/analysis";
import { cn, PERSON_COLORS } from "@/lib/utils";
import { Sparkles, Crown } from "lucide-react";
import { EditNameButton } from "@/components/steps/FaceLabelStep";

const SIGNALS: { key: keyof PersonSignals; label: string }[] = [
  { key: "spatial_presence", label: "Spatial" },
  { key: "posture_dominance", label: "Posture" },
  { key: "facial_intensity", label: "Facial" },
  { key: "attention_capture", label: "Attention" },
];

interface ComparisonCardProps {
  face: Face;
  name: string;
  scores: PersonSignals;
  totalScore: number;
  rank: number;
  colorIndex: number;
  isWinner: boolean;
  onNameChange?: (name: string) => void;
}

export function ComparisonCard({
  face,
  name,
  scores,
  totalScore,
  rank,
  colorIndex,
  isWinner,
  onNameChange,
}: ComparisonCardProps) {
  const [ready, setReady] = useState(false);
  const colors = PERSON_COLORS[colorIndex % PERSON_COLORS.length];

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 120 + colorIndex * 80);
    return () => clearTimeout(t);
  }, [colorIndex]);

  return (
    <div
      className={cn(
        "card relative overflow-hidden transition-all duration-500 group",
        isWinner && "ring-1 ring-violet-600/50 shadow-xl shadow-violet-950/40",
        ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
      style={{
        transitionDelay: `${colorIndex * 100}ms`,
      }}
    >
      {/* Winner glow */}
      {isWinner && (
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/30 via-transparent to-purple-950/20 pointer-events-none" />
      )}

      {/* Winner badge */}
      {isWinner && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white text-[9px] font-bold uppercase tracking-wider shadow-lg shadow-violet-600/40">
            <Crown size={9} />
            Winner
          </span>
        </div>
      )}

      {/* Top section: face + name + score */}
      <div className="p-5 pb-4">
        <div className="flex items-start gap-4">
          {/* Face crop */}
          <div className="relative flex-shrink-0">
            <div
              className={cn(
                "w-20 h-20 rounded-xl overflow-hidden border-2 shadow-lg transition-all duration-300",
                isWinner
                  ? "border-violet-600/60 shadow-violet-950/50"
                  : `${colors.border} shadow-black/20`
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={face.cropUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Rank badge */}
            <div
              className={cn(
                "absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md border-2 border-zinc-900",
                isWinner
                  ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white"
                  : "bg-zinc-800 text-zinc-400"
              )}
            >
              #{rank}
            </div>
          </div>

          {/* Name + score */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-1.5 mb-1">
              <h4 className="text-zinc-100 font-semibold truncate">{name}</h4>
              {onNameChange && (
                <EditNameButton name={name} onSave={onNameChange} />
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={cn(
                  "text-3xl font-bold tabular-nums tracking-tight",
                  colors.text
                )}
              >
                {totalScore}
              </span>
              <span className="text-zinc-600 text-sm">/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Signal bars */}
      <div className="px-5 pb-5 space-y-3">
        {SIGNALS.map((s) => {
          const val = scores[s.key];
          return (
            <div key={s.key}>
              <div className="flex justify-between mb-1">
                <span className="text-zinc-500 text-xs">{s.label}</span>
                <span
                  className={cn(
                    "text-xs font-medium tabular-nums",
                    colors.text
                  )}
                >
                  {val}
                </span>
              </div>
              <div className="h-1.5 bg-zinc-900/80 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden",
                    colors.bar
                  )}
                  style={{
                    width: ready ? `${val}%` : "0%",
                    transitionDelay: `${colorIndex * 100 + 200}ms`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
