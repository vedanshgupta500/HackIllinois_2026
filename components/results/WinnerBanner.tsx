import type { AnalysisResult } from "@/types/analysis";

interface WinnerBannerProps {
  result: AnalysisResult;
}

export function WinnerBanner({ result }: WinnerBannerProps) {
  const winner = result.people[0];
  const isTie = result.is_tie;

  return (
    <div className="py-10 text-center animate-fade-in">
      <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mb-3">
        {isTie ? "Result" : "Dominates the frame"}
      </p>
      <h2 className="text-zinc-50 text-5xl sm:text-6xl font-semibold tracking-tight">
        {isTie ? "Tied" : winner.label}
      </h2>
      {!isTie && (
        <div className="flex items-baseline justify-center gap-2 mt-3">
          <span className="text-4xl font-semibold text-violet-400 tabular-nums">
            {winner.composite_score}
          </span>
          <span className="text-zinc-600 text-lg">/100</span>
        </div>
      )}
      {result.people.length >= 2 && !isTie && (
        <p className="text-zinc-600 text-xs mt-2 tabular-nums">
          +{(winner.composite_score - result.people[1].composite_score).toFixed(1)} over{" "}
          {result.people[1].label}
        </p>
      )}
      {isTie && (
        <p className="text-zinc-500 text-sm mt-2">
          Top scores within 3 points — too close to call
        </p>
      )}
    </div>
  );
}
