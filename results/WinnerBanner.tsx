import type { AnalysisResult } from "@/types/analysis";
import { Trophy, Sparkles } from "lucide-react";

interface WinnerBannerProps {
  result: AnalysisResult;
}

export function WinnerBanner({ result }: WinnerBannerProps) {
  const winner = result.people[0];
  const isTie = result.is_tie;

  return (
    <div className="relative py-12 text-center animate-scale-in overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-transparent to-transparent opacity-60" />
      
      {/* Floating decorative elements */}
      {!isTie && (
        <>
          <div className="absolute top-4 left-1/4 animate-float">
            <Sparkles size={16} className="text-violet-400/40" />
          </div>
          <div className="absolute top-8 right-1/4 animate-float" style={{ animationDelay: "0.5s" }}>
            <Sparkles size={12} className="text-purple-400/40" />
          </div>
          <div className="absolute bottom-4 left-1/3 animate-float" style={{ animationDelay: "1s" }}>
            <Sparkles size={14} className="text-fuchsia-400/40" />
          </div>
        </>
      )}

      <div className="relative z-10">
        <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mb-3 animate-fade-in">
          {isTie ? "Analysis Complete" : "Frame Dominance"}
        </p>
        
        {!isTie && (
          <div className="flex items-center justify-center gap-3 mb-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <Trophy size={24} className="text-violet-400 animate-float" />
            <h2 className="text-zinc-50 text-5xl sm:text-6xl font-bold tracking-tight text-gradient">
              {winner.label}
            </h2>
            <Trophy size={24} className="text-violet-400 animate-float" style={{ animationDelay: "0.5s" }} />
          </div>
        )}
        
        {isTie && (
          <h2 className="text-zinc-50 text-5xl sm:text-6xl font-bold tracking-tight mb-2">
            Perfect Balance
          </h2>
        )}

        {!isTie && (
          <>
            <div className="flex items-baseline justify-center gap-2 mt-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <span className="text-5xl font-bold text-gradient tabular-nums">
                {winner.composite_score}
              </span>
              <span className="text-zinc-600 text-lg">/100</span>
            </div>
            {result.people.length >= 2 && (
              <div className="mt-3 animate-fade-in" style={{ animationDelay: "0.3s" }}>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-violet-950/50 border border-violet-800/40 text-violet-300 text-xs font-medium">
                  <Sparkles size={10} />
                  +{(winner.composite_score - result.people[1].composite_score).toFixed(1)} ahead of {result.people[1].label}
                </span>
              </div>
            )}
          </>
        )}

        {isTie && (
          <p className="text-zinc-500 text-sm mt-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Both subjects command equal visual presence
          </p>
        )}
      </div>
    </div>
  );
}
