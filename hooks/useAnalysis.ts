"use client";

import { useState } from "react";
import type { AnalysisResult, AnalyzeResponse } from "@/types/analysis";

type AnalysisState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "processing" }
  | { status: "success"; data: AnalysisResult }
  | { status: "error"; message: string; code: string };

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({ status: "idle" });

  async function analyze(file: File) {
    setState({ status: "uploading" });

    try {
      const base64 = await fileToBase64(file);
      const mimeType = file.type as "image/jpeg" | "image/png" | "image/webp";

      setState({ status: "processing" });

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mimeType }),
      });

      const result: AnalyzeResponse = await response.json();

      if (result.success) {
        setState({ status: "success", data: result.data });
      } else {
        setState({
          status: "error",
          message: result.error,
          code: result.code,
        });
      }
    } catch {
      setState({
        status: "error",
        message: "Network error. Please check your connection and try again.",
        code: "AI_ERROR",
      });
    }
  }

  function reset() {
    setState({ status: "idle" });
  }

  return { state, analyze, reset };
}
