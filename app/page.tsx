"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useImageUpload } from "@/hooks/useImageUpload";
import { DropZone } from "@/components/upload/DropZone";
import { ProcessingScreen } from "@/components/processing/ProcessingScreen";

export default function UploadPage() {
  const router = useRouter();
  const { state, analyze, reset } = useAnalysis();
  const { file, preview, error: uploadError, ...uploadProps } = useImageUpload();

  useEffect(() => {
    if (state.status === "success") {
      sessionStorage.setItem("analysis_result", JSON.stringify(state.data));
      router.push("/analyze");
    }
  }, [state, router]);

  if (state.status === "processing" || state.status === "uploading") {
    return <ProcessingScreen preview={preview} />;
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-10 animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="p-2 bg-violet-500/20 rounded-xl">
            <Zap size={24} className="text-violet-400" />
          </div>
          <span className="text-zinc-500 text-sm font-medium uppercase tracking-widest">
            Visual Dominance AI
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Who Runs This Frame?
        </h1>
        <p className="text-zinc-400 mt-3 text-lg max-w-md">
          Upload a photo with 2 people. AI analyzes who commands the frame.
        </p>
        <p className="text-zinc-600 text-xs mt-2 max-w-sm mx-auto">
          Analysis covers photographic composition only — not attractiveness or personal qualities.
        </p>
      </div>

      {/* Upload area */}
      <DropZone
        preview={preview}
        error={uploadError}
        {...uploadProps}
      />

      {/* Analyze button */}
      {file && state.status !== "error" && (
        <button
          onClick={() => analyze(file)}
          className="mt-6 px-8 py-3.5 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-bold rounded-xl transition-all duration-150 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5 animate-slide-up"
        >
          Analyze Frame
        </button>
      )}

      {/* Error state */}
      {state.status === "error" && (
        <div className="mt-6 p-4 bg-red-950/50 border border-red-800 rounded-xl text-center max-w-sm animate-fade-in">
          <p className="text-red-400 font-medium text-sm">
            {state.code === "NOT_TWO_PEOPLE"
              ? "Couldn't detect exactly 2 people in this photo."
              : state.code === "POOR_QUALITY"
              ? "Image quality is too low to analyze."
              : state.message}
          </p>
          <button
            onClick={reset}
            className="mt-3 text-xs text-zinc-400 hover:text-white underline transition-colors"
          >
            Try a different image
          </button>
        </div>
      )}

      {/* Signal legend */}
      <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl w-full opacity-60">
        {[
          { label: "Spatial Presence", desc: "Frame area occupied" },
          { label: "Posture Dominance", desc: "Body orientation" },
          { label: "Facial Intensity", desc: "Gaze & expression" },
          { label: "Attention Capture", desc: "Compositional pull" },
        ].map((s) => (
          <div key={s.label} className="bg-zinc-900 rounded-xl p-3 text-center">
            <p className="text-zinc-300 text-xs font-semibold">{s.label}</p>
            <p className="text-zinc-600 text-xs mt-0.5">{s.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
