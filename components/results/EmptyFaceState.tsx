"use client";

import { Camera, Sun, Users, RefreshCw } from "lucide-react";

interface EmptyFaceStateProps {
  onRetry: () => void;
}

export function EmptyFaceState({ onRetry }: EmptyFaceStateProps) {
  return (
    <div className="card p-8 text-center max-w-md mx-auto animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-5">
        <Camera size={28} className="text-zinc-500" />
      </div>

      <h3 className="text-zinc-200 text-lg font-semibold mb-2">
        No faces detected
      </h3>
      <p className="text-zinc-500 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
        We couldn&apos;t find any faces in this photo. Try a different image with
        clear, well-lit faces.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { icon: Sun, tip: "Good lighting" },
          { icon: Users, tip: "Faces visible" },
          { icon: Camera, tip: "Clear photo" },
        ].map(({ icon: Icon, tip }) => (
          <div
            key={tip}
            className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800"
          >
            <Icon size={14} className="text-zinc-500 flex-shrink-0" />
            <span className="text-zinc-400 text-xs">{tip}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors shadow-lg shadow-violet-600/25"
      >
        <RefreshCw size={14} />
        Try another photo
      </button>
    </div>
  );
}
