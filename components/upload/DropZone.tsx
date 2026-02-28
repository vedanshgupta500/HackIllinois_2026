"use client";

import { Upload, ImageIcon, X } from "lucide-react";

interface DropZoneProps {
  preview: string | null;
  isDragging: boolean;
  error: string | null;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  clear: () => void;
}

export function DropZone({
  preview,
  isDragging,
  error,
  onDrop,
  onDragOver,
  onDragLeave,
  onInputChange,
  inputRef,
  clear,
}: DropZoneProps) {
  return (
    <div className="w-full max-w-xl">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !preview && inputRef.current?.click()}
        className={`
          relative rounded-2xl border-2 transition-all duration-200 overflow-hidden
          ${!preview ? "cursor-pointer" : ""}
          ${
            isDragging
              ? "border-violet-500 bg-violet-950/20 shadow-lg shadow-violet-500/20"
              : preview
              ? "border-zinc-700 bg-zinc-900"
              : "border-dashed border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:bg-zinc-800/50"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onInputChange}
        />

        {preview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Upload preview"
              className="w-full max-h-80 object-contain bg-zinc-950"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                clear();
              }}
              className="absolute top-3 right-3 p-1.5 bg-zinc-900/90 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
              aria-label="Remove image"
            >
              <X size={16} />
            </button>
            <div className="px-4 py-3 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2">
              <ImageIcon size={14} className="text-violet-400" />
              <span className="text-sm text-zinc-400">Image ready for analysis</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-16 px-8">
            <div
              className={`p-4 rounded-2xl transition-colors ${
                isDragging ? "bg-violet-500/20" : "bg-zinc-800"
              }`}
            >
              <Upload
                size={32}
                className={isDragging ? "text-violet-400" : "text-zinc-400"}
              />
            </div>
            <div className="text-center">
              <p className="text-zinc-300 font-medium">
                {isDragging ? "Drop it here" : "Drop a photo or click to upload"}
              </p>
              <p className="text-zinc-500 text-sm mt-1">
                Must contain exactly 2 people · JPEG, PNG, WebP · Max 5MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-400 text-center animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
}
