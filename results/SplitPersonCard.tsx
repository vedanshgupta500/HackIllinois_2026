"use client";

import { useEffect, useState, useRef } from "react";
import type { PersonAnalysis } from "@/types/analysis";
import { PERSON_COLORS, cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

const SIGNALS = [
  { key: "spatial_presence"  as const, label: "Spatial"   },
  { key: "posture_dominance" as const, label: "Posture"   },
  { key: "facial_intensity"  as const, label: "Facial"    },
  { key: "attention_capture" as const, label: "Attention" },
];

interface PersonCardProps {
  person: PersonAnalysis;
  colorIndex: number;
  originalImage: string | null;
}

export function SplitPersonCard({ person, colorIndex, originalImage }: PersonCardProps) {
  const [ready, setReady] = useState(false);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = PERSON_COLORS[colorIndex % PERSON_COLORS.length];
  const isWinner = person.rank === 1;

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Crop image based on person position
  useEffect(() => {
    if (!originalImage || !canvasRef.current) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Determine crop region based on position
      const imgWidth = img.width;
      const imgHeight = img.height;
      let cropX = 0;
      let cropY = 0;
      let cropWidth = imgWidth / 2;
      let cropHeight = imgHeight;

      // Adjust crop based on position description
      if (person.position.includes("left")) {
        cropX = 0;
        cropWidth = imgWidth / 2;
      } else if (person.position.includes("right")) {
        cropX = imgWidth / 2;
        cropWidth = imgWidth / 2;
      } else if (person.position.includes("center")) {
        cropX = imgWidth / 4;
        cropWidth = imgWidth / 2;
      }

      // Set canvas size
      const targetSize = 200;
      canvas.width = targetSize;
      canvas.height = targetSize;

      // Draw cropped and scaled image
      ctx.drawImage(
        img,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, targetSize, targetSize
      );

      setCroppedImage(canvas.toDataURL("image/jpeg", 0.9));
    };

    img.src = originalImage;
  }, [originalImage, person.position]);

  return (
    <div
      className={cn(
        "card p-4 relative transition-all duration-300 overflow-hidden group hover:scale-[1.02]",
        isWinner && "ring-2 ring-violet-600/40 shadow-xl shadow-violet-950/30"
      )}
    >
      {/* Animated gradient background for winner */}
      {isWinner && (
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/40 via-transparent to-purple-950/30 animate-pulse-slow opacity-50" />
      )}

      {/* Winner badge */}
      {isWinner && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-violet-600/50">
            <Sparkles size={10} className="animate-pulse" />
            Winner
          </span>
        </div>
      )}

      {/* Person image */}
      {croppedImage && (
        <div className="relative mb-3 mt-2">
          <div className={cn(
            "w-full aspect-square rounded-xl overflow-hidden border-2 shadow-md transition-all duration-200",
            colors.border,
            "group-hover:shadow-lg"
          )}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={croppedImage}
              alt={person.label}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Rank badge overlay */}
          <div className={cn(
            "absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg border-2 border-zinc-900",
            isWinner ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white" : "bg-zinc-800 text-zinc-400 border-zinc-700"
          )}>
            #{person.rank}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 mb-4">
        <p className="text-zinc-500 text-[10px] uppercase tracking-wider">{person.position}</p>
        <p className="text-zinc-100 text-sm font-semibold mt-0.5">{person.label}</p>
        <div className="flex items-baseline gap-2 mt-2">
          <p className={cn("text-3xl font-bold tabular-nums", colors.text)}>
            {person.composite_score}
          </p>
          <span className="text-zinc-600 text-sm">/100</span>
        </div>
      </div>

      {/* Signal bars */}
      <div className="relative z-10 space-y-2.5">
        {SIGNALS.map((s) => {
          const val = person.signals[s.key];
          return (
            <div key={s.key}>
              <div className="flex justify-between mb-1">
                <span className="text-zinc-500 text-xs">{s.label}</span>
                <span className={cn("text-xs font-medium tabular-nums", colors.text)}>{val}</span>
              </div>
              <div className="h-1.5 bg-zinc-900/80 rounded-full overflow-hidden shadow-inner">
                <div
                  className={cn(
                    "h-full rounded-full signal-bar relative overflow-hidden",
                    colors.bar
                  )}
                  style={{ width: ready ? `${val}%` : "0%" }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
