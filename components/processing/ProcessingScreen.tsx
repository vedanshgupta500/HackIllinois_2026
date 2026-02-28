"use client";

import { useEffect, useState } from "react";

const PHASES = [
  { label: "Mapping spatial boundaries", icon: "⬜" },
  { label: "Analyzing posture vectors", icon: "🦴" },
  { label: "Calculating facial intensity", icon: "👁" },
  { label: "Computing attention capture", icon: "🎯" },
];
const PHASE_DURATION_MS = 1200;

interface ProcessingScreenProps {
  preview: string | null;
}

export function ProcessingScreen({ preview }: ProcessingScreenProps) {
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalDuration = PHASES.length * PHASE_DURATION_MS;

    // Smooth progress bar
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 100 / (totalDuration / 50), 98));
    }, 50);

    // Phase advancement
    const phaseTimers = PHASES.map((_, i) =>
      setTimeout(() => setPhase(i), i * PHASE_DURATION_MS)
    );

    return () => {
      clearInterval(progressInterval);
      phaseTimers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center z-50">
      {/* Background image with overlay */}
      {preview && (
        <div className="absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt=""
            className="w-full h-full object-cover opacity-10 blur-sm scale-105"
          />
          <div className="absolute inset-0 bg-zinc-950/70" />
        </div>
      )}

      {/* Scan line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="scan-overlay" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-8 max-w-sm w-full">
        {/* Animated rings */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full border border-violet-500/30 animate-ping" />
          <div className="absolute w-16 h-16 rounded-full border border-violet-500/50 animate-pulse" />
          <div className="w-12 h-12 rounded-full bg-violet-500/20 border border-violet-500 flex items-center justify-center">
            <span className="text-2xl">{PHASES[phase].icon}</span>
          </div>
        </div>

        {/* Phase label */}
        <div className="text-center">
          <p className="text-white font-semibold text-lg animate-count-up" key={phase}>
            {PHASES[phase].label}
            <span className="text-violet-400 animate-pulse">...</span>
          </p>
          <p className="text-zinc-500 text-sm mt-1">
            Phase {phase + 1} of {PHASES.length}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full">
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-150 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-zinc-600">Analyzing</span>
            <span className="text-xs text-zinc-600">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Phase dots */}
        <div className="flex gap-2">
          {PHASES.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i <= phase ? "bg-violet-500 scale-110" : "bg-zinc-700"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
