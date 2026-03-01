"use client";

import { useState, useEffect, useRef } from "react";
import { X, Check, Edit3, Users } from "lucide-react";
import type { Face } from "@/types/analysis";
import { cn } from "@/lib/utils";

interface FaceLabelStepProps {
  faces: Face[];
  onConfirm: (names: Record<string, string>) => void;
  onBack: () => void;
}

export function FaceLabelStep({ faces, onConfirm, onBack }: FaceLabelStepProps) {
  const [names, setNames] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    faces.forEach((f, i) => {
      init[f.id] = `Person ${i + 1}`;
    });
    return init;
  });
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const firstInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => firstInput.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  const allNamed = Object.values(names).every((n) => n.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-violet-950/60 border border-violet-800/40">
              <Users size={18} className="text-violet-400" />
            </div>
            <div>
              <h3 className="text-zinc-100 text-lg font-semibold">
                Who are these people?
              </h3>
              <p className="text-zinc-500 text-sm">
                {faces.length} {faces.length === 1 ? "face" : "faces"} detected
                — name each person
              </p>
            </div>
          </div>
        </div>

        {/* Face list */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {faces.map((face, i) => (
            <div
              key={face.id}
              className={cn(
                "flex items-center gap-4 p-3 rounded-xl border transition-all duration-200",
                focusedId === face.id
                  ? "border-violet-600/60 bg-violet-950/20"
                  : "border-zinc-800 bg-zinc-950/40"
              )}
            >
              {/* Face thumbnail */}
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-zinc-700 shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={face.cropUrl}
                    alt={`Face ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-zinc-400">
                    {i + 1}
                  </span>
                </div>
              </div>

              {/* Name input */}
              <div className="flex-1 min-w-0">
                <label className="text-zinc-600 text-[10px] uppercase tracking-wider font-medium block mb-1">
                  Person {i + 1}
                </label>
                <input
                  ref={i === 0 ? firstInput : undefined}
                  type="text"
                  value={names[face.id] || ""}
                  onChange={(e) =>
                    setNames((prev) => ({
                      ...prev,
                      [face.id]: e.target.value,
                    }))
                  }
                  onFocus={() => setFocusedId(face.id)}
                  onBlur={() => setFocusedId(null)}
                  placeholder={`Name for Person ${i + 1}`}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/30 transition-all"
                />
              </div>

              {/* Confidence badge */}
              <div className="flex-shrink-0 text-right">
                <span className="text-[10px] text-zinc-600 font-medium">
                  {Math.round(face.confidence * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => allNamed && onConfirm(names)}
            disabled={!allNamed}
            className={cn(
              "inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              allNamed
                ? "bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-600/25"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            )}
          >
            <Check size={16} />
            Continue to Analysis
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Inline edit badge for results screen ── */
export function EditNameButton({
  name,
  onSave,
}: {
  name: string;
  onSave: (n: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors"
        title="Edit name"
      >
        <Edit3 size={10} />
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSave(value);
            setEditing(false);
          }
          if (e.key === "Escape") setEditing(false);
        }}
        onBlur={() => {
          onSave(value);
          setEditing(false);
        }}
        className="w-20 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-xs text-zinc-100 focus:outline-none focus:border-violet-600"
      />
    </span>
  );
}
