import type { AnalysisResult } from "@/types/analysis";

interface ExplanationPanelProps {
  result: AnalysisResult;
}

export function ExplanationPanel({ result }: ExplanationPanelProps) {
  return (
    <div className="card p-5 space-y-4">
      <div>
        <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mb-2">
          Analysis
        </p>
        <p className="text-zinc-300 text-sm leading-relaxed">{result.explanation}</p>
      </div>
      <div className="border-t border-zinc-800 pt-4">
        <p className="text-zinc-700 text-xs leading-relaxed">{result.disclaimer}</p>
      </div>
    </div>
  );
}
