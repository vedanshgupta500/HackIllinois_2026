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
        "card relative overflow-hidden transition-all duration-500",
        isWinner && "border-l-4 border-l-blue-500",
        ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
      style={{
        transitionDelay: `${colorIndex * 100}ms`,
      }}
    >
      {/* Winner badge */}
      {isWinner && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[9px] font-semibold uppercase tracking-wider">
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
                "w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300",
                isWinner ? "border-blue-300" : `${colors.border}`
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
                "absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm border-2 border-white",
                isWinner ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 border-gray-200"
              )}
            >
              #{rank}
            </div>
          </div>

          {/* Name + score */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-1.5 mb-1">
              <h4 className="text-gray-900 font-semibold truncate">{name}</h4>
              {onNameChange && (
                <EditNameButton name={name} onSave={onNameChange} />
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={cn(
                  "text-3xl font-bold tabular-nums tracking-tight",
                  isWinner ? "text-blue-600" : colors.text
                )}
              >
                {totalScore}
              </span>
              <span className="text-gray-400 text-sm">/100</span>
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
                <span className="text-gray-500 text-xs">{s.label}</span>
                <span
                  className={cn(
                    "text-xs font-medium tabular-nums",
                    isWinner ? "text-blue-700" : colors.text
                  )}
                >
                  {val}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700 ease-out",
                    isWinner ? "bg-blue-500" : colors.bar
                  )}
                  style={{
                    width: ready ? `${val}%` : "0%",
                    transitionDelay: `${colorIndex * 100 + 200}ms`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
