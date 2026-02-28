"use client";

import type { AnalysisResult } from "@/types/analysis";
import { Crown } from "lucide-react";

interface WinnerBannerProps {
  result: AnalysisResult;
}

export function WinnerBanner({ result }: WinnerBannerProps) {
  const isTie = result.winner === "tie";
  const winnerLabel = isTie
    ? null
    : result.winner === "person_a"
    ? "Person A"
    : "Person B";
  const winnerScore = isTie
    ? null
    : result.winner === "person_a"
    ? result.person_a.composite_score
    : result.person_b.composite_score;

  return (
    <div className="text-center py-8 px-4 animate-fade-in">
      {isTie ? (
        <>
          <p className="text-zinc-400 text-sm uppercase tracking-widest font-medium mb-2">
            Result
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-white">
            DEAD HEAT
          </h2>
          <p className="text-zinc-400 mt-2">
            Both subjects share the frame equally
          </p>
        </>
      ) : (
        <>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown size={16} className="text-amber-400" />
            <p className="text-zinc-400 text-sm uppercase tracking-widest font-medium">
              Dominates the frame
            </p>
            <Crown size={16} className="text-amber-400" />
          </div>
          <h2 className="text-5xl sm:text-6xl font-black text-white">
            {winnerLabel}
          </h2>
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="text-3xl font-black text-violet-400">
              {winnerScore}
            </span>
            <span className="text-zinc-600">/100</span>
            <span className="px-2 py-0.5 bg-violet-500/20 border border-violet-500/40 rounded-full text-violet-300 text-xs font-semibold uppercase tracking-wider">
              Dominant
            </span>
          </div>
          <p className="text-zinc-500 text-sm mt-2">
            {result.margin.toFixed(1)} point margin · {result.confidence}% confidence
          </p>
        </>
      )}
    </div>
  );
}
