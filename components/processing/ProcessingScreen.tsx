"use client";

import { useEffect, useState } from "react";

const PHASES = [
  "Mapping spatial boundaries",
  "Analyzing posture vectors",
  "Calculating facial intensity",
  "Computing attention capture",
];

const PHASE_MS = 1300;

interface ProcessingScreenProps {
  preview: string | null;
}

export function ProcessingScreen({ preview }: ProcessingScreenProps) {
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const total = PHASES.length * PHASE_MS;
    const tick = setInterval(() => {
      setProgress((p) => Math.min(p + (50 / total) * 100, 96));
    }, 50);
    const timers = PHASES.map((_, i) =>
      setTimeout(() => setPhase(i), i * PHASE_MS)
    );
    return () => {
      clearInterval(tick);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-zinc-950 z-50 flex flex-col items-center justify-center">
      {/* Blurred preview backdrop */}
      {preview && (
        <div className="absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt=""
            className="w-full h-full object-cover opacity-[0.06] blur-2xl scale-110"
          />
        </div>
      )}

      {/* Scan line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="scan-line" />
      </div>

      <div className="relative z-10 w-full max-w-sm px-8 flex flex-col items-center gap-8">
        {/* Spinner ring */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border border-zinc-800" />
          <div className="absolute inset-0 rounded-full border border-t-violet-500 animate-spin" />
        </div>

        {/* Phase label */}
        <div className="text-center">
          <p key={phase} className="text-zinc-200 text-sm font-medium animate-fade-in">
            {PHASES[phase]}
          </p>
          <p className="text-zinc-600 text-xs mt-1 tabular-nums">
            {phase + 1} / {PHASES.length}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full space-y-1.5">
          <div className="h-px bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-600 rounded-full transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
