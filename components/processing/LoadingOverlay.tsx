"use client";

import { useEffect, useState } from "react";

const DETECT_PHASES = [
  "Scanning for faces…",
  "Mapping facial boundaries…",
  "Extracting face crops…",
  "Preparing analysis…",
];

const ANALYZE_PHASES = [
  "Mapping spatial boundaries…",
  "Analyzing posture vectors…",
  "Calculating facial intensity…",
  "Computing attention capture…",
  "Determining frame dominance…",
];

interface LoadingOverlayProps {
  preview: string | null;
  mode: "detecting" | "analyzing";
}

export function LoadingOverlay({ preview, mode }: LoadingOverlayProps) {
  const phases = mode === "detecting" ? DETECT_PHASES : ANALYZE_PHASES;
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setPhase(0);
    setProgress(0);

    const phaseMs = mode === "detecting" ? 800 : 1300;
    const total = phases.length * phaseMs;
    const tick = setInterval(() => {
      setProgress((p) => Math.min(p + (50 / total) * 100, 96));
    }, 50);
    const timers = phases.map((_, i) =>
      setTimeout(() => setPhase(i), i * phaseMs)
    );
    return () => {
      clearInterval(tick);
      timers.forEach(clearTimeout);
    };
  }, [mode, phases]);

  return (
    <div className="fixed inset-0 bg-zinc-950 z-50 flex flex-col items-center justify-center overflow-hidden">
      {/* Blurred backdrop */}
      {preview && (
        <div className="absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt=""
            className="w-full h-full object-cover opacity-[0.06] blur-3xl scale-110"
          />
        </div>
      )}

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl animate-pulse-slow" />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl animate-pulse-slow"
        style={{ animationDelay: "1.5s" }}
      />

      {/* Scan line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="scan-line" />
      </div>

      <div className="relative z-10 w-full max-w-sm px-8 flex flex-col items-center gap-8">
        {/* Spinner ring */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-zinc-800" />
          <div className="absolute inset-0 rounded-full border-2 border-t-violet-500 border-r-violet-500/50 animate-spin shadow-lg shadow-violet-500/30" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-violet-950/40 to-purple-950/40" />
        </div>

        {/* Phase label */}
        <div className="text-center">
          <p
            key={`${mode}-${phase}`}
            className="text-zinc-100 text-base font-semibold animate-fade-in mb-1 text-gradient"
          >
            {phases[phase]}
          </p>
          <p className="text-zinc-600 text-xs tabular-nums">
            Step {phase + 1} of {phases.length}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full space-y-1.5">
          <div className="relative h-1.5 bg-zinc-900 rounded-full overflow-hidden shadow-inner">
            <div
              className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 rounded-full transition-all duration-200 ease-linear"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Mode label */}
        <p className="text-zinc-700 text-xs uppercase tracking-widest">
          {mode === "detecting" ? "Face Detection" : "Frame Analysis"}
        </p>
      </div>
    </div>
  );
}
