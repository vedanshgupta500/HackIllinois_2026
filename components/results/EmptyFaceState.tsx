"use client";

import { Camera, Sun, Users, RefreshCw } from "lucide-react";

interface EmptyFaceStateProps {
  onRetry: () => void;
}

export function EmptyFaceState({ onRetry }: EmptyFaceStateProps) {
  return (
    <div className="card p-8 text-center max-w-md mx-auto animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-5">
        <Camera size={28} className="text-gray-400" />
      </div>

      <h3 className="text-gray-900 text-lg font-semibold mb-2">
        No faces detected
      </h3>
      <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
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
            className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-200"
          >
            <Icon size={14} className="text-gray-400 flex-shrink-0" />
            <span className="text-gray-600 text-xs">{tip}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        <RefreshCw size={14} />
        Try another photo
      </button>
    </div>
  );
}
