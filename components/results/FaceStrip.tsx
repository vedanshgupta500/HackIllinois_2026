"use client";

import type { Face } from "@/types/analysis";
import { EditNameButton } from "@/components/steps/FaceLabelStep";
import { cn } from "@/lib/utils";
import { PERSON_COLORS } from "@/lib/utils";

interface FaceStripProps {
  faces: Face[];
  names: Record<string, string>;
  selectedIds?: string[];
  onSelect?: (id: string) => void;
  onNameChange?: (id: string, name: string) => void;
  compact?: boolean;
}

export function FaceStrip({
  faces,
  names,
  selectedIds = [],
  onSelect,
  onNameChange,
  compact = false,
}: FaceStripProps) {
  if (faces.length === 0) return null;

  return (
    <div className="w-full">
      <div
        className={cn(
          "flex gap-3 overflow-x-auto pb-2 scrollbar-hide",
          compact ? "justify-center" : "justify-start px-1"
        )}
      >
        {faces.map((face, i) => {
          const isSelected = selectedIds.includes(face.id);
          const colors = PERSON_COLORS[i % PERSON_COLORS.length];

          return (
            <button
              key={face.id}
              onClick={() => onSelect?.(face.id)}
              className={cn(
                "flex-shrink-0 flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200 group",
                onSelect && "cursor-pointer",
                isSelected
                  ? "bg-violet-950/40 border border-violet-700/50 shadow-lg shadow-violet-950/30"
                  : "bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700"
              )}
            >
              {/* Face image */}
              <div className="relative">
                <div
                  className={cn(
                    "rounded-xl overflow-hidden border-2 transition-all duration-200 shadow-md",
                    compact ? "w-12 h-12" : "w-16 h-16",
                    isSelected
                      ? `${colors.border} shadow-lg`
                      : "border-zinc-700 group-hover:border-zinc-600"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={face.cropUrl}
                    alt={names[face.id] || `Person ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-600 border-2 border-zinc-900 flex items-center justify-center">
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 8 8"
                      fill="none"
                    >
                      <path
                        d="M1 4L3 6L7 2"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                )}

                {/* Confidence dot */}
                <div
                  className={cn(
                    "absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full border border-zinc-900",
                    face.confidence > 0.8
                      ? "bg-emerald-500"
                      : face.confidence > 0.6
                        ? "bg-amber-500"
                        : "bg-red-500"
                  )}
                />
              </div>

              {/* Name */}
              <div className="flex items-center gap-1 max-w-[80px]">
                <span
                  className={cn(
                    "text-xs font-medium truncate",
                    isSelected ? "text-zinc-200" : "text-zinc-400"
                  )}
                >
                  {names[face.id] || `Person ${i + 1}`}
                </span>
                {onNameChange && !compact && (
                  <EditNameButton
                    name={names[face.id] || `Person ${i + 1}`}
                    onSave={(n) => onNameChange(face.id, n)}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
