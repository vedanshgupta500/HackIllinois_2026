"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AnalysisResult } from "@/types/analysis";
import { ResultsLayout } from "@/components/results/ResultsLayout";

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-600 text-sm">Loading results...</p>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem("analysis_result");
    if (!stored) {
      router.replace("/");
      return;
    }
    try {
      setResult(JSON.parse(stored));
    } catch {
      router.replace("/");
    }
  }, [router]);

  if (!result) return <LoadingSkeleton />;
  return <ResultsLayout result={result} />;
}
