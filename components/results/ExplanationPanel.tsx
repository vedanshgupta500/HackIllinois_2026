"use client";

import { Info } from "lucide-react";
import type { AnalysisResult } from "@/types/analysis";

interface ExplanationPanelProps {
  result: AnalysisResult;
}

export function ExplanationPanel({ result }: ExplanationPanelProps) {
  return (
    <div className="bg-zinc-900 rounded-2xl p-5 space-y-4">
      {/* AI Explanation */}
      <div>
        <p className="text-zinc-400 text-xs uppercase tracking-widest font-medium mb-2">
          AI Analysis
        </p>
        <p className="text-zinc-200 leading-relaxed">{result.explanation}</p>
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-800" />

      {/* Disclaimer */}
      <div className="flex gap-3 text-xs text-zinc-600">
        <Info size={14} className="flex-shrink-0 mt-0.5 text-zinc-700" />
        <p>{result.disclaimer}</p>
      </div>
    </div>
  );
}
