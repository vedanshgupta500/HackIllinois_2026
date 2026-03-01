"use client";

import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import type { AnalysisResult } from "@/types/analysis";
import { WinnerBanner } from "./WinnerBanner";
import { SplitPersonCard } from "./SplitPersonCard";
import { RadarChartView } from "./RadarChartView";
import { ExplanationPanel } from "./ExplanationPanel";
import { ShareCard } from "./ShareCard";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";

interface ResultsLayoutProps {
  result: AnalysisResult;
  originalImage: string | null;
}

export function ResultsLayout({ result, originalImage }: ResultsLayoutProps) {
  const router = useRouter();
  const colClass =
    result.people.length === 2
      ? "grid-cols-2"
      : result.people.length === 3
      ? "grid-cols-3"
      : "grid-cols-2 sm:grid-cols-4";

  return (
    <>
      <Navbar />
      <main className="pb-16 relative overflow-hidden">
        {/* Background gradient decorations */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
        
        <div className="container max-w-prose py-2 relative z-10">

          {/* Winner */}
          <WinnerBanner result={result} />

          <div className="space-y-3">
            {/* Person cards grid */}
            <div className={`grid gap-3 ${colClass}`}>
              {result.people.map((person, i) => (
                <SplitPersonCard 
                  key={person.label} 
                  person={person} 
                  colorIndex={i}
                  originalImage={originalImage}
                />
              ))}
            </div>

            {/* Radar */}
            <RadarChartView result={result} />

            {/* Explanation */}
            <ExplanationPanel result={result} />

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <Button variant="primary" onClick={() => router.push("/")}>
                <RotateCcw size={14} />
                Analyze another
              </Button>
              <div className="flex items-center gap-1">
                <ShareCard result={result} />
              </div>
            </div>

            {result.processing_time_ms && (
              <p className="text-zinc-700 text-xs text-center tabular-nums">
                Analyzed in {(result.processing_time_ms / 1000).toFixed(1)}s
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
