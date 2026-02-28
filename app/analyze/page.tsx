"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AnalysisResult } from "@/types/analysis";
import { ResultsLayout } from "@/components/results/ResultsLayout";

export default function AnalyzePage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [image, setImage] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem("analysis_result");
    if (!stored) { router.replace("/"); return; }
    try {
      setResult(JSON.parse(stored));
      setImage(sessionStorage.getItem("analysis_image") ?? "");
    }
    catch { router.replace("/"); }
  }, [router]);

  if (!result) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border border-t-violet-500 border-zinc-800 rounded-full animate-spin" />
      </div>
    );
  }

  return <ResultsLayout result={result} image={image} />;
}
