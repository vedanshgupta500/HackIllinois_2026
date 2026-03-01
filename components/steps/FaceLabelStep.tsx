"use client";

import { useState, useEffect, useRef } from "react";
import { X, Check, Edit3, Users, MapPin } from "lucide-react";
import type { Face } from "@/types/analysis";
import { cn } from "@/lib/utils";

const PERSON_COLORS = [
  { border: "border-violet-500", bg: "bg-violet-500/20", text: "text-violet-400", ring: "ring-violet-500/50", stroke: "rgb(139, 92, 246)" },
  { border: "border-cyan-500", bg: "bg-cyan-500/20", text: "text-cyan-400", ring: "ring-cyan-500/50", stroke: "rgb(6, 182, 212)" },
  { border: "border-pink-500", bg: "bg-pink-500/20", text: "text-pink-400", ring: "ring-pink-500/50", stroke: "rgb(236, 72, 153)" },
  { border: "border-amber-500", bg: "bg-amber-500/20", text: "text-amber-400", ring: "ring-amber-500/50", stroke: "rgb(245, 158, 11)" },
  { border: "border-emerald-500", bg: "bg-emerald-500/20", text: "text-emerald-400", ring: "ring-emerald-500/50", stroke: "rgb(16, 185, 129)" },
];

interface FaceLabelStepProps {
  faces: Face[];
  preview: string | null;
  onConfirm: (names: Record<string, string>) => void;
  onBack: () => void;
}

export function FaceLabelStep({ faces, preview, onConfirm, onBack }: FaceLabelStepProps) {
  const [names, setNames] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    faces.forEach((f, i) => {
      init[f.id] = `Person ${i + 1}`;
    });
    console.log('[FaceLabelStep] Initializing with', faces.length, 'faces:', faces);
    return init;
  });
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const firstInput = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const t = setTimeout(() => firstInput.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (preview && imageRef.current) {
      const img = new Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
      };
      img.src = preview;
    }
  }, [preview]);

  const allNamed = Object.values(names).every((n) => n.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-6xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-violet-950/60 border border-violet-800/40">
              <Users size={18} className="text-violet-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-zinc-100 text-lg font-semibold">
                Name each person in the photo
              </h3>
              <p className="text-zinc-500 text-sm">
                <strong className="text-violet-400">{faces.length}</strong> {faces.length === 1 ? "person" : "people"} detected
                {faces.length > 1 && " — hover or tap to highlight their location"}
              </p>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* Image with face markers */}
          <div className="relative bg-zinc-950/40 rounded-xl border border-zinc-800 overflow-hidden">
            <div className="aspect-[4/3] relative">
              {preview && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imageRef}
                    src={preview}
                    alt="Uploaded photo"
                    className="w-full h-full object-contain"
                  />
                  {/* Face bounding boxes */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {faces.map((face, i) => {
                      const colors = PERSON_COLORS[i % PERSON_COLORS.length];
                      const isHighlighted = hoveredId === face.id || focusedId === face.id;
                      
                      // Calculate display coordinates
                      const imgElement = imageRef.current;
                      if (!imgElement) return null;
                      
                      const displayWidth = imgElement.offsetWidth;
                      const displayHeight = imgElement.offsetHeight;
                      const scaleX = displayWidth / imageSize.width;
                      const scaleY = displayHeight / imageSize.height;
                      
                      // Use contain logic to center the image
                      const imageAspect = imageSize.width / imageSize.height;
                      const displayAspect = displayWidth / displayHeight;
                      
                      let offsetX = 0;
                      let offsetY = 0;
                      let actualScaleX = scaleX;
                      let actualScaleY = scaleY;
                      
                      if (imageAspect > displayAspect) {
                        // Image is wider - fit to width
                        actualScaleY = scaleX;
                        offsetY = (displayHeight - imageSize.height * actualScaleY) / 2;
                      } else {
                        // Image is taller - fit to height
                        actualScaleX = scaleY;
                        offsetX = (displayWidth - imageSize.width * actualScaleX) / 2;
                      }
                      
                      const x = face.bbox.x * actualScaleX + offsetX;
                      const y = face.bbox.y * actualScaleY + offsetY;
                      const w = face.bbox.w * actualScaleX;
                      const h = face.bbox.h * actualScaleY;
                      
                      return (
                        <g key={face.id}>
                          <rect
                            x={x}
                            y={y}
                            width={w}
                            height={h}
                            fill="none"
                            stroke={isHighlighted ? colors.stroke : 'rgb(113, 113, 122)'}
                            strokeWidth={isHighlighted ? 3 : 2}
                            strokeDasharray={isHighlighted ? "none" : "5,5"}
                            className="transition-all duration-200"
                            opacity={isHighlighted ? 1 : 0.6}
                          />
                          <circle
                            cx={x + w / 2}
                            cy={y - 12}
                            r={14}
                            fill={isHighlighted ? colors.stroke : 'rgb(39, 39, 42)'}
                            className="transition-all duration-200"
                          />
                          <text
                            x={x + w / 2}
                            y={y - 8}
                            textAnchor="middle"
                            fill="white"
                            fontSize="12"
                            fontWeight="bold"
                          >
                            {i + 1}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </>
              )}
            </div>
            <div className="px-4 py-3 bg-zinc-900/50 border-t border-zinc-800">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <MapPin size={12} />
                <span>Hover over inputs to highlight faces in the photo</span>
              </div>
            </div>
          </div>

          {/* Face list with inputs */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {faces.map((face, i) => {
              const colors = PERSON_COLORS[i % PERSON_COLORS.length];
              const isHighlighted = hoveredId === face.id || focusedId === face.id;
              
              return (
                <div
                  key={face.id}
                  onMouseEnter={() => setHoveredId(face.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-xl border-2 transition-all duration-200",
                    isHighlighted
                      ? `${colors.border} ${colors.bg} shadow-lg`
                      : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700"
                  )}
                >
                  {/* Person number badge */}
                  <div className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-all",
                    isHighlighted ? `${colors.bg} ${colors.text} border-2 ${colors.border}` : "bg-zinc-800 text-zinc-400 border-2 border-zinc-700"
                  )}>
                    {i + 1}
                  </div>

                  {/* Face thumbnail */}
                  <div className="relative flex-shrink-0">
                    <div className={cn(
                      "w-14 h-14 rounded-xl overflow-hidden border-2 shadow-md transition-all",
                      isHighlighted ? colors.border : "border-zinc-700"
                    )}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={face.cropUrl}
                        alt={`Face ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Name input */}
                  <div className="flex-1 min-w-0">
                    <label className={cn(
                      "text-[10px] uppercase tracking-wider font-medium block mb-1 transition-colors",
                      isHighlighted ? colors.text : "text-zinc-600"
                    )}>
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
                      placeholder={`Enter name...`}
                      className={cn(
                        "w-full bg-zinc-900 border-2 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-all",
                        isHighlighted 
                          ? `${colors.border} ring-2 ${colors.ring}` 
                          : "border-zinc-700 focus:border-violet-600 focus:ring-1 focus:ring-violet-600/30"
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
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
