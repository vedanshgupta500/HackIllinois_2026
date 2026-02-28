"use client";

import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import type { AnalysisResult } from "@/types/analysis";
import { WinnerBanner } from "./WinnerBanner";
import { SplitPersonCard } from "./SplitPersonCard";
import { RadarChartView } from "./RadarChartView";
import { ExplanationPanel } from "./ExplanationPanel";
import { ShareCard } from "./ShareCard";

interface ResultsLayoutProps {
  result: AnalysisResult;
}

export function ResultsLayout({ result }: ResultsLayoutProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-950 pb-16">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-900">
        <span className="text-zinc-600 text-sm font-medium">Who Runs This Frame?</span>
        {result.processing_time_ms && (
          <span className="text-zinc-700 text-xs">
            Analyzed in {(result.processing_time_ms / 1000).toFixed(1)}s
          </span>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Winner announcement */}
        <WinnerBanner result={result} />

        {/* Person cards side by side */}
        <div className="flex gap-3">
          <SplitPersonCard
            person={result.person_a}
            isWinner={result.winner === "person_a"}
            colorScheme="violet"
          />
          <SplitPersonCard
            person={result.person_b}
            isWinner={result.winner === "person_b"}
            colorScheme="amber"
          />
        </div>

        {/* Radar chart */}
        <RadarChartView result={result} />

        {/* Explanation + disclaimer */}
        <ExplanationPanel result={result} />

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all duration-150 hover:-translate-y-0.5 shadow-lg shadow-violet-500/25"
          >
            <RotateCcw size={16} />
            Try Another
          </button>
          <div className="flex items-center gap-1">
            <ShareCard result={result} />
          </div>
        </div>
      </div>
    </div>
  );
}
