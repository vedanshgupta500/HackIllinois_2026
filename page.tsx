"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useImageUpload } from "@/hooks/useImageUpload";
import { DropZone } from "@/components/upload/DropZone";
import { ProcessingScreen } from "@/components/processing/ProcessingScreen";
import { Navbar } from "@/components/ui/Navbar";
import { ScanCounter } from "@/components/ui/ScanCounter";
import { Button } from "@/components/ui/Button";

const SIGNALS = [
  { label: "Spatial Presence", desc: "Frame area occupied" },
  { label: "Posture",          desc: "Body orientation"   },
  { label: "Facial Intensity", desc: "Gaze & expression"  },
  { label: "Attention Capture",desc: "Compositional pull" },
];

export default function UploadPage() {
  const router = useRouter();
  const { state, analyze, reset } = useAnalysis();
  const { file, preview, error: uploadError, ...uploadProps } = useImageUpload();

  useEffect(() => {
    if (state.status === "success") {
      sessionStorage.setItem("analysis_result", JSON.stringify(state.data));
      if (preview) {
        sessionStorage.setItem("analysis_image", preview);
      }
      router.push("/analyze");
    }
  }, [state, router, preview]);

  if (state.status === "processing" || state.status === "uploading") {
    return <ProcessingScreen preview={preview} />;
  }

  return (
    <>
      <Navbar />

      <main className="min-h-[calc(100vh-56px)] flex flex-col relative overflow-hidden">
        {/* Animated background gradients */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />
        
        {/* ── Hero ── */}
        <section className="flex-1 flex flex-col items-center justify-center py-16 px-6 relative z-10">
          <div className="w-full max-w-prose flex flex-col items-center gap-8 animate-fade-in">

            {/* Eyebrow */}
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-violet-500 animate-pulse" />
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">
                Compositional AI
              </p>
              <div className="w-1 h-1 rounded-full bg-violet-500 animate-pulse" style={{ animationDelay: "0.5s" }} />
            </div>

            {/* Headline */}
            <div className="text-center space-y-3">
              <h1 className="text-zinc-50 text-gradient animate-float">
                Who Runs This Frame?
              </h1>
              <p className="text-zinc-400 text-base max-w-sm mx-auto leading-relaxed">
                Upload a photo with 2–6 people. AI scores who commands the frame.
              </p>
            </div>

            {/* Upload area */}
            <div className="w-full">
              <DropZone preview={preview} error={uploadError} {...uploadProps} />
            </div>

            {/* Primary CTA */}
            {file && state.status !== "error" && (
              <Button size="lg" onClick={() => analyze(file)} className="w-full">
                Analyze Frame
              </Button>
            )}

            {/* Error */}
            {state.status === "error" && (
              <div className="w-full p-4 rounded-xl border border-red-900/60 bg-red-950/30 text-center animate-fade-in">
                <p className="text-red-400 text-sm">
                  {state.code === "NO_PEOPLE"
                    ? "No people detected in this photo."
                    : state.code === "TOO_MANY_PEOPLE"
                    ? "Too many people (max 6). Try cropping."
                    : state.code === "POOR_QUALITY"
                    ? "Image quality is too low to analyze."
                    : state.message}
                </p>
                <button
                  onClick={reset}
                  className="mt-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline"
                >
                  Try a different image
                </button>
              </div>
            )}

            {/* Scan counter */}
            <ScanCounter />

          </div>
        </section>

        {/* ── Signal legend ── */}
        <section className="border-t border-zinc-900 py-8">
          <div className="container">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-900 rounded-xl overflow-hidden border border-zinc-900">
              {SIGNALS.map((s) => (
                <div key={s.label} className="bg-zinc-950 px-4 py-4">
                  <p className="text-zinc-300 text-xs font-medium">{s.label}</p>
                  <p className="text-zinc-600 text-xs mt-0.5">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-zinc-900 py-5">
          <div className="container">
            <p className="text-zinc-700 text-xs text-center">
              Analysis covers photographic composition only — not attractiveness or personal qualities.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
