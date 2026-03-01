"use client";

import { useState } from "react";
import type { AnalysisResult, AnalyzeResponse } from "@/types/analysis";
import { resizeImageInBrowser } from "@/lib/imageCompression";

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
      // Compress image before sending (max 1024x1024, quality 0.85)
      let processedFile = file;
      if (file.size > 2 * 1024 * 1024) {
        console.log("[useAnalysis] Compressing image to reduce file size...");
        const compressedBlob = await resizeImageInBrowser(file, 1024, 1024);
        processedFile = new File([compressedBlob], file.name, { type: "image/jpeg" });
        console.log(
          `[useAnalysis] Compressed from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`
        );
      }

      const base64 = await fileToBase64(processedFile);
      const mimeType = processedFile.type as "image/jpeg" | "image/png" | "image/webp";

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
